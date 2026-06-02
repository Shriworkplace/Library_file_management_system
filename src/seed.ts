import { collection, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { INITIAL_BOOKS, INITIAL_ROADMAPS, INITIAL_RESOURCES } from './data';

export async function seedDatabaseIfEmpty() {
  try {
    const booksSnapshot = await getDocs(collection(db, 'books'));
    if (!booksSnapshot.empty) {
      console.log('Database already initialized. Skipping seeding.');
      return;
    }

    console.log('Database empty. Starting seed process...');
    const batch = writeBatch(db);

    // 1. Seed Books
    for (const book of INITIAL_BOOKS) {
      const bookRef = doc(db, 'books', book.bookId);
      batch.set(bookRef, {
        ...book,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Let's create 3 physical copies for each book
      for (let i = 1; i <= 3; i++) {
        const copyId = `${book.bookId}-copy-${i}`;
        const copyRef = doc(db, 'bookCopies', copyId);
        batch.set(copyRef, {
          copyId,
          bookId: book.bookId,
          barcode: `${book.isbn.replace(/-/g, '')}0${i}`,
          location: `Shelf - Row ${Math.floor(Math.random() * 5) + 1}, Tier ${Math.floor(Math.random() * 3) + 1}`,
          condition: 'excellent',
          status: 'available',
          currentIssueId: null
        });
      }
    }

    // 2. Seed Resources
    for (const res of INITIAL_RESOURCES) {
      const resRef = doc(db, 'resources', res.resourceId);
      batch.set(resRef, res);
    }

    // 3. Seed Roadmaps
    for (const rmp of INITIAL_ROADMAPS) {
      const rmpRef = doc(db, 'skillRoadmaps', rmp.skillId);
      batch.set(rmpRef, rmp);
    }

    await batch.commit();
    console.log('Database successfully seeded with books, copies, resources, and skill roadmaps!');
  } catch (error) {
    console.error('Failed to seed database:', error);
  }
}
