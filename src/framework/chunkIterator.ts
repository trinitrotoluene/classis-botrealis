export function* chunkIterator<T>(array: T[], chunkSize: number) {
  const len = array.length;
  for (let i = 0; i < len; i += chunkSize) {
    yield array.slice(i, Math.min(i + chunkSize, len));
  }
}
