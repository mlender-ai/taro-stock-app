import type { DeckCard } from "@fomo/core";

/**
 * 스와이프 히스토리 seam — docs/PIVOT_FEED_FIRST.md.
 *
 * 지금은 저장 안 함이 원칙이나, 출시 후 "유저가 FOMO로 넘긴 카드 히스토리"가 필요할 수 있어
 * 단일 진입점만 마련해 둔다. 현재 구현은 localStorage 경량 적재(백엔드 없음).
 * 👉 출시 후 서버 동기화로 교체할 지점은 여기 한 곳뿐.
 */

const KEY = "fomo_swipe_history";
const CAP = 200;

export type SwipeDir = "fomo" | "skip";

interface SwipeEntry {
  id: string;
  title: string;
  dir: SwipeDir;
  ts: number;
}

function cardId(card: DeckCard): string {
  return card.kind === "news" ? card.article.id : `chart-${card.chart.key}`;
}
function cardTitle(card: DeckCard): string {
  return card.kind === "news" ? card.article.title : card.chart.label;
}

/** 스와이프 1건 기록(현재 localStorage). 실패해도 조용히 무시 — 흐름을 막지 않는다. */
export function recordSwipe(card: DeckCard, dir: SwipeDir, nowMs: number): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY);
    const list: SwipeEntry[] = raw ? (JSON.parse(raw) as SwipeEntry[]) : [];
    list.push({ id: cardId(card), title: cardTitle(card), dir, ts: nowMs });
    // 최근 CAP개만 유지.
    const trimmed = list.slice(-CAP);
    window.localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    /* 저장 실패는 무시 */
  }
}

/** FOMO로 넘긴 기록만(향후 히스토리 화면 후보). */
export function getFomoHistory(): SwipeEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const list: SwipeEntry[] = raw ? (JSON.parse(raw) as SwipeEntry[]) : [];
    return list.filter((e) => e.dir === "fomo");
  } catch {
    return [];
  }
}
