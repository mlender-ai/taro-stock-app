import type { DeckCard } from "@fomo/core";

/**
 * 스와이프 히스토리 seam (네이티브). docs/PIVOT_FEED_FIRST.md.
 *
 * 지금은 저장 안 함이 원칙이라 인메모리만(앱 실행 단위). 출시 후 유저가 FOMO로 넘긴 카드
 * 히스토리가 필요하면 expo-secure-store/AsyncStorage 또는 서버 동기화로 이 함수만 교체한다.
 */
export type SwipeDir = "fomo" | "skip";

interface SwipeEntry {
  id: string;
  title: string;
  dir: SwipeDir;
  ts: number;
}

const history: SwipeEntry[] = [];
const CAP = 200;

function cardId(card: DeckCard): string {
  return card.kind === "news" ? card.article.id : `chart-${card.chart.key}`;
}
function cardTitle(card: DeckCard): string {
  return card.kind === "news" ? card.article.title : card.chart.label;
}

/** 스와이프 1건 기록(현재 인메모리). 흐름을 막지 않는다. */
export function recordSwipe(card: DeckCard, dir: SwipeDir, nowMs: number): void {
  history.push({ id: cardId(card), title: cardTitle(card), dir, ts: nowMs });
  if (history.length > CAP) history.splice(0, history.length - CAP);
}

/** FOMO로 넘긴 기록만(향후 히스토리 화면 후보). */
export function getFomoHistory(): SwipeEntry[] {
  return history.filter((e) => e.dir === "fomo");
}
