import { NextRequest, NextResponse } from "next/server";
import type { StockQuote } from "@trading/shared/src/stockTypes";

const YAHOO_QUOTE_URL = "https://query2.finance.yahoo.com/v10/finance/quoteSummary";
const USER_AGENT = "Mozilla/5.0 (compatible; TarotStockBot/1.0)";

// 5분 in-memory 캐시
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { data: StockQuote; expiresAt: number }>();

function extractNum(obj: unknown): number | null {
  if (obj && typeof obj === "object" && "raw" in obj) {
    const raw = (obj as { raw?: unknown }).raw;
    return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
  }
  if (typeof obj === "number" && Number.isFinite(obj)) return obj;
  return null;
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  const now = Date.now();
  const hit = cache.get(symbol);
  if (hit && hit.expiresAt > now) {
    return NextResponse.json(hit.data);
  }

  try {
    const modules = "price,summaryDetail,defaultKeyStatistics,financialData";
    const url = `${YAHOO_QUOTE_URL}/${encodeURIComponent(symbol)}?modules=${modules}`;
    const res = await fetch(url, {
      headers: { accept: "application/json", "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Yahoo API error ${res.status}` },
        { status: 502 }
      );
    }

    const payload = await res.json() as {
      quoteSummary?: {
        result?: Array<{
          price?: Record<string, unknown>;
          summaryDetail?: Record<string, unknown>;
          defaultKeyStatistics?: Record<string, unknown>;
          financialData?: Record<string, unknown>;
        }>;
      };
    };

    const result = payload.quoteSummary?.result?.[0];
    if (!result) {
      return NextResponse.json({ error: "No data found" }, { status: 404 });
    }

    const price = result.price ?? {};
    const summary = result.summaryDetail ?? {};
    const keyStats = result.defaultKeyStatistics ?? {};
    const financialData = result.financialData ?? {};

    const currentPrice = extractNum(price.regularMarketPrice) ?? 0;
    const previousClose = extractNum(price.regularMarketPreviousClose) ?? 0;
    const change = extractNum(price.regularMarketChange) ?? (currentPrice - previousClose);
    const changePercent = extractNum(price.regularMarketChangePercent) ??
      (previousClose ? ((currentPrice - previousClose) / previousClose) * 100 : 0);

    const quote: StockQuote = {
      symbol,
      shortName: (price.shortName as string) ?? symbol,
      longName: (price.longName as string) ?? (price.shortName as string) ?? symbol,
      currency: (price.currency as string) ?? "USD",
      exchange: (price.exchangeName as string) ?? "",
      currentPrice,
      previousClose,
      change,
      changePercent,
      dayLow: extractNum(summary.dayLow) ?? 0,
      dayHigh: extractNum(summary.dayHigh) ?? 0,
      fiftyTwoWeekLow: extractNum(summary.fiftyTwoWeekLow) ?? 0,
      fiftyTwoWeekHigh: extractNum(summary.fiftyTwoWeekHigh) ?? 0,
      marketCap: extractNum(price.marketCap) ?? 0,
      trailingPE: extractNum(summary.trailingPE),
      forwardPE: extractNum(keyStats.forwardPE) ?? extractNum(summary.forwardPE),
      priceToBook: extractNum(keyStats.priceToBook),
      dividendYield: extractNum(summary.dividendYield),
      volume: extractNum(summary.volume) ?? 0,
      averageVolume: extractNum(summary.averageVolume) ?? 0,
      // Phase 2 extended fields
      returnOnEquity: extractNum(financialData.returnOnEquity),
      grossMargins: extractNum(financialData.grossMargins),
      operatingMargins: extractNum(financialData.operatingMargins),
      totalRevenue: extractNum(financialData.totalRevenue),
      revenueGrowth: extractNum(financialData.revenueGrowth),
      debtToEquity: extractNum(financialData.debtToEquity),
    };

    cache.set(symbol, { data: quote, expiresAt: now + CACHE_TTL_MS });
    return NextResponse.json(quote);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
