/**
 * 키워드 관심 신호 seam — KEYWORD_CARD_FEED_DEV_SPEC v3 §4.
 *
 * 좌우 스와이프(오른쪽=관심/왼쪽=덜관심)는 "지금은 UI만, 로직은 향후 개인화 단계".
 * 그 단일 기록 지점만 마련해 둔다. 현재는 localStorage 경량 적재(백엔드/ML 없음).
 * 👉 개인화(2~4단계)에서 서버 동기화로 교체할 지점은 여기 한 곳.
 */
const KEY = "fomo_keyword_interest";
const CAP = 200;

export type Interest = "more" | "less";

export function recordInterest(keywordId: string, signal: Interest, nowMs: number): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as unknown[]) : [];
    list.push({ keywordId, signal, ts: nowMs });
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(-CAP)));
  } catch {
    /* 저장 실패는 무시 — 흐름을 막지 않는다 */
  }
}
