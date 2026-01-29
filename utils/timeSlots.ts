export const DEFAULT_TIME_SLOTS = Array.from({ length: 24 }, (_, hour) => {
  const padded = hour.toString().padStart(2, '0');
  return `${padded}:00`;
});
