import { STOCK_VOCAB, type DiscoveryMarket } from "@fomo/core";
import type { DiscoveryMarketRow } from "./market-source-types";
import { usStockDefs, usSymbolForStock } from "./us-symbols";

const TWELVE_DATA_URL = "https://api.twelvedata.com/quote";
const UA = "Mozilla/5.0 (compatible; FomoClubBot/1.0)";

interface TwelveQuote {
  symbol?: string;
  name?: string;
  exchange?: string;
  close?: string;
  price?: string;
  change?: string;
  percent_change?: string;
  volume?: string;
  currency?: string;
}

function tdKey(): string | undefined {
  return process.env.TWELVE_DATA_API_KEY?.trim();
}

function num(value: string | number | undefined): number | undefined {
  const n = typeof value === "number" ? value : Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

function money(value: number | undefined): string | undefined {
  if (typeof value !== "number") return undefined;
  return `$${value >= 100 ? value.toLocaleString("en-US", { maximumFractionDigits: 2 }) : value.toFixed(2)}`;
}

function marketFor(defMarket: string, exchange: string | undefined): DiscoveryMarket {
  if (defMarket === "NYSE" || /NYSE/i.test(exchange ?? "")) return "NYSE";
  return "NASDAQ";
}

function parseQuote(defCanonical: string, quote: TwelveQuote): DiscoveryMarketRow | null {
  const symbol = (quote.symbol ?? usSymbolForStock(defCanonical) ?? "").toUpperCase();
  if (!symbol) return null;
  const def = STOCK_VOCAB.find((stock) => stock.canonical === defCanonical);
  const price = num(quote.price) ?? num(quote.close);
  const pct = num(quote.percent_change);
  const change = num(quote.change);
  const priceText = money(price);
  const volume = num(quote.volume);
  const dir = typeof pct !== "number" ? "flat" : pct > 0 ? "up" : pct < 0 ? "down" : "flat";
  return {
    canonical: defCanonical,
    symbol,
    market: marketFor(def?.market ?? "NASDAQ", quote.exchange),
    country: def?.country ?? "US",
    currency: "USD",
    ...(priceText ? { priceText } : {}),
    ...(typeof pct === "number" ? { changePct: pct } : {}),
    ...(typeof pct === "number" || typeof change === "number"
      ? { changeText: `${typeof change === "number" ? `${change > 0 ? "+" : ""}${change.toFixed(2)}` : ""}${typeof pct === "number" ? ` (${pct > 0 ? "+" : ""}${pct.toFixed(2)}%)` : ""}`.trim() }
      : {}),
    changeDir: dir,
    ...(volume ? { tradingValue: volume } : {}),
  };
}

function normalizeQuoteResponse(data: unknown): Record<string, TwelveQuote> {
  if (!data || typeof data !== "object") return {};
  const root = data as Record<string, unknown>;
  if ("symbol" in root) {
    const q = root as TwelveQuote;
    return q.symbol ? { [q.symbol.toUpperCase()]: q } : {};
  }
  const out: Record<string, TwelveQuote> = {};
  for (const [key, value] of Object.entries(root)) {
    if (value && typeof value === "object" && !("code" in (value as Record<string, unknown>))) {
      out[key.toUpperCase()] = value as TwelveQuote;
    }
  }
  return out;
}

/**
 * US quote adapter. Twelve Data is used because Yahoo chart endpoints are unstable from Node/undici.
 * If the key is absent or the upstream fails, return [] rather than synthesizing cards.
 */
export async function fetchUsMarketRows(): Promise<DiscoveryMarketRow[]> {
  const key = tdKey();
  if (!key) return [];
  const defs = usStockDefs();
  const symbols = defs.map((def) => usSymbolForStock(def.canonical)).filter((symbol): symbol is string => !!symbol);
  if (symbols.length === 0) return [];
  try {
    const url = new URL(TWELVE_DATA_URL);
    url.searchParams.set("symbol", symbols.join(","));
    url.searchParams.set("apikey", key);
    const res = await fetch(url.toString(), {
      headers: { accept: "application/json", "user-agent": UA },
      signal: AbortSignal.timeout(8_000),
      next: { revalidate: 600 },
    });
    if (!res.ok) return [];
    const bySymbol = normalizeQuoteResponse(await res.json());
    const rows: DiscoveryMarketRow[] = [];
    for (const def of defs) {
      const symbol = usSymbolForStock(def.canonical);
      if (!symbol) continue;
      const quote = bySymbol[symbol.toUpperCase()];
      if (!quote) continue;
      const row = parseQuote(def.canonical, quote);
      if (row) rows.push(row);
    }
    return rows;
  } catch (err) {
    console.warn("[us-market-source] Twelve Data quote failed", (err as Error)?.message);
    return [];
  }
}
