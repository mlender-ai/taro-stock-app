import { NextRequest, NextResponse } from "next/server";
import type { StockQuote } from "@trading/shared/src/stockTypes";

const YAHOO_QUOTE_URL = "https://query2.finance.yahoo.com/v10/finance/quoteSummary";
const USER_AGENT = "Mozilla/5.0 (compatible; TarotStockBot/1.0)";

// 캐시 재활용: quote API와 공유
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { data: MiniQuote; expiresAt: number }>();

interface MiniQuote {
  symbol: string;
  shortName: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  currency: string;
}

function extractNum(obj: unknown): number | null {
  if (obj && typeof obj === "object" && "raw" in obj) {
    const raw = (obj as { raw?: unknown }).raw;
    return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
  }
  if (typeof obj === "number" && Number.isFinite(obj)) return obj;
  return null;
}

async function fetchSingleQuote(symbol: string): Promise<MiniQuote | null> {
  const now = Date.now();
  const hit = cache.get(symbol);
  if (hit && hit.expiresAt > now) return hit.data;

  try {
    const url = `${YAHOO_QUOTE_URL}/${encodeURIComponent(symbol)}?modules=price`;
    const res = await fetch(url, {
      headers: { accept: "application/json", "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(6_000),
    });
    if (!res.ok) return null;

    const payload = await res.json() as {
      quoteSummary?: { result?: Array<{ price?: Record<string, unknown> }> };
    };
    const price = payload.quoteSummary?.result?.[0]?.price;
    if (!price) return null;

    const currentPrice = extractNum(price.regularMarketPrice) ?? 0;
    const previousClose = extractNum(price.regularMarketPreviousClose) ?? 0;

    const q: MiniQuote = {
      symbol,
      shortName: (price.shortName as string) ?? symbol,
      currentPrice,
      change: extractNum(price.regularMarketChange) ?? (currentPrice - previousClose),
      changePercent: extractNum(price.regularMarketChangePercent) ??
        (previousClose ? ((currentPrice - previousClose) / previousClose) * 100 : 0),
      currency: (price.currency as string) ?? "USD",
    };

    cache.set(symbol, { data: q, expiresAt: now + CACHE_TTL_MS });
    return q;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const symbolsParam = req.nextUrl.searchParams.get("symbols");
  if (!symbolsParam) {
    return NextResponse.json({ error: "symbols required" }, { status: 400 });
  }

  const symbols = symbolsParam.split(",").slice(0, 20); // 최대 20개
  const results = await Promise.allSettled(symbols.map(fetchSingleQuote));

  const quotes: MiniQuote[] = [];
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) {
      quotes.push(r.value);
    }
  }

  return NextResponse.json({ quotes });
}
