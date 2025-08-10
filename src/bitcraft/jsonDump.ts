export function jsonDump<T>(arg: T) {
  return JSON.stringify(
    arg,
    (k, v) => (typeof v === "bigint" ? v.toString() : v),
    2
  );
}
