// A random position in a list of `length` items that differs from `current`.
export function pickAnotherIndex(length, current) {
  if (length <= 1) return current;
  let next = Math.floor(Math.random() * length);
  if (next === current) next = (current + 1) % length;
  return next;
}

export function shuffled(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
