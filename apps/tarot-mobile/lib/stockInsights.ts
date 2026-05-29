import { getCardNarrative, getFallbackInterpretation } from "@tarot/core";
import type { DrawnCard, MarketCondition } from "@tarot/core";

/**
 * Generates investment insights based on drawn tarot cards and market conditions.
 *
 * @param ticker - The stock ticker associated with the insights.
 * @param drawnCards - Array of drawn tarot cards.
 * @param marketCondition - Current market condition.
 * @returns An array of insights generated for the stock.
 */
export function generateStockInsights(
  ticker: string,
  drawnCards: DrawnCard[],
  marketCondition: MarketCondition
): string[] {
  try {
    return drawnCards.map((card) => {
      const narrative = getCardNarrative(card.card.id, card.orientation);
      return `종목 "${ticker}" (${marketCondition} 시장 상황): ${narrative}`;
    });
  } catch {
    return getFallbackInterpretation();
  }
}
