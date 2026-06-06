const getBookStatus = (availableCopies, totalCopies) => {
  if (availableCopies <= 0) {
    return 'unavailable';
  }

  if (availableCopies < totalCopies) {
    return 'limited';
  }

  return 'available';
};

export default getBookStatus;
