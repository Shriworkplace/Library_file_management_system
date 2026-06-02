import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, query, where, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Book, Review, IssueRequest, Reservation } from '../types';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, BookOpen, Clock, CheckCircle2, Bookmark, AlertCircle, Sparkles, Star, MessageSquare, Send } from 'lucide-react';

export const StudentCatalog: React.FC = () => {
  const { profile } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'out'>('all');
  const [sortBy, setSortBy] = useState<'popularity' | 'newest' | 'rating'>('popularity');
  
  // Selected Book for Detail View modal
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Issue/Reservation feedback alert
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Recommendations
  const [recommendedBooks, setRecommendedBooks] = useState<Book[]>([]);

  // Custom Interests management
  const { refreshProfile } = useAuth();
  const [isEditingInterests, setIsEditingInterests] = useState(false);
  const [interestInput, setInterestInput] = useState('');
  const [savingInterests, setSavingInterests] = useState(false);

  const handleSaveInterests = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSavingInterests(true);
    try {
      const parsedInterests = interestInput
        .split(',')
        .map(i => i.trim())
        .filter(i => i.length > 0);
      
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        interests: parsedInterests,
        updatedAt: new Date().toISOString()
      });

      await refreshProfile();
      setIsEditingInterests(false);
    } catch (err) {
      console.error("Error saving interests:", err);
    } finally {
      setSavingInterests(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    if (books.length > 0) {
      generateRecommendations();
    }
  }, [books, profile]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const q = collection(db, 'books');
      const snapshot = await getDocs(q);
      const fetchedBooks: Book[] = [];
      snapshot.forEach(doc => {
        fetchedBooks.push(doc.data() as Book);
      });
      setBooks(fetchedBooks);
    } catch (err) {
      console.error("Error fetching books:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = () => {
    if (!profile) return;
    
    // Algorithmic Personalized Filtering:
    // 1. Content-based: same primary interest tags (e.g. 'Python', 'Machine Learning', 'Web Development')
    // 2. Collaborative/Peer: high catalog averageRating & high circulation count
    const userInterests = (profile.interests || []).map(i => i.toLowerCase());
    
    const scored = books.map(book => {
      let score = 0;
      // Match genre/tags with user interests
      book.genre.forEach(g => {
        if (userInterests.includes(g.toLowerCase())) score += 3;
      });
      book.subjectTags.forEach(t => {
        if (userInterests.includes(t.toLowerCase())) score += 2;
      });
      // Weight average rating and circulation popularity
      score += book.averageRating * 1.5;
      score += Math.min(book.circulationCount / 10, 5); // caps at +5
      
      return { book, score };
    });

    // Sort by calculated interest score descending
    const sorted = scored.sort((a, b) => b.score - a.score).map(item => item.book);
    // return top 4 recommended books
    setRecommendedBooks(sorted.slice(0, 4));
  };

  const fetchReviews = async (bookId: string) => {
    try {
      const q = query(collection(db, `books/${bookId}/reviews`));
      const snap = await getDocs(q);
      const rList: Review[] = [];
      snap.forEach(d => {
        rList.push(d.data() as Review);
      });
      setReviews(rList.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  };

  const handleOpenDetail = async (book: Book) => {
    setSelectedBook(book);
    setReviewText('');
    setReviewRating(5);
    setFeedback(null);
    await fetchReviews(book.bookId);
  };

  const handleRequestIssue = async (book: Book) => {
    if (!profile) return;
    setActionLoading(true);
    setFeedback(null);

    // Guard: Can't rent if out of stock
    if (book.availableCopies <= 0) {
      setFeedback({ type: 'error', text: 'All copies are currently borrowed. Please reserve this book instead!' });
      setActionLoading(false);
      return;
    }

    try {
      const requestId = `req-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const requestData: IssueRequest = {
        requestId,
        studentId: profile.uid,
        bookId: book.bookId,
        status: 'pending',
        requestDate: new Date().toISOString()
      };

      await addDoc(collection(db, 'issueRequests'), requestData);
      setFeedback({ type: 'success', text: `Borrow request submitted successfully! Please wait for a librarian to approve.` });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'issueRequests');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReserveBook = async (book: Book) => {
    if (!profile) return;
    setActionLoading(true);
    setFeedback(null);

    try {
      const reservationId = `resv-${Date.now()}`;
      const reservationData: Reservation = {
        reservationId,
        studentId: profile.uid,
        bookId: book.bookId,
        reservationDate: new Date().toISOString(),
        holdUntilDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 Hour hold expiration
        position: 1, // Basic position default
        status: 'active'
      };

      await addDoc(collection(db, 'reservations'), reservationData);
      setFeedback({ type: 'success', text: `Book reserved! You are placed at Position #1 in the hold queue.` });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'reservations');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedBook) return;
    if (!reviewText.trim()) return;

    setIsSubmittingReview(true);
    try {
      const reviewData: Review = {
        userId: profile.uid,
        bookId: selectedBook.bookId,
        rating: reviewRating,
        reviewText: reviewText,
        isAnonymous: isAnonymous,
        userName: isAnonymous ? 'Anonymous Student' : `${profile.firstName} ${profile.lastName}`,
        createdAt: new Date().toISOString()
      };

      // Write subcollection review
      await addDoc(collection(db, `books/${selectedBook.bookId}/reviews`), reviewData);
      
      // Compute and update Book rating metadata dynamically in Firestore
      const newRatingCount = selectedBook.ratingCount + 1;
      const newAverageRating = Number(((selectedBook.averageRating * selectedBook.ratingCount + reviewRating) / newRatingCount).toFixed(1));
      
      const bookRef = doc(db, 'books', selectedBook.bookId);
      await updateDoc(bookRef, {
        ratingCount: newRatingCount,
        averageRating: newAverageRating
      });

      // Update local state
      setSelectedBook(prev => prev ? {
        ...prev,
        ratingCount: newRatingCount,
        averageRating: newAverageRating
      } : null);

      setReviewText('');
      setReviewRating(5);
      await fetchReviews(selectedBook.bookId);
      fetchBooks(); // Refresh catalog array
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `books/${selectedBook.bookId}/reviews`);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Extract list of all available genres
  const genresSet = new Set<string>();
  books.forEach(b => b.genre.forEach(g => genresSet.add(g)));
  const genres = Array.from(genresSet);

  // Extract list of all available authors
  const authorsSet = new Set<string>();
  books.forEach(b => b.author.forEach(a => authorsSet.add(a)));
  const authors = Array.from(authorsSet).sort();

  // Search, FILTER and SORT computation
  const filteredBooks = books.filter(book => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.some(a => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
      book.isbn.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesGenre = selectedGenre ? book.genre.includes(selectedGenre) : true;
    
    const matchesAuthor = selectedAuthor ? book.author.includes(selectedAuthor) : true;
    
    const matchesAvailability = 
      availabilityFilter === 'all' ? true :
      availabilityFilter === 'available' ? book.availableCopies > 0 :
      book.availableCopies === 0;

    return matchesSearch && matchesGenre && matchesAuthor && matchesAvailability;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (sortBy === 'popularity') return b.circulationCount - a.circulationCount;
    if (sortBy === 'newest') return b.publicationYear - a.publicationYear;
    if (sortBy === 'rating') return b.averageRating - a.averageRating;
    return 0;
  });

  return (
    <div className="space-y-8 text-[#d1d1d1]">
      
      {/* Search Header Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#141414] via-[#0f0f0f] to-[#0a0a0a] p-8 text-white border border-[#2a2a2a] shadow-xl">
        <div className="absolute top-0 right-0 h-full w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#c5a059] via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded bg-[#c5a059]/10 border border-[#c5a059]/20 px-3 py-1 text-[10px] uppercase tracking-widest font-mono font-bold text-[#c5a059]">
            <Sparkles className="h-3 w-3" /> Core Academic Catalog
          </span>
          <h2 className="text-3xl font-serif tracking-tight md:text-4xl text-white font-medium">
            Find Books & Materials
          </h2>
          <p className="text-[#a0a0a0] text-sm font-light leading-relaxed">
            Search our integrated digital collection of engineering guides, research manuals, mathematics texts, and specialized industry journals.
          </p>
          
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-[#555]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by book title, design authors, or ISBN standard key..."
                className="w-full rounded bg-[#0a0a0a] px-5 py-3 pl-12 text-white border border-[#2a2a2a] placeholder-[#555] focus:outline-none focus:border-[#c5a059] transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Books For You */}
      {recommendedBooks.length > 0 && !searchQuery && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#c5a059] animate-pulse" />
              <h3 className="text-lg font-serif font-light text-white">Recommended for You</h3>
              <span className="rounded bg-[#c5a059]/10 border border-[#c5a059]/20 px-2.5 py-0.5 text-[9px] text-[#c5a059] tracking-widest uppercase font-mono font-bold">Personalized Profiling</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] text-[#555] font-mono tracking-wider uppercase font-bold">Your Profile Interests:</span>
              {profile && (profile.interests || []).length > 0 ? (
                (profile.interests || []).map((interest, idx) => (
                  <span key={idx} className="rounded bg-[#0a0a0a] border border-[#222] px-2.5 py-1 text-[10px] text-[#aaa] font-mono hover:text-white hover:border-[#c5a059]/40 transition">
                    #{interest}
                  </span>
                ))
              ) : (
                <span className="text-[10px] text-[#555] italic">No custom interest tags loaded yet.</span>
              )}
            </div>
            
            <button
              onClick={() => {
                setInterestInput((profile?.interests || []).join(', '));
                setIsEditingInterests(true);
              }}
              className="text-[10px] text-[#c5a059] hover:text-white font-mono uppercase font-bold transition flex items-center gap-1.5 bg-[#0a0a0a] hover:bg-[#141414] border border-[#222] px-3.5 py-2 rounded cursor-pointer shrink-0"
            >
              Modify Academic Interests
            </button>
          </div>

          {isEditingInterests && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-fade-in">
              <div className="w-full max-w-md rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] p-6 shadow-2xl relative space-y-4 text-[#d1d1d1]">
                <button
                  type="button"
                  onClick={() => setIsEditingInterests(false)}
                  className="absolute top-4 right-4 rounded border border-[#222] bg-[#0a0a0a] px-2 py-0.5 text-[10px] font-mono text-[#555] hover:text-white hover:border-[#c5a059]/40 cursor-pointer"
                >
                  ✕
                </button>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-[#c5a059] font-mono tracking-widest uppercase">STUDENT PROFILE</span>
                  <h3 className="font-serif font-light text-white text-base">Modify Academic Interests & Skills</h3>
                  <p className="text-xs text-[#888] leading-relaxed">Type custom academic subjects or skills separated by commas. This customizes peer textbook recommendations and research modules across any discipline of choice.</p>
                </div>

                <form onSubmit={handleSaveInterests} className="space-y-4 pt-1 font-sans">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-[#666] uppercase block font-mono">Custom Skill/Subject List</label>
                    <input
                      type="text"
                      placeholder="e.g. Python, Machine Learning, Creative Writing, Organic Chemistry, Ancient History"
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] p-2.5 text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#c5a059]"
                      required
                    />
                    <span className="text-[9px] text-[#444] font-mono leading-relaxed block pt-1">
                      Press save to refresh. Catalog recommended textbooks will dynamically realign.
                    </span>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingInterests(false)}
                      className="flex-1 rounded border border-[#222] bg-[#0a0a0a] py-2 text-xs font-mono font-bold text-[#555] hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingInterests}
                      className="flex-1 rounded bg-[#c5a059] hover:bg-[#d6b16a] text-black py-2 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition"
                    >
                      {savingInterests ? 'Saving...' : 'Save Interests'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recommendedBooks.map((book) => (
              <div 
                key={`rec-${book.bookId}`}
                onClick={() => handleOpenDetail(book)}
                className="group relative cursor-pointer overflow-hidden rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] hover:border-[#c5a059]/30 p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col justify-between"
              >
                <div className="relative mb-3 h-52 overflow-hidden rounded bg-[#0a0a0a]">
                  <img
                    src={book.coverImageUrl}
                    alt={book.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 rounded bg-black/80 border border-[#222] px-2 py-1 text-[10px] font-bold text-white shadow-sm flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-[#c5a059] text-[#c5a059]" /> {book.averageRating}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h4 className="line-clamp-1 text-sm font-serif font-medium text-white group-hover:text-[#c5a059] transition-colors">{book.title}</h4>
                  <p className="text-xs text-[#a0a0a0] line-clamp-1">{book.author.join(', ')}</p>
                  <p className="text-[10px] text-[#c5a059] font-mono tracking-wider uppercase font-semibold">{book.genre[0]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Catalog Display & Filters */}
      <div className="flex flex-col gap-8 lg:flex-row">
        
        {/* Filter Toolbar left/top */}
        <div className="w-full shrink-0 space-y-6 lg:w-64 bg-[#0f0f0f] rounded-lg border border-[#2a2a2a] p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#2a2a2a]">
            <Filter className="h-4 w-4 text-[#c5a059]" />
            <h4 className="font-serif font-light text-white text-base">Filter Collections</h4>
          </div>

          <div className="space-y-5">
            {/* Sort Order */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#666] block">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c5a059] transition cursor-pointer"
              >
                <option value="popularity">Popular Borrowed</option>
                <option value="newest">Newest Year</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {/* Genre Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#666] block">Technical Domain</label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c5a059] transition cursor-pointer"
              >
                <option value="">All Domains</option>
                {genres.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Author Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#666] block">Academic Contributor</label>
              <select
                value={selectedAuthor}
                onChange={(e) => setSelectedAuthor(e.target.value)}
                className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c5a059] transition cursor-pointer"
              >
                <option value="">All Authors</option>
                {authors.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Availability Option */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#666] block">Library Stock</label>
              <div className="flex flex-col gap-2.5 pt-1 font-sans">
                <label className="inline-flex items-center gap-2.5 text-xs text-[#a0a0a0] hover:text-white cursor-pointer transition">
                  <input
                    type="radio"
                    name="avail"
                    checked={availabilityFilter === 'all'}
                    onChange={() => setAvailabilityFilter('all')}
                    className="accent-[#c5a059]"
                  />
                  Show All Books
                </label>
                <label className="inline-flex items-center gap-2.5 text-xs text-[#a0a0a0] hover:text-white cursor-pointer transition">
                  <input
                    type="radio"
                    name="avail"
                    checked={availabilityFilter === 'available'}
                    onChange={() => setAvailabilityFilter('available')}
                    className="accent-[#c5a059]"
                  />
                  In Stock Only
                </label>
                <label className="inline-flex items-center gap-2.5 text-xs text-[#a0a0a0] hover:text-white cursor-pointer transition">
                  <input
                    type="radio"
                    name="avail"
                    checked={availabilityFilter === 'out'}
                    onChange={() => setAvailabilityFilter('out')}
                    className="accent-[#c5a059]"
                  />
                  Unavailable (Can Reserve)
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Results list */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-[#666] tracking-wider uppercase">{sortedBooks.length} materials ready on shelves</span>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center bg-[#0f0f0f] rounded-lg border border-[#2a2a2a]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#c5a059] border-t-transparent" />
            </div>
          ) : sortedBooks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#2a2a2a] bg-[#0f0f0f] p-12 text-center space-y-3">
              <AlertCircle className="mx-auto h-10 w-10 text-[#444]" />
              <h4 className="font-serif text-white text-base">No Books Found</h4>
              <p className="text-xs text-[#666]">Try adjusting your search filters or browse top recommended models.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sortedBooks.map((book) => (
                <div 
                  key={book.bookId}
                  onClick={() => handleOpenDetail(book)}
                  className="flex flex-col overflow-hidden rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] hover:border-[#c5a059]/30 transition-all duration-300 shadow-sm cursor-pointer hover:-translate-y-0.5"
                >
                  <div className="relative h-48 overflow-hidden bg-[#0d0d0d]">
                    <img
                      src={book.coverImageUrl}
                      alt={book.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-2 left-2 rounded bg-black/80 border border-[#222] px-2 py-0.5 text-[10px] text-white">
                      {book.publicationYear}
                    </div>
                    {book.availableCopies > 0 ? (
                      <span className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-sm bg-emerald-950/90 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-400 tracking-wider">
                        <CheckCircle2 className="h-3 w-3" /> AVAILABLE
                      </span>
                    ) : (
                      <span className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-sm bg-amber-950/90 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-300 tracking-wider">
                        <Clock className="h-3 w-3" /> ALL BORROWED
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-1 flex-col p-4 space-y-4 justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#c5a059] font-mono">{book.genre[0]}</span>
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                          <Star className="h-3 w-3 fill-amber-500" /> {book.averageRating}
                        </div>
                      </div>
                      <h4 className="line-clamp-2 text-sm font-serif font-medium text-white group-hover:text-[#c5a059] transition-colors">{book.title}</h4>
                      <p className="text-xs text-[#a0a0a0] line-clamp-1">{book.author.join(', ')}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#222] pt-3 text-[10px] text-[#666] font-mono">
                      <span>ISBN: {book.isbn}</span>
                      <span className="font-bold text-white bg-[#0a0a0a] px-2 py-0.5 rounded border border-[#222]">{book.availableCopies} available</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Book Detailed Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] shadow-2xl p-6 md:p-8 space-y-6 text-[#d1d1d1]">
            
            {/* Modal Exit Button */}
            <button
              onClick={() => setSelectedBook(null)}
              className="absolute top-4 right-4 rounded border border-[#2a2a2a] bg-[#141414] px-2.5 py-1 text-xs text-[#888] hover:text-white hover:border-[#c5a059]/40 cursor-pointer transition font-mono"
            >
              ESC ✕
            </button>

            {/* Inner Details Container */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
              {/* Media Card left */}
              <div className="md:col-span-4 space-y-4">
                <div className="overflow-hidden rounded border border-[#2a2a2a] bg-[#0a0a0a] shadow">
                  <img
                    src={selectedBook.coverImageUrl}
                    alt={selectedBook.title}
                    className="w-full object-cover aspect-[3/4]"
                  />
                </div>
                <div className="rounded bg-[#0a0a0a] border border-[#2a2a2a] p-4 text-center space-y-2">
                  <div className="text-[10px] text-[#666] font-bold uppercase tracking-widest font-mono">AVAILABLE COPIES</div>
                  <div className="text-2xl font-serif font-light text-white">
                    {selectedBook.availableCopies} / {selectedBook.totalCopies}
                  </div>
                  <p className="text-[10px] text-[#888]">{selectedBook.availableCopies > 0 ? 'Ready for instant pick-up' : 'Check holds queue status'}</p>
                </div>
              </div>

              {/* Attributes and metadata right */}
              <div className="md:col-span-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {selectedBook.genre.map(g => (
                        <span key={g} className="rounded bg-[#c5a059]/10 border border-[#c5a059]/20 px-2.5 py-0.5 text-[9px] font-bold text-[#c5a059] font-mono uppercase tracking-wider">
                          {g}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-2xl font-serif font-normal text-white mt-2 leading-snug">{selectedBook.title}</h3>
                    <p className="text-xs font-light text-[#a0a0a0]">By {selectedBook.author.join(', ')}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-y border-[#2a2a2a] py-3 text-[11px] text-[#a0a0a0] font-mono">
                    <div>
                      <span className="font-semibold text-[#555] block text-[9px] uppercase tracking-wider">STANDARD ISBN</span>
                      <span className="text-[#a0a0a0] font-medium">{selectedBook.isbn}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-[#555] block text-[9px] uppercase tracking-wider">PUBLICATION INFO</span>
                      <span className="text-[#a0a0a0] font-medium">{selectedBook.publisher} ({selectedBook.publicationYear})</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-serif text-[#a0a0a0] text-xs uppercase tracking-wider font-light">Summary Description</h4>
                    <p className="text-xs leading-relaxed text-[#888] font-light font-sans">{selectedBook.description}</p>
                  </div>
                </div>

                {/* Main operational primary action buttons */}
                <div className="rounded bg-[#0a0a0a] border border-[#2a2a2a] p-4 space-y-3.5">
                  <h4 className="text-[10px] font-bold text-[#c5a059] uppercase tracking-widest flex items-center gap-1.5 font-mono">
                    <BookOpen className="h-4 w-4" /> Book Circulation Desk
                  </h4>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={() => handleRequestIssue(selectedBook)}
                      disabled={selectedBook.availableCopies <= 0 || actionLoading}
                      className="flex-1 rounded bg-[#c5a059] hover:bg-[#d6b16a] text-[#000] py-3 px-4 text-center text-xs font-bold tracking-widest uppercase transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {actionLoading ? 'Processing Request...' : 'Request Borrow / Issue'}
                    </button>
                    <button
                      onClick={() => handleReserveBook(selectedBook)}
                      disabled={selectedBook.availableCopies > 0 || actionLoading}
                      className="rounded bg-[#141414] border border-[#2a2a2a] hover:bg-[#1a1a1a] text-white font-bold py-3 px-4 text-xs tracking-widest uppercase shadow transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    >
                      Reserve / Hold (Join Queue)
                    </button>
                  </div>

                  {feedback && (
                    <div className={`rounded p-3 text-xs flex items-center gap-2 ${
                      feedback.type === 'success' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' : 'bg-rose-950/40 text-rose-400 border border-rose-500/20'
                    }`}>
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{feedback.text}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ratings & Written Reviews Section */}
            <div className="border-t border-[#2a2a2a] pt-8 mt-8 space-y-6">
              <h4 className="text-lg font-serif font-light text-white flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#c5a059]" /> Faculty & Student Feedbacks
              </h4>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* Submit review */}
                <form onSubmit={handleSubmitReview} className="bg-[#0a0a0a] rounded border border-[#212121] p-5 space-y-4">
                  <h5 className="font-serif text-[#c5a059] text-xs uppercase tracking-wider">Leave a Review</h5>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] text-[#666] font-bold uppercase tracking-wider block">YOUR RATING</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          type="button"
                          key={`star-${s}`}
                          onClick={() => setReviewRating(s)}
                          className="p-1 focus:outline-none cursor-pointer"
                        >
                          <Star className={`h-5 w-5 ${s <= reviewRating ? 'fill-[#c5a059] text-[#c5a059]' : 'text-[#333]'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-[#666] font-bold uppercase tracking-wider block">YOUR WRITTEN CRITIQUE</label>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Comment on academic rigor, readability index, syllabus compatibility, or physical condition..."
                      rows={3}
                      className="w-full rounded bg-[#0f0f0f] border border-[#2a2a2a] p-3 text-xs text-white focus:outline-none focus:border-[#c5a059] transition"
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
                      Submit review anonymously
                    </label>
                    <button
                      type="submit"
                      disabled={isSubmittingReview || !reviewText.trim()}
                      className="rounded bg-[#c5a059] hover:bg-[#d6b16a] px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-[#000] transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                    >
                      <Send className="h-3 w-3" /> Publish Review
                    </button>
                  </div>
                </form>

                {/* List dynamic reviews */}
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {reviews.length === 0 ? (
                    <div className="text-center py-12 text-[#555] text-xs font-mono tracking-wider uppercase">
                      No written peer testimonies logged yet.
                    </div>
                  ) : (
                    reviews.map((r, i) => (
                      <div key={`rev-item-${i}`} className="border-b border-[#212121] pb-3.5 last:border-b-0 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-serif font-medium text-[#c5a059]">{r.userName}</span>
                          <span className="text-[9px] text-[#555] font-mono">{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(st => (
                            <Star key={st} className={`h-3 w-3 ${st <= r.rating ? 'fill-[#c5a059] text-[#c5a059]' : 'text-[#222]'}`} />
                          ))}
                        </div>
                        <p className="text-xs text-[#a0a0a0] leading-relaxed italic">"{r.reviewText}"</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
