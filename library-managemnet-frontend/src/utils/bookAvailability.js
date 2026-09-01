export function getAvailableCopies(book) {
  const copies = Number(book?.availableCopies);
  return Number.isFinite(copies) ? copies : 0;
}

export function canBorrowBook(book) {
  return getAvailableCopies(book) > 0;
}

export function canReserveBook(book) {
  const available = getAvailableCopies(book);
  const total = Number(book?.totalCopies);
  const safeTotal = Number.isFinite(total) && total > 0 ? total : available;

  // Reserve checked-out titles and high-demand titles that are already partly on loan.
  return available < safeTotal;
}
