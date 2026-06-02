import type { DrawnCard, MarketSnapshot } from "../types.js";
import { buildInterpretationPromptV2_3 } from "./interpret-v2.3.0.js";
import type { FinancialContext } from "./interpret-v2.2.0.js";

// 프롬프트 버전: v2.4.0
// 핵심 변경: AI 해석 텍스트 품질 강화 (사용자 평점 지표 대상)
// 1. "패의 결" — 뽑힌 카드의 정/역 구성에서 오는 심리적 긴장을 맥락으로 추가 (단일·3장 공통)
// 2. 안티-클리셰 헤드라인 규칙 — 추상적·범용 도입부 차단으로 공감 정밀도 향상
// 3. summary 첫 문장 정밀도 강화 — "지금 이 종목을 든 마음"을 한 문장으로 정조준
// v2.3.0 대비: 슬롯 매핑/스토리텔링은 그대로 유지, 모든 카드 수에 품질 레이어를 덧댄다.
export const PROMPT_VERSION_2_4 = "2.4.0";

// 정방향/역방향 구성 → 마음과 흐름의 정렬 긴장 (숫자·지표 미노출)
function buildOrientationTension(cards: DrawnCard[]): string | null {
  if (cards.length === 0) return null;

  const reversed = cards.filter((c) => c.orientation === "reversed").length;
  const upright = cards.length - reversed;

  // 단일 카드: 한 장의 방향이 곧 마음의 방향
  if (cards.length === 1) {
    return upright === 1
      ? "정방향 한 장 — 마음이 바라보는 방향과 카드가 가리키는 곳이 같은, 비교적 또렷한 순간"
      : "역방향 한 장 — 겉으로 드러난 흐름보다 미뤄둔 감정과 속마음이 더 크게 말하는 순간";
  }

  // 복수 카드: 정·역의 분포가 만드는 내면의 결
  if (reversed === 0) {
    return "뽑힌 카드가 모두 정방향 — 마음의 방향과 시장의 흐름이 한곳을 보는, 흔들림이 적은 결";
  }
  if (upright === 0) {
    return "뽑힌 카드가 모두 역방향 — 겉으로 드러난 흐름보다 내면의 저항과 미뤄둔 감정이 더 크게 말하는 결";
  }
  return "정방향과 역방향이 섞인 패 — 바깥의 신호와 속마음이 엇갈리는, 한쪽으로 단정할 수 없는 긴장의 결";
}

function buildTensionSection(cards: DrawnCard[]): string {
  const tension = buildOrientationTension(cards);
  if (!tension) return "";
  return `## 패의 결 — 정·역의 긴장\n- ${tension}\n\n`;
}

// 안티-클리셰: 추상적·범용 도입부를 막아 공감 정밀도를 끌어올린다
const HEADLINE_RULE_ORIGINAL =
  '   - headline: 15자 이내, 투자자가 "맞아!"를 외치는 공감형 문장';
const HEADLINE_RULE_V2_4 = `   - headline: 15자 이내, 투자자가 "맞아!"를 외치는 공감형 문장
     - 안티-클리셰: "~의 에너지가 흐릅니다", "변화의 바람", "새로운 시작", "우주의 기운", "운명의 카드"처럼 카드 일반론으로 시작하는 문장은 무효. 반드시 '지금 이 종목을 든 사람의 구체적 감정·행동 충동'에서 출발한다.`;

// summary 첫 문장 정밀도 강화 — 범용 위로가 아니라 정조준
const SUMMARY_RULE_ORIGINAL =
  "   - summary: 2-3문장. 첫 문장은 지금 이 종목을 들고 있는 심리를 정확히 짚는다.";
const SUMMARY_RULE_V2_4 =
  "   - summary: 2-3문장. 첫 문장은 '위 심리적 풍경·패의 결'에서 드러난 지금 이 종목을 든 마음을 한 문장으로 정조준한다(범용 위로·일반론 금지). 이어지는 문장은 그 감정이 왜 지금 생기는지를 카드와 연결한다.";

/**
 * v2.4.0 프롬프트 빌더. 시그니처는 v2.3.0 호환.
 * - 모든 카드 수에 품질 레이어 적용 (단일 카드 뉴스 인사이트 포함).
 * - 슬롯 매핑/스토리텔링(v2.3) 및 재무 컨텍스트(v2.2)는 그대로 유지.
 */
export function buildInterpretationPromptV2_4(
  market: MarketSnapshot,
  cards: DrawnCard[],
  ctx?: FinancialContext
): string {
  const base = buildInterpretationPromptV2_3(market, cards, ctx);

  // "패의 결" 섹션을 "## 뽑힌 카드" 바로 앞에 삽입 (재무·슬롯 섹션 다음, 카드 앞)
  const tensionSection = buildTensionSection(cards);
  let enhanced = tensionSection
    ? base.replace("## 뽑힌 카드", `${tensionSection}## 뽑힌 카드`)
    : base;

  enhanced = enhanced.replace(HEADLINE_RULE_ORIGINAL, HEADLINE_RULE_V2_4);
  enhanced = enhanced.replace(SUMMARY_RULE_ORIGINAL, SUMMARY_RULE_V2_4);

  return enhanced;
}
