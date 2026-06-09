import type { FomoIndex, HeatComponent } from "../types";
import { scoreToState } from "../state";
import { marketHeat, MARKET_HEAT_MAX } from "./marketHeat";
import { communityHeat, COMMUNITY_HEAT_MAX } from "./communityHeat";
import { emotionHeat, EMOTION_HEAT_MAX } from "./emotionHeat";
import { whaleHeat } from "./whaleHeat";
import type { MarketSignals, CommunitySignals, EmotionTally, WhaleEvent } from "./types";

export interface FomoIndexInputs {
  market?: MarketSignals;
  community?: CommunitySignals;
  emotion?: EmotionTally;
  whale?: WhaleEvent[];
}

// 소스별 안전한 폴백값 — 중립(half-max) 또는 보너스 미발생(0).
const FALLBACK_COMPONENTS: HeatComponent[] = [
  { key: "market",    score: MARKET_HEAT_MAX / 2,    max: MARKET_HEAT_MAX,    meta: { confidence: "fallback", sourcesTotal: 4, sourcesAvailable: 0 } },
  { key: "community", score: COMMUNITY_HEAT_MAX / 2, max: COMMUNITY_HEAT_MAX, meta: { confidence: "fallback", sourcesTotal: 3, sourcesAvailable: 0 } },
  { key: "emotion",   score: EMOTION_HEAT_MAX / 2,   max: EMOTION_HEAT_MAX,   meta: { confidence: "fallback", sourcesTotal: 1, sourcesAvailable: 0 } },
  { key: "whale",     score: 0,                       max: 10,                 meta: { confidence: "fallback", sourcesTotal: 1, sourcesAvailable: 0 } },
];

/**
 * 4개 Heat를 합산하여 FOMO Index(0~100) + 상태를 산출한다.
 * Market 30 + Community 30 + Emotion 30 + Whale 10. docs/FOMO_INDEX.md.
 * 모든 입력 미비 또는 예외 시에도 중립 스냅샷을 반환한다(절대 에러 전파 없음).
 */
export function computeFomoIndex(inputs: FomoIndexInputs, date: string): FomoIndex {
  const components: HeatComponent[] = [
    safeHeat("market",    () => marketHeat(inputs.market),       FALLBACK_COMPONENTS[0]!),
    safeHeat("community", () => communityHeat(inputs.community), FALLBACK_COMPONENTS[1]!),
    safeHeat("emotion",   () => emotionHeat(inputs.emotion),     FALLBACK_COMPONENTS[2]!),
    safeHeat("whale",     () => whaleHeat(inputs.whale),         FALLBACK_COMPONENTS[3]!),
  ];
  const score = components.reduce((acc, c) => acc + c.score, 0);
  return { date, score, state: scoreToState(score), components };
}

function safeHeat(
  key: string,
  fn: () => HeatComponent,
  fallback: HeatComponent
): HeatComponent {
  try {
    return fn();
  } catch (err) {
    console.warn(`[fomo-core] ${key} Heat 산출 오류 — 폴백 적용:`, err);
    return fallback;
  }
}
