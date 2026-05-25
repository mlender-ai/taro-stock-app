import { NextRequest, NextResponse } from "next/server";
import type { StockChartBar, StockChartResponse } from "@trading/shared/src/stockTypes";

const YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart";
const USER_AGENT = "Mozilla/5.0 (compatible; TarotStockBot/1.0)";

// 5분 in-memory 캐시
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { data: StockChartResponse; expiresAt: number }>();

const VALID_RANGES = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "max"];
const RANGE_INTERVAL_MAP: Record<string, string> = {
  "1d": "5m",
  "5d": "15m",
  "1mo": "1d",
  "3mo": "1d",
  "6mo": "1d",
  "1y": "1wk",
  "2y": "1wk",
  "5y": "1mo",
  max: "1mo",
};

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  const range = req.nextUrl.searchParams.get("range") ?? "3mo";
  if (!VALID_RANGES.includes(range)) {
    return NextResponse.json({ error: `Invalid range. Valid: ${VALID_RANGES.join(",")}` }, { status: 400 });
  }

  const interval = req.nextUrl.searchParams.get("interval") ?? RANGE_INTERVAL_MAP[range] ?? "1d";
  const cacheKey = `${symbol}:${range}:${interval}`;

  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > now) {
    return NextResponse.json(hit.data);
  }

  try {
    const url = new URL(`${YAHOO_CHART_URL}/${encodeURIComponent(symbol)}`);
    url.searchParams.set("range", range);
    url.searchParams.set("interval", interval);
    url.searchParams.set("includePrePost", "false");

    const res = await fetch(url.toString(), {
      headers: { accept: "application/json", "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Yahoo chart error ${res.status}` },
        { status: 502 }
      );
    }

    const payload = await res.json() as {
      chart?: {
        result?: Array<{
          meta?: { currency?: string; symbol?: string; exchangeName?: string };
          timestamp?: number[];
          indicators?: {
            quote?: Array<{
              open?: Array<number | null>;
              high?: Array<number | null>;
              low?: Array<number | null>;
              close?: Array<number | null>;
              volume?: Array<number | null>;
            }>;
          };
        }>;
      };
    };

    const result = payload.chart?.result?.[0];
    if (!result) {
      return NextResponse.json({ error: "No chart data" }, { status: 404 });
    }

    const timestamps = result.timestamp ?? [];
    const quote = result.indicators?.quote?.[0];
    const opens = quote?.open ?? [];
    const highs = quote?.high ?? [];
    const lows = quote?.low ?? [];
    const closes = quote?.close ?? [];
    const volumes = quote?.volume ?? [];

    const bars: StockChartBar[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const c = closes[i];
      if (c == null || !Number.isFinite(c)) continue;
      bars.push({
        date: new Date(timestamps[i]! * 1000).toISOString(),
        open: opens[i] ?? c,
        high: highs[i] ?? c,
        low: lows[i] ?? c,
        close: c,
        volume: volumes[i] ?? 0,
      });
    }

    const meta: StockChartResponse["meta"] = {
      currency: result.meta?.currency ?? "USD",
      symbol: result.meta?.symbol ?? symbol,
    };
    if (result.meta?.exchangeName) {
      meta.exchangeName = result.meta.exchangeName;
    }
    const data: StockChartResponse = { bars, meta };

    cache.set(cacheKey, { data, expiresAt: now + CACHE_TTL_MS });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
