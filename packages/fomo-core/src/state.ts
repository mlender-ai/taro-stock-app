import type { FomoState, FomoFace } from "./types.js";

/**
 * FOMO Index(0~100) → 5구간 상태 + 마스코트 표정.
 * docs/FOMO_INDEX.md 스케일과 docs/MASCOT.md §5 표정 매핑을 한 곳에 고정한다.
 * 구간 경계값을 바꾸면 이 표 하나만 수정하면 지표·마스코트가 함께 따라온다.
 */
interface StateBand {
  /** 구간 하한 (이상). */
  min: number;
  state: FomoState;
  face: FomoFace;
  emoji: string;
}

const BANDS: readonly StateBand[] = [
  { min: 81, state: "광기", face: "manic", emoji: "🚀" },
  { min: 61, state: "FOMO", face: "excited", emoji: "🔥" },
  { min: 41, state: "관심", face: "curious", emoji: "👀" },
  { min: 21, state: "관망", face: "calm", emoji: "🙂" },
  { min: 0, state: "무관심", face: "sleepy", emoji: "😴" },
] as const;

/** 점수를 0~100으로 보정. */
export function clampScore(score: number): number {
  if (Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function bandFor(score: number): StateBand {
  const s = clampScore(score);
  for (const band of BANDS) {
    if (s >= band.min) return band;
  }
  // BANDS의 마지막(min:0)이 항상 매칭되므로 도달하지 않음.
  return BANDS[BANDS.length - 1]!;
}

export function scoreToState(score: number): FomoState {
  return bandFor(score).state;
}

export function scoreToFace(score: number): FomoFace {
  return bandFor(score).face;
}

export function scoreToEmoji(score: number): string {
  return bandFor(score).emoji;
}
