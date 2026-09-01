export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const CURRENT_YEAR = new Date().getFullYear();
export const MIN_PUBLICATION_YEAR = 1000;
export const isbnPattern = /^[0-9-]{10,17}$/;

export function validateBookForm(form) {
  const nextErrors = {};
  const title = String(form.title || '').trim();
  const author = String(form.author || '').trim();
  const isbn = String(form.isbn || '').trim();
  const genre = String(form.genre || '').trim();
  const year = Number(form.publicationYear);
  const totalCopies = Number(form.totalCopies);
  const availableCopies = Number(form.availableCopies);

  if (!title) {
    nextErrors.title = 'Title is required.';
  } else if (title.length > 200) {
    nextErrors.title = 'Title must be 200 characters or fewer.';
  }

  if (!author) {
    nextErrors.author = 'Author is required.';
  } else if (author.length > 120) {
    nextErrors.author = 'Author must be 120 characters or fewer.';
  }

  if (!isbn) {
    nextErrors.isbn = 'ISBN is required.';
  } else if (!isbnPattern.test(isbn)) {
    nextErrors.isbn = 'ISBN must be 10-17 digits or hyphens.';
  }

  if (!genre) {
    nextErrors.genre = 'Genre is required.';
  }

  if (!Number.isInteger(year) || year < MIN_PUBLICATION_YEAR || year > CURRENT_YEAR) {
    nextErrors.publicationYear = `Publication year must be between ${MIN_PUBLICATION_YEAR} and ${CURRENT_YEAR}.`;
  }

  if (!Number.isInteger(totalCopies) || totalCopies < 1) {
    nextErrors.totalCopies = 'Total copies must be at least 1.';
  }

  if (!Number.isInteger(availableCopies) || availableCopies < 0) {
    nextErrors.availableCopies = 'Available copies cannot be negative.';
  } else if (Number.isInteger(totalCopies) && availableCopies > totalCopies) {
    nextErrors.availableCopies = 'Available copies cannot exceed total copies.';
  }

  return nextErrors;
}

export function getApiErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}
