export async function filterAsync<T>(
  items: T[],
  predicate: (item: T, index: number) => Promise<boolean>,
): Promise<T[]> {
  const results = await Promise.allSettled(
    items.map(async (item, index) => {
      const keep = await predicate(item, index);
      return keep ? item : null;
    }),
  );

  return results
    .filter(
      (res): res is PromiseFulfilledResult<NonNullable<Awaited<T>>> =>
        res.status === "fulfilled" && res.value !== null,
    )
    .map((res) => res.value);
}
