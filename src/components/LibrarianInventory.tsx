import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Book, BookCopy } from '../types';
import { Library, PlusSquare, Trash2, CheckCircle2, Bookmark, Barcode, Grid, Compass } from 'lucide-react';

export const LibrarianInventory: React.FC = () => {
  const [booksList, setBooksList] = useState<Book[]>([]);
  const [copiesList, setCopiesList] = useState<BookCopy[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Book Form state
  const [title, setTitle] = useState('');
  const [authorInput, setAuthorInput] = useState('');
  const [isbn, setIsbn] = useState('');
  const [publisher, setPublisher] = useState('Oxford Press');
  const [pubYear, setPubYear] = useState('2024');
  const [genreInput, setGenreInput] = useState('Computer Science');
  const [description, setDescription] = useState('');
  const [totalCopies, setTotalCopies] = useState('3');
  const [coverUrl, setCoverUrl] = useState('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60');

  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const bSnap = await getDocs(collection(db, 'books'));
      const list: Book[] = [];
      bSnap.forEach(d => {
        list.push(d.data() as Book);
      });
      setBooksList(list);

      const cSnap = await getDocs(collection(db, 'bookCopies'));
      const cList: BookCopy[] = [];
      cSnap.forEach(d => {
        cList.push(d.data() as BookCopy);
      });
      setCopiesList(cList);

    } catch (err) {
      console.error("Failed to fetch inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    if (!title || !authorInput || !isbn) {
      setFormFeedback({ type: 'error', text: 'Please complete all required fields (Title, Author lists, ISBN key).' });
      return;
    }

    setIsSubmitting(true);
    try {
      const bookId = `book-${Date.now()}`;
      const copiesNum = parseInt(totalCopies) || 3;

      const newBook: Book = {
        bookId,
        isbn: isbn.trim(),
        title: title.trim(),
        author: authorInput.split(',').map(a => a.trim()),
        publisher: publisher.trim(),
        publicationYear: parseInt(pubYear) || 2024,
        description: description.trim() || 'No explicit academic abstract details supplied.',
        genre: genreInput.split(',').map(g => g.trim()),
        subjectTags: genreInput.split(',').map(g => g.trim()),
        coverImageUrl: coverUrl.trim(),
        totalCopies: copiesNum,
        availableCopies: copiesNum,
        averageRating: 5.0,
        ratingCount: 0,
        circulationCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 1. Write the Book object inside '/books'
      await addDoc(collection(db, 'books'), newBook);

      // 2. Generate physical copies elements under '/bookCopies'
      for (let i = 1; i <= copiesNum; i++) {
        const copyId = `${bookId}-copy-${i}`;
        const newCopy: BookCopy = {
          copyId,
          bookId,
          barcode: `${isbn.replace(/-/g, '')}0${i}`,
          location: `Shelf - Row ${Math.floor(Math.random() * 5) + 1}, Tier ${Math.floor(Math.random() * 3) + 1}`,
          condition: 'excellent',
          status: 'available',
          currentIssueId: null
        };
        await addDoc(collection(db, 'bookCopies'), newCopy);
      }

      setFormFeedback({ type: 'success', text: `Successfully registered new book and instantiated ${copiesNum} barcode copies!` });
      
      // Reset form variables
      setTitle('');
      setAuthorInput('');
      setIsbn('');
      setDescription('');
      
      // reload lists
      fetchInventory();

    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'books');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 text-[#d1d1d1]">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        
        {/* Left Column: Register New Book Form console */}
        <div className="lg:col-span-5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#202020] pb-3">
            <PlusSquare className="h-4 w-4 text-[#c5a059]" />
            <h3 className="text-xs font-serif font-light text-white uppercase tracking-wider">Register Catalog Entry</h3>
          </div>

          <form onSubmit={handleAddBookSubmit} className="space-y-4 text-xs font-serif">
            <div className="space-y-1.5">
              <label className="text-[9px] text-[#555] uppercase tracking-widest block font-mono">BOOK TITLE *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Introductions to Electrodynamics"
                className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] px-3 py-2 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-[#c5a059] transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] text-[#555] uppercase tracking-widest block font-mono">AUTHORS (comma-separated list) *</label>
              <input
                type="text"
                value={authorInput}
                onChange={(e) => setAuthorInput(e.target.value)}
                placeholder="David J. Griffiths"
                className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] px-3 py-2 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-[#c5a059] transition"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] text-[#555] uppercase tracking-widest block font-mono">ISBN ID KEY *</label>
                <input
                  type="text"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  placeholder="978-0135957059"
                  className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] px-3 py-2 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-[#c5a059] transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-[#555] uppercase tracking-widest block font-mono">GENRES / DOMAINS</label>
                <input
                  type="text"
                  value={genreInput}
                  onChange={(e) => setGenreInput(e.target.value)}
                  placeholder="Electromagnetism, Physics"
                  className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] px-3 py-2 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-[#c5a059] transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-[9px] text-[#555] uppercase tracking-widest block font-mono">PUBLISHER</label>
                <input
                  type="text"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c5a059] transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-[#555] uppercase tracking-widest block font-mono">PUB YEAR</label>
                <input
                  type="number"
                  value={pubYear}
                  onChange={(e) => setPubYear(e.target.value)}
                  className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c5a059] transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-[#555] uppercase tracking-widest block font-mono">COPIES COUNT</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={totalCopies}
                  onChange={(e) => setTotalCopies(e.target.value)}
                  className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c5a059] transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] text-[#555] uppercase tracking-widest block font-mono">IMAGE COVER URL ADDRESS</label>
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c5a059] font-mono transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] text-[#555] uppercase tracking-widest block font-mono">ABSTRACT COURSE SYLLABUS ABSTRACT</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Fundamental Maxwell electrostatics, dynamic current matrices..."
                rows={3}
                className="w-full rounded bg-[#0a0a0a] border border-[#2a2a2a] px-3 py-2 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-[#c5a059] transition"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded bg-[#c5a059] hover:bg-[#d6b16a] py-3 text-black font-mono font-bold tracking-widest uppercase cursor-pointer transition disabled:opacity-45"
            >
              {isSubmitting ? 'Registering Entry...' : 'Post and Instantiate Volume'}
            </button>

            {formFeedback && (
              <div className={`rounded border p-3 text-xs flex items-center gap-1.5 font-bold ${
                formFeedback.type === 'success' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20' : 'bg-rose-950/40 text-rose-400 border-rose-500/20'
              }`}>
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="font-mono">{formFeedback.text}</span>
              </div>
            )}
          </form>
        </div>

        {/* Right Columns: Active books copies catalog list */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-2 justify-between">
            <h3 className="text-base font-serif font-light text-white flex items-center gap-2 leading-none">
              <Library className="h-4 w-4 text-[#c5a059]" /> Catalog Stock Repository
            </h3>
            <span className="text-[10px] text-[#666] font-mono font-bold">{copiesList.length} barcodes overall</span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-[#555] font-mono text-xs uppercase tracking-widest bg-[#0f0f0f] border border-[#2a2a2a] rounded">Loading databases...</div>
          ) : booksList.length === 0 ? (
            <div className="text-center py-12 bg-[#0f0f0f] border border-dashed border-[#2a2a2a] rounded text-xs text-[#555] uppercase tracking-wider font-mono">No repository indexes found.</div>
          ) : (
            <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
              {booksList.map((book) => {
                const bookCopies = copiesList.filter(c => c.bookId === book.bookId);

                return (
                  <div key={`inv-${book.bookId}`} className="p-4 rounded border border-[#222] bg-[#0f0f0f] hover:border-[#2a2a2a] transition space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-serif font-medium text-sm text-white leading-snug">{book.title}</h4>
                        <span className="text-[10px] text-[#666] block mt-1 font-mono">Publisher: {book.publisher} • By {book.author.join(', ')}</span>
                      </div>
                      <span className="rounded bg-[#141414] border border-[#222] px-2 py-1 font-mono text-[9px] text-[#c5a059] font-bold shrink-0 tracking-wider">
                        {book.availableCopies} / {book.totalCopies} INSTOCK
                      </span>
                    </div>

                    {/* Barcodes tracked */}
                    <div className="bg-[#0a0a0a] rounded border border-[#1a1a1a] p-3 space-y-2.5">
                      <span className="text-[9px] font-bold tracking-widest text-[#555] block uppercase font-mono">Barcode instances location manifest</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-mono">
                        {bookCopies.map((copy) => (
                          <div key={copy.copyId} className="flex items-center justify-between gap-2.5 text-[#aaa] bg-[#0a0a0a] p-2 rounded border border-[#1a1a1a]">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Barcode className="h-3.5 w-3.5 text-[#444] shrink-0" />
                              <span className="truncate">BC: {copy.barcode} | {copy.location}</span>
                            </div>
                            <span className="rounded bg-[#141414] border border-[#222] px-1.5 py-0.5 text-[8px] font-bold text-neutral-400 shrink-0 uppercase tracking-wider">{copy.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
