import { ACTIVE_CARDS } from "./cards.js";
import type {
  DrawnCard,
  MarketCondition,
  TarotCardOrientation,
  TarotSpreadType,
  TarotSlot,
} from "./types.js";

const SLOTS: TarotSlot[] = ["past", "present", "future"];

// 시장 상황에 따른 역방향 확률 조정
function getReversedProbability(condition: MarketCondition): number {
  switch (condition) {
    case "bearish":   return 0.55;
    case "volatile":  return 0.50;
    case "bullish":   return 0.25;
    case "neutral":   return 0.35;
    case "consolidating": return 0.40;
  }
}

function pickOrientation(condition: MarketCondition): TarotCardOrientation {
  return Math.random() < getReversedProbability(condition) ? "reversed" : "upright";
}

function pickUniqueCards(count: number): typeof ACTIVE_CARDS {
  const shuffled = [...ACTIVE_CARDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function drawCards(
  spread: TarotSpreadType,
  condition: MarketCondition
): DrawnCard[] {
  if (spread === "single") {
    const [card] = pickUniqueCards(1);
    if (!card) throw new Error("No active cards available");
    return [{ card, orientation: pickOrientation(condition) }];
  }

  return pickUniqueCards(3).map((card, i): DrawnCard => ({
    card,
    orientation: pickOrientation(condition),
    slot: SLOTS[i] ?? "past",
  }));
}

export const DRAW_COST: Record<TarotSpreadType, number> = {
  single: 1,
  "three-card": 3,
};
