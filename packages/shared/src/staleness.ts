// Cache freshness utilities.
// dataAt: ISO 8601 timestamp from server response (StockQuote.dataAt).
// freshTtlMs: data considered fresh within this window — fetch can be skipped.
// staleTtlMs: data older than this is considered too stale to display — must fetch.
// Between fresh and stale: display cached data immediately and revalidate in background.

export type Freshness = "fresh" | "stale" | "expired";

export function classifyFreshness(
  dataAt: string | null | undefined,
  now: number,
  freshTtlMs: number,
  staleTtlMs: number
): Freshness {
  if (!dataAt) return "expired";
  const t = Date.parse(dataAt);
  if (!Number.isFinite(t)) return "expired";
  const age = now - t;
  if (age < 0) return "fresh"; // server clock ahead of client — treat as fresh
  if (age <= freshTtlMs) return "fresh";
  if (age <= staleTtlMs) return "stale";
  return "expired";
}

export function isFresh(dataAt: string | null | undefined, now: number, freshTtlMs: number): boolean {
  return classifyFreshness(dataAt, now, freshTtlMs, freshTtlMs) === "fresh";
}
