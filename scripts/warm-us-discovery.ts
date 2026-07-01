/**
 * US discovery pre-warm.
 *
 * Vercel Data Cache is populated only through deployed HTTP routes. This cron
 * calls the production discovery endpoint before users hit it, so the request
 * path reads a warm discovery response instead of doing cold US quote work.
 */

const BASE = (process.env.WARM_BASE_URL || "https://fomo-club-backend.vercel.app").replace(/\/$/, "");
const REQ_TIMEOUT_MS = 60_000;

async function warm(path: string): Promise<void> {
  const startedAt = Date.now();
  const res = await fetch(`${BASE}${path}`, {
    headers: { "x-warm": "1" },
    signal: AbortSignal.timeout(REQ_TIMEOUT_MS),
  });
  console.log(`[warm-us-discovery] ${res.status} ${Date.now() - startedAt}ms ${path}`);
  if (!res.ok) throw new Error(`warm failed: ${res.status} ${path}`);
}

async function main(): Promise<void> {
  console.log(`[warm-us-discovery] base=${BASE}`);
  await warm("/api/fomo/discovery?country=US");
  await warm("/api/fomo/discovery?country=US&fast=1");
}

main().catch((err) => {
  console.error("[warm-us-discovery] failed", err);
  process.exit(1);
});
