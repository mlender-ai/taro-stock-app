import type { DrawnCard, MarketSnapshot } from "../types.js";
import { buildInterpretationPromptV2_4 } from "./interpret-v2.4.0.js";
import type { FinancialContext } from "./interpret-v2.2.0.js";

// 프롬프트 버전: v2.5.0
// 핵심 변경: 해석 텍스트의 "몰입감"과 "재해석 깊이" 강화 (사용자 평점 지표 대상, #338)
// 1. 몰입 감각 레이어 — 추상 감정어 대신 몸의 감각·행동 충동으로 장면을 그려 독자를 안에 세운다.
// 2. 두 번째 시선(리프레임) — 자세 제안 직전, 같은 상황을 다른 각도로 다시 비추는 한 문장.
//    타로의 핵심 가치는 정보가 아니라 '다르게 보기'라는 점을 텍스트에 직접 새긴다.
// 3. 여운 있는 마무리 — detail의 끝을 캡처해 간직하고 싶은 한 줄로 닫는다.
// v2.4.0 대비: 패의 결/안티-클리셰/슬롯 스토리텔링은 그대로 유지, detail 품질 레이어만 덧댄다.
export const PROMPT_VERSION_2_5 = "2.5.0";

// v2.1.0의 detail 언어 품질 규칙 (모든 카드 수 공통으로 존재) 위에 몰입·리프레임 레이어를 덧댄다.
const DETAIL_RULE_ORIGINAL =
  '   - detail: 300-500자. 카드별로 감정 여정을 서사로 엮는다. 마지막 문장은 행동이 아닌 "자세"를 제안한다.';
const DETAIL_RULE_V2_5 = `   - detail: 카드별로 감정 여정을 서사로 엮되, 아래 세 결을 반드시 담는다.
     - 몰입 감각: 추상 감정어("불안하다", "기대된다") 대신 몸의 감각·행동 충동으로 장면을 그린다(예: "손가락이 매수 버튼 위에서 멈칫하는", "잔고를 다시 새로고침하는 손"). 2인칭 '당신'으로 독자를 그 장면 안에 세운다.
     - 두 번째 시선(리프레임): 자세를 제안하기 직전에, 지금의 감정을 다른 각도에서 다시 비추는 한 문장을 넣는다 — 같은 상황을 위협이 아니라 신호로, 혹은 들뜸이 아니라 경계로 뒤집어 본다. 타로의 가치는 정보가 아니라 '다르게 보기'다.
     - 여운 있는 마무리: 마지막 문장은 행동이 아닌 "자세"를 제안하되, 캡처해 간직하고 싶은 한 줄로 닫는다.`;

/**
 * v2.5.0 프롬프트 빌더. 시그니처는 v2.4.0 호환.
 * - 모든 카드 수에 detail 몰입·리프레임 품질 레이어 적용.
 * - 패의 결(v2.4)/슬롯 스토리텔링(v2.3)/재무 컨텍스트(v2.2)는 그대로 유지.
 */
export function buildInterpretationPromptV2_5(
  market: MarketSnapshot,
  cards: DrawnCard[],
  ctx?: FinancialContext
): string {
  const base = buildInterpretationPromptV2_4(market, cards, ctx);
  return base.replace(DETAIL_RULE_ORIGINAL, DETAIL_RULE_V2_5);
}
