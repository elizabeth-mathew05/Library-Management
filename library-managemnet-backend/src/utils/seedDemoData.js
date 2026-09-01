import User from '../models/User.js';
import Book from '../models/Book.js';
import Borrow from '../models/Borrow.js';
import getBookStatus from './bookStatus.js';

export const DEMO_ACCOUNTS = [
  { name: 'Demo Admin', email: 'admin@gmail.com', password: 'admin123', role: 'admin' },
  { name: 'Demo User', email: 'user1@gmail.com', password: 'user1@123', role: 'user' },
  { name: 'Demo Librarian', email: 'librarian2@gmail.com', password: 'librarian2@123', role: 'librarian' }
];

const DEMO_BOOKS = [
  {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    isbn: '9780743273565',
    genre: 'Classic',
    publicationYear: 1925,
    totalCopies: 5,
    availableCopies: 5,
    description: 'A portrait of the Jazz Age and the American dream.'
  },
  {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    isbn: '9780061120084',
    genre: 'Fiction',
    publicationYear: 1960,
    totalCopies: 4,
    availableCopies: 4,
    description: 'A story of racial injustice and childhood in the American South.'
  },
  {
    title: '1984',
    author: 'George Orwell',
    isbn: '9780451524935',
    genre: 'Dystopian',
    publicationYear: 1949,
    totalCopies: 3,
    availableCopies: 1,
    description: 'A cautionary novel about surveillance and authoritarian control.'
  },
  {
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    isbn: '9780141439518',
    genre: 'Romance',
    publicationYear: 1813,
    totalCopies: 4,
    availableCopies: 4,
    description: 'Elizabeth Bennet navigates class, family, and first impressions.'
  },
  {
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    isbn: '9780547928227',
    genre: 'Fantasy',
    publicationYear: 1937,
    totalCopies: 1,
    availableCopies: 0,
    description: 'Bilbo Baggins is pulled into an unexpected adventure. Currently checked out.'
  },
  {
    title: 'Harry Potter and the Sorcerer\'s Stone',
    author: 'J.K. Rowling',
    isbn: '9780590353427',
    genre: 'Fantasy',
    publicationYear: 1997,
    totalCopies: 6,
    availableCopies: 6,
    description: 'A young wizard discovers his place at Hogwarts.'
  },
  {
    title: 'The Catcher in the Rye',
    author: 'J.D. Salinger',
    isbn: '9780316769488',
    genre: 'Fiction',
    publicationYear: 1951,
    totalCopies: 3,
    availableCopies: 1,
    description: 'Holden Caulfield recounts a few restless days in New York.'
  },
  {
    title: 'Moby-Dick',
    author: 'Herman Melville',
    isbn: '9780142437247',
    genre: 'Adventure',
    publicationYear: 1851,
    totalCopies: 2,
    availableCopies: 2,
    description: 'Captain Ahab hunts the white whale. Used for late-fee payment demos.'
  },
  {
    title: 'Jane Eyre',
    author: 'Charlotte Brontë',
    isbn: '9780141441146',
    genre: 'Classic',
    publicationYear: 1847,
    totalCopies: 3,
    availableCopies: 3,
    description: 'An orphaned governess seeks independence and belonging.'
  },
  {
    title: 'Brave New World',
    author: 'Aldous Huxley',
    isbn: '9780060850524',
    genre: 'Dystopian',
    publicationYear: 1932,
    totalCopies: 3,
    availableCopies: 3,
    description: 'A future society engineered for comfort at the cost of freedom.'
  },
  {
    title: 'The Lord of the Rings',
    author: 'J.R.R. Tolkien',
    isbn: '9780544003415',
    genre: 'Fantasy',
    publicationYear: 1954,
    totalCopies: 2,
    availableCopies: 0,
    description: 'The fellowship sets out to destroy the One Ring. All copies are on loan.'
  },
  {
    title: 'Atomic Habits',
    author: 'James Clear',
    isbn: '9780735211292',
    genre: 'Self-Help',
    publicationYear: 2018,
    totalCopies: 5,
    availableCopies: 5,
    description: 'A practical guide to building better habits in small steps.'
  }
];

const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const ensureDemoUsers = async () => {
  const legacyUser = await User.findOne({ email: 'user1@gamil.com' });
  const currentUser = await User.findOne({ email: 'user1@gmail.com' });

  if (legacyUser && !currentUser) {
    legacyUser.email = 'user1@gmail.com';
    await legacyUser.save();
  }

  for (const account of DEMO_ACCOUNTS) {
    const existing = await User.findOne({ email: account.email });

    if (!existing) {
      await User.create(account);
      continue;
    }

    if (existing.role !== account.role || existing.name !== account.name) {
      existing.role = account.role;
      existing.name = account.name;
      await existing.save();
    }
  }
};

const ensureDemoBooks = async () => {
  for (const book of DEMO_BOOKS) {
    const existing = await Book.findOne({ isbn: book.isbn });

    if (existing) {
      continue;
    }

    await Book.create({
      ...book,
      status: getBookStatus(book.availableCopies, book.totalCopies)
    });
  }
};

const ensureLateFeeFixtures = async () => {
  const demoUser = await User.findOne({ email: 'user1@gmail.com' });
  const overdueBook = await Book.findOne({ isbn: '9780547928227' });
  const returnedLateBook = await Book.findOne({ isbn: '9780142437247' });

  if (!demoUser || !overdueBook || !returnedLateBook) {
    return;
  }

  const existingOverdue = await Borrow.findOne({
    user: demoUser._id,
    book: overdueBook._id,
    returnedAt: null
  });

  if (!existingOverdue) {
    await Borrow.create({
      user: demoUser._id,
      book: overdueBook._id,
      borrowedAt: daysFromNow(-21),
      dueDate: daysFromNow(-7),
      status: 'overdue',
      lateFee: 0
    });

    overdueBook.availableCopies = 0;
    overdueBook.status = getBookStatus(overdueBook.availableCopies, overdueBook.totalCopies);
    await overdueBook.save();
  }

  const existingReturnedLate = await Borrow.findOne({
    user: demoUser._id,
    book: returnedLateBook._id,
    returnedAt: { $ne: null }
  });

  if (!existingReturnedLate) {
    await Borrow.create({
      user: demoUser._id,
      book: returnedLateBook._id,
      borrowedAt: daysFromNow(-20),
      dueDate: daysFromNow(-6),
      returnedAt: daysFromNow(-1),
      status: 'returned',
      lateFee: 10,
      lateFeePaid: false
    });
  }
};

const seedDemoData = async () => {
  await ensureDemoUsers();
  await ensureDemoBooks();
  await ensureLateFeeFixtures();
  console.log('Demo accounts, catalog, and late-fee fixtures are ready.');
};

export default seedDemoData;
