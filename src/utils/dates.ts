export const toIsoDate = (date: Date): string => {
  return date.toISOString().slice(0, 10);
};

export const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const randomDateBetween = (start: Date, end: Date, rng: () => number): Date => {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const offset = Math.floor(rng() * (endTime - startTime + 1));
  return new Date(startTime + offset);
};
