import type { DrawnCard, MarketCondition, TarotSpreadType } from "./types.js";

const CACHE_TTL_MS: Record<MarketCondition, number> = {
  volatile:      30 * 60 * 1000,   // 30분
  bullish:       60 * 60 * 1000,   // 1시간
  bearish:       60 * 60 * 1000,   // 1시간
  neutral:       2 * 60 * 60 * 1000,  // 2시간
  consolidating: 2 * 60 * 60 * 1000,  // 2시간
};

export function buildCacheKey(
  ticker: string,
  spread: TarotSpreadType,
  cards: DrawnCard[],
  condition: MarketCondition
): string {
  const cardPart = cards
    .map((c) => `${c.card.id}:${c.orientation}`)
    .join("|");
  return `tarot:${ticker}:${spread}:${condition}:${cardPart}`;
}

export function getCacheTtlMs(condition: MarketCondition): number {
  return CACHE_TTL_MS[condition];
}

export function isCacheExpired(cachedAt: string, condition: MarketCondition): boolean {
  const ttl = getCacheTtlMs(condition);
  return Date.now() - new Date(cachedAt).getTime() > ttl;
}
