import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Issue, Fine, Book, ReadingList, ReadingListBook } from '../types';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckSquare, Award, CreditCard, AlertTriangle, BookOpen, ToggleLeft, Trash2, CheckCircle2, Bookmark, Flame, Star, MessageSquare, Send, X } from 'lucide-react';

export const StudentLibrary: React.FC = () => {
  const { profile } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [booksMap, setBooksMap] = useState<{ [bookId: string]: Book }>({});
  const [loading, setLoading] = useState(true);

  // Reading Lists
  const [shelfItems, setShelfItems] = useState<ReadingListBook[]>([]);
  const [activeTab, setActiveTab] = useState<'reading' | 'want_to_read' | 'read'>('reading');

  const [simulatingPayment, setSimulatingPayment] = useState(false);
  const [opFeedback, setOpFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Completed book reviewing states
  const [selectedBookToReview, setSelectedBookToReview] = useState<Book | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchLibraryData();
      fetchReadingList();
    }
  }, [profile]);

  const fetchLibraryData = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      // 1. Fetch Issues
      const issuesQuery = query(collection(db, 'issues'), where('studentId', '==', profile.uid));
      const issueSnapshot = await getDocs(issuesQuery);
      const fetchedIssues: Issue[] = [];
      issueSnapshot.forEach(d => {
        fetchedIssues.push({ id: d.id, ...d.data() } as any);
      });
      setIssues(fetchedIssues);

      // calculate real-time live overdue fine on each active issue
      const FINE_RATE = 5;
      const today = new Date();
      
      const updatedIssuesList = fetchedIssues.map(issue => {
        if (issue.status === 'active' || issue.status === 'overdue') {
          const dueDateObj = new Date(issue.dueDate);
          if (today > dueDateObj) {
            const diffTime = Math.abs(today.getTime() - dueDateObj.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const calculatedFine = diffDays * FINE_RATE;
            return {
              ...issue,
              fineAmount: calculatedFine,
              status: 'overdue' as const
            };
          }
        }
        return issue;
      });
      
      setIssues(updatedIssuesList);

      // 2. Fetch Fines
      const finesQuery = query(collection(db, 'fines'), where('studentId', '==', profile.uid));
      const finesSnapshot = await getDocs(finesQuery);
      const fetchedFines: Fine[] = [];
      finesSnapshot.forEach(d => {
        fetchedFines.push({ id: d.id, ...d.data() } as any);
      });
      setFines(fetchedFines);

      // 3. Fetch Books details map for display
      const booksSnapshot = await getDocs(collection(db, 'books'));
      const map: { [bookId: string]: Book } = {};
      booksSnapshot.forEach(b => {
        const bk = b.data() as Book;
        map[bk.bookId] = bk;
      });
      setBooksMap(map);

    } catch (err) {
      console.error("Error loading library details:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReadingList = async () => {
    if (!profile) return;
    try {
      // Fetch user's custom reading list or create defaults
      const listsQuery = query(collection(db, 'readingLists'), where('studentId', '==', profile.uid));
      const snap = await getDocs(listsQuery);
      if (!snap.empty) {
        const rawList = snap.docs[0].data() as ReadingList;
        setShelfItems(rawList.books);
      } else {
        // Seeds a simple empty/starter list
        const listId = `list-${profile.uid}`;
        const initialList: ReadingList = {
          listId,
          studentId: profile.uid,
          name: "My Learning Bookshelf",
          description: "Default collections of want-to-read, currently programming, and completed books.",
          isPublic: true,
          books: [
            { bookId: "book-1", status: "want_to_read", addedDate: new Date().toISOString(), readDate: null },
            { bookId: "book-6", status: "reading", addedDate: new Date().toISOString(), readDate: null }
          ]
        };
        await addDoc(collection(db, 'readingLists'), initialList);
        setShelfItems(initialList.books);
      }
    } catch (err) {
      console.error("Error setting custom list:", err);
    }
  };

  const updateShelfItemStatus = async (bookId: string, newStatus: 'want_to_read' | 'reading' | 'read') => {
    if (!profile) return;
    try {
      const listsQuery = query(collection(db, 'readingLists'), where('studentId', '==', profile.uid));
      const snap = await getDocs(listsQuery);
      if (!snap.empty) {
        const docId = snap.docs[0].id;
        const currentData = snap.docs[0].data() as ReadingList;
        
        const updatedBooks = currentData.books.map(item => {
          if (item.bookId === bookId) {
            return {
              ...item,
              status: newStatus,
              readDate: newStatus === 'read' ? new Date().toISOString() : item.readDate
            };
          }
          return item;
        });

        // If not in standard bookshelf, let's inject it
        if (!updatedBooks.some(b => b.bookId === bookId)) {
          updatedBooks.push({
            bookId,
            status: newStatus,
            addedDate: new Date().toISOString(),
            readDate: newStatus === 'read' ? new Date().toISOString() : null
          });
        }

        await updateDoc(doc(db, 'readingLists', docId), { books: updatedBooks });
        setShelfItems(updatedBooks);
        setOpFeedback({ type: 'success', text: "Bookshelf collection updated!" });
      }
    } catch (err) {
      console.error("Failed to update shelf position:", err);
    }
  };

  const removeShelfItem = async (bookId: string) => {
    if (!profile) return;
    try {
      const listsQuery = query(collection(db, 'readingLists'), where('studentId', '==', profile.uid));
      const snap = await getDocs(listsQuery);
      if (!snap.empty) {
        const docId = snap.docs[0].id;
        const currentData = snap.docs[0].data() as ReadingList;
        const filtered = currentData.books.filter(b => b.bookId !== bookId);
        
        await updateDoc(doc(db, 'readingLists', docId), { books: filtered });
        setShelfItems(filtered);
        setOpFeedback({ type: 'success', text: "Removed from bookshelf collections." });
      }
    } catch (err) {
      console.error("Failed to remove item:", err);
    }
  };

  const handleRenewBook = async (issue: Issue) => {
    if (!profile) return;
    setOpFeedback(null);

    if (issue.renewalCount >= 3) {
      setOpFeedback({ type: 'error', text: "Maximum renewal limit reached (Max: 3 renewals per book)." });
      return;
    }

    try {
      const dbRef = doc(db, 'issues', (issue as any).id);
      // Extend due date by 14 days
      const currentDueDate = new Date(issue.dueDate);
      const extendedDueDate = new Date(currentDueDate.getTime() + 14 * 24 * 60 * 60 * 1000);

      await updateDoc(dbRef, {
        dueDate: extendedDueDate.toISOString(),
        renewalCount: issue.renewalCount + 1,
        status: 'active'
      });

      setOpFeedback({ type: 'success', text: `Due date successfully renewed! Extended by 14 additional days.` });
      fetchLibraryData();
    } catch (err) {
      setOpFeedback({ type: 'error', text: `Failed to renew checkout. Error: ${String(err)}` });
    }
  };

  const handleSimulatePayment = async () => {
    if (!profile) return;
    setSimulatingPayment(true);
    setOpFeedback(null);

    try {
      // Find all due user fines and write them as 'paid' in Firestore
      const unpaidsQuery = query(collection(db, 'fines'), where('studentId', '==', profile.uid), where('status', '==', 'due'));
      const snapshot = await getDocs(unpaidsQuery);
      
      const promises = snapshot.docs.map(d => {
        return updateDoc(doc(db, 'fines', d.id), {
          status: 'paid',
          paymentDate: new Date().toISOString(),
          paymentTransactionId: `TXN-${Math.floor(100000000 + Math.random() * 900000000)}`
        });
      });

      await Promise.all(promises);
      setOpFeedback({ type: 'success', text: "Payment processed successfully! Outstanding library fines cleared." });
      fetchLibraryData();
    } catch (err) {
      setOpFeedback({ type: 'error', text: `Simulation error: ${String(err)}` });
    } finally {
      setSimulatingPayment(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedBookToReview) return;
    if (!reviewText.trim()) return;

    setIsSubmittingReview(true);
    try {
      const reviewData = {
        userId: profile.uid,
        bookId: selectedBookToReview.bookId,
        rating: reviewRating,
        reviewText: reviewText,
        isAnonymous: isAnonymous,
        userName: isAnonymous ? 'Anonymous Student' : `${profile.firstName} ${profile.lastName}`,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, `books/${selectedBookToReview.bookId}/reviews`), reviewData);
      
      const newRatingCount = (selectedBookToReview.ratingCount || 0) + 1;
      const newAverageRating = Number(((((selectedBookToReview.averageRating || 0) * (selectedBookToReview.ratingCount || 0)) + reviewRating) / newRatingCount).toFixed(1));
      
      const bookRef = doc(db, 'books', selectedBookToReview.bookId);
      await updateDoc(bookRef, {
        ratingCount: newRatingCount,
        averageRating: newAverageRating
      });

      // Update local state booksMap
      setBooksMap(prev => ({
        ...prev,
        [selectedBookToReview.bookId]: {
          ...selectedBookToReview,
          ratingCount: newRatingCount,
          averageRating: newAverageRating
        }
      }));

      setReviewText('');
      setReviewRating(5);
      setSelectedBookToReview(null);
      setOpFeedback({ type: 'success', text: "Successfully published your completed book feedback and rating!" });
    } catch (err) {
      console.error("Submit review error:", err);
      setOpFeedback({ type: 'error', text: "Failed to post book review." });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const outstandingFinesAggregate = fines
    .filter(f => f.status === 'due')
    .reduce((sum, f) => sum + f.amount, 0) + 
    issues
    .filter(i => i.status === 'overdue')
    .reduce((sum, i) => sum + i.fineAmount, 0);

  return (
    <div className="space-y-8 text-[#d1d1d1]">
      
      {/* Dynamic Alerts Banner if user has overdue books or outstanding fines */}
      {outstandingFinesAggregate > 0 && (
        <div className="rounded-lg border border-rose-950/50 bg-rose-950/20 p-5 text-rose-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-serif font-medium text-rose-200">Outstanding Library Balance Incurred</h4>
              <p className="text-xs text-rose-450 mt-1 leading-relaxed">
                You currently have outstanding library balances totaling <strong className="text-white font-bold">₹{outstandingFinesAggregate}</strong>. Balance is accumulating daily at structural system parameters.
              </p>
            </div>
          </div>
          <button
            onClick={handleSimulatePayment}
            disabled={simulatingPayment}
            className="w-full md:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 rounded bg-[#c5a059] px-4 py-2 text-xs font-bold uppercase tracking-wider text-black hover:bg-[#d6b16a] transition disabled:opacity-50 cursor-pointer"
          >
            <CreditCard className="h-4 w-4" /> {simulatingPayment ? 'Authorizing...' : 'Settle Fines Ledger'}
          </button>
        </div>
      )}

      {/* Main Core Columns */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        
        {/* Left Column: Borrowed/Held books */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-serif font-light text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#c5a059]" /> Active Borrow Checkouts
            </h3>
            <span className="rounded bg-[#c5a059]/10 border border-[#c5a059]/20 px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-widest uppercase text-[#c5a059]">
              {issues.length} active deposits
            </span>
          </div>

          {loading ? (
            <div className="flex h-32 items-center justify-center bg-[#0f0f0f] rounded-lg border border-[#2a2a2a]">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#c5a059] border-t-transparent" />
            </div>
          ) : issues.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#2a2a2a] p-12 text-center text-[#555] bg-[#0f0f0f] space-y-2">
              <BookOpen className="mx-auto h-8 w-8 text-[#333]" />
              <h4 className="font-serif text-white text-base">No active borrow checkouts</h4>
              <p className="text-xs text-neutral-500">Go to core Catalog search tab to check out academic resources.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {issues.map((issue) => {
                const book = booksMap[issue.bookId];
                if (!book) return null;
                const isOverdue = issue.status === 'overdue';
                const daysRemaining = Math.max(0, Math.ceil((new Date(issue.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));

                return (
                  <div 
                    key={issue.issueId} 
                    className={`flex flex-col md:flex-row gap-4 rounded-lg border p-4 bg-[#0f0f0f] hover:border-[#c5a059]/20 transition-all ${
                      isOverdue ? 'border-rose-950 bg-rose-950/10' : 'border-[#2a2a2a]'
                    }`}
                  >
                    <div className="h-28 w-20 shrink-0 overflow-hidden rounded bg-[#0a0a0a] border border-[#222]">
                      <img
                        src={book.coverImageUrl}
                        alt={book.title}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-serif font-medium text-sm text-white leading-snug">{book.title}</h4>
                          {isOverdue ? (
                            <span className="rounded bg-rose-950/50 border border-rose-500/30 px-2 py-0.5 text-[9px] font-mono font-bold tracking-widest text-rose-300 uppercase">
                              OVERDUE (+₹{issue.fineAmount})
                            </span>
                          ) : (
                            <span className="rounded bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                              Active - {daysRemaining} days left
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#a0a0a0] mt-0.5">Author(s): {book.author.join(', ')}</p>
                        <p className="text-[10px] text-[#666] mt-1 font-mono">DUE: {new Date(issue.dueDate).toLocaleDateString()} (Renewals left: {3 - issue.renewalCount})</p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between border-t border-[#202020] pt-2.5">
                        <button
                          onClick={() => handleRenewBook(issue)}
                          disabled={issue.renewalCount >= 3 || isOverdue}
                          className="rounded bg-[#141414] border border-[#2a2a2a] hover:bg-[#1a1a1a] text-[#c5a059] hover:text-[#d6b16a] font-bold px-3 py-1 text-[10px] font-mono tracking-wider uppercase transition disabled:opacity-40 cursor-pointer"
                        >
                          Renew (Extend 14 Days)
                        </button>
                        <span className="text-[9px] text-[#555] font-mono uppercase tracking-wider">Approved by digital ledger</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {opFeedback && (
            <div className={`rounded border p-4 text-xs flex items-center gap-2 ${
              opFeedback.type === 'success' ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/20' : 'bg-rose-950/50 text-rose-400 border-rose-500/20'
            }`}>
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span className="font-mono">{opFeedback.text}</span>
            </div>
          )}
        </div>

        {/* Right Column: Custom lists bookshelf */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center gap-1.5">
            <Bookmark className="h-4 w-4 text-[#c5a059]" />
            <h3 className="text-lg font-serif font-light text-white">Curriculum Shelf</h3>
          </div>

          <div className="bg-[#0f0f0f] rounded-lg border border-[#2a2a2a] overflow-hidden">
            
            {/* Shelf Tab heads */}
            <div className="flex border-b border-[#2a2a2a] font-mono text-center text-[10px] bg-[#0a0a0a]">
              <button 
                onClick={() => setActiveTab('reading')}
                className={`flex-1 py-3 font-semibold uppercase tracking-wider transition ${activeTab === 'reading' ? 'text-[#c5a059] border-b border-[#c5a059] bg-[#0f0f0f]' : 'text-[#666] hover:text-[#aaa]'}`}
              >
                Reading ({shelfItems.filter(s => s.status === 'reading').length})
              </button>
              <button 
                onClick={() => setActiveTab('want_to_read')}
                className={`flex-1 py-3 font-semibold uppercase tracking-wider transition ${activeTab === 'want_to_read' ? 'text-[#c5a059] border-b border-[#c5a059] bg-[#0f0f0f]' : 'text-[#666] hover:text-[#aaa]'}`}
              >
                Want ({shelfItems.filter(s => s.status === 'want_to_read').length})
              </button>
              <button 
                onClick={() => setActiveTab('read')}
                className={`flex-1 py-3 font-semibold uppercase tracking-wider transition ${activeTab === 'read' ? 'text-[#c5a059] border-b border-[#c5a059] bg-[#0f0f0f]' : 'text-[#666] hover:text-[#aaa]'}`}
              >
                Read ({shelfItems.filter(s => s.status === 'read').length})
              </button>
            </div>

            {/* List items under active tab */}
            <div className="p-4 space-y-3 max-h-[350px] overflow-y-auto bg-[#0f0f0f]">
              {shelfItems.filter(s => s.status === activeTab).length === 0 ? (
                <div className="text-center py-12 text-[10px] text-[#555] font-mono uppercase tracking-wider">
                  Bookshelf partition is empty.
                </div>
              ) : (
                shelfItems.filter(s => s.status === activeTab).map((item) => {
                  const book = booksMap[item.bookId];
                  if (!book) return null;

                  return (
                    <div key={`shelf-${book.bookId}`} className="group flex items-center justify-between gap-3 p-2.5 rounded border border-[#222] bg-[#0a0a0a] transition hover:border-[#c5a059]/30">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-10 w-7 shrink-0 overflow-hidden rounded bg-[#101010] shadow-sm">
                          <img src={book.coverImageUrl} alt={book.title} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-serif font-medium text-white truncate leading-tight">{book.title}</h5>
                          <p className="text-[10px] text-[#666] truncate mt-0.5">{book.author[0]}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 bg-[#0a0a0a]">
                        {activeTab === 'read' && (
                          <button
                            title="Rate & Review Book"
                            onClick={() => {
                              setSelectedBookToReview(book);
                              setReviewRating(5);
                              setReviewText('');
                            }}
                            className="p-1 rounded text-[#c5a059] hover:text-amber-400 hover:bg-[#141414] cursor-pointer"
                          >
                            <Star className="h-4 w-4" />
                          </button>
                        )}
                        {activeTab !== 'read' && (
                          <button
                            title="Mark as completed"
                            onClick={() => updateShelfItemStatus(book.bookId, 'read')}
                            className="p-1 rounded text-[#555] hover:text-emerald-400 hover:bg-[#141414] cursor-pointer"
                          >
                            <Award className="h-4 w-4" />
                          </button>
                        )}
                        {activeTab !== 'reading' && (
                          <button
                            title="Mark as reading"
                            onClick={() => updateShelfItemStatus(book.bookId, 'reading')}
                            className="p-1 rounded text-[#555] hover:text-[#c5a059] hover:bg-[#141414] cursor-pointer"
                          >
                            <ToggleLeft className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          title="Remove from bookshelf"
                          onClick={() => removeShelfItem(book.bookId)}
                          className="p-1 rounded text-[#555] hover:text-rose-400 hover:bg-[#141414] cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick adding selector footer to seed lists */}
            <div className="border-t border-[#2a2a2a] p-3.5 bg-[#0a0a0a] flex flex-col gap-2">
              <span className="text-[9px] font-bold text-[#666] block tracking-widest uppercase font-mono">Select Catalog Title</span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    updateShelfItemStatus(e.target.value, activeTab);
                    e.target.value = '';
                  }
                }}
                className="w-full rounded bg-[#0f0f0f] border border-[#2a2a2a] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c5a059] transition cursor-pointer"
              >
                <option value="">Shelf Quick Insertion...</option>
                {(Object.values(booksMap) as Book[]).map(bk => (
                  <option key={`opt-${bk.bookId}`} value={bk.bookId}>{bk.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

      </div>

      {/* Complete Book Review Modal dialog */}
      {selectedBookToReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] p-6 shadow-2xl relative space-y-4 text-[#d1d1d1]">
            <button
              onClick={() => setSelectedBookToReview(null)}
              className="absolute top-4 right-4 text-xs text-[#888] hover:text-white cursor-pointer font-mono border border-[#2a2a2a] bg-[#141414] px-1.5 py-0.5 rounded"
            >
              ✕
            </button>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-[#c5a059] font-mono tracking-widest uppercase">CONGRATULATIONS ON COMPLETING</span>
              <h3 className="font-serif font-medium text-white text-base leading-snug">{selectedBookToReview.title}</h3>
              <p className="text-xs text-[#888]">By {selectedBookToReview.author.join(', ')}</p>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4 pt-1 font-sans">
              <div className="space-y-1">
                <label className="text-[9px] text-[#666] font-bold uppercase tracking-wider block">YOUR RATING OUT OF 5</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={`star-library-${s}`}
                      onClick={() => setReviewRating(s)}
                      className="p-1 focus:outline-none cursor-pointer"
                    >
                      <Star className={`h-5 w-5 ${s <= reviewRating ? 'fill-[#c5a059] text-[#c5a059]' : 'text-[#333]'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-[#666] font-bold uppercase tracking-wider block">SHARE YOUR LEARNING EXPERIENCE (FEEDBACK)</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="How was this book? What did you master? Share your structural design review for fellow students..."
                  rows={4}
                  className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] p-3 text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#c5a059] transition"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-[10px] text-[#6a6a6a] cursor-pointer hover:text-neutral-400">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="accent-[#c5a059]"
                  />
                  Submit anonymously
                </label>
                <button
                  type="submit"
                  disabled={isSubmittingReview || !reviewText.trim()}
                  className="rounded bg-[#c5a059] hover:bg-[#d6b16a] px-4.5 py-2 text-[10px] uppercase tracking-widest font-bold text-black transition flex items-center gap-1.5 disabled:opacity-45 cursor-pointer font-mono"
                >
                  <Send className="h-3 w-3" /> Publish Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
