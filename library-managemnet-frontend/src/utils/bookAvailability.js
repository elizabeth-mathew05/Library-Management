export function getAvailableCopies(book) {
  const copies = Number(book?.availableCopies);
  return Number.isFinite(copies) ? copies : 0;
}

export function canBorrowBook(book) {
  return getAvailableCopies(book) > 0;
}

export function canReserveBook(book) {
  return getAvailableCopies(book) <= 0;
}
