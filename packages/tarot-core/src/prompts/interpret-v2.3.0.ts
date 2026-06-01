import type { DrawnCard, MarketSnapshot } from "../types.js";
import { buildInterpretationPromptV2_2, type FinancialContext } from "./interpret-v2.2.0.js";

// 프롬프트 버전: v2.3.0
// 핵심 변경: THREE_CARD 스프레드 전용 스토리텔링 강화
// — 과거/현재/미래 각 카드를 종목 데이터(7일 등락, 뉴스 감정, 재무 건전성)와 명시적으로 엮는다.
// — before/after 샘플처럼 구체적 종목 상황이 해석 서사에 반영되도록 detail 지침을 확장 (#269).
// v2.2.0 대비: single 카드는 v2.2.0과 동일, three-card에만 추가 지침 주입.
export const PROMPT_VERSION_2_3 = "2.3.0";

function buildThreeCardStorytellingBlock(market: MarketSnapshot): string {
  const lines: string[] = [];

  // 7일 방향성을 심리 언어로 번역 (숫자 미노출)
  const { changePercent } = market;
  if (changePercent > 5) {
    lines.push("최근 일주일: 빠르게 올라 모두가 흥분한 상태. 과거 카드는 이 상승의 씨앗을, 현재 카드는 그 흥분이 맞는지를, 미래 카드는 이 에너지가 지속될지를 묻는다.");
  } else if (changePercent > 2) {
    lines.push("최근 일주일: 조용히 방향을 잡으며 올라선 흐름. 과거 카드는 인내의 시간을, 현재 카드는 그 보상이 시작되는 순간을, 미래 카드는 이 흐름을 믿을 용기를 말한다.");
  } else if (changePercent > -2) {
    lines.push("최근 일주일: 오르지도 내리지도 않는 눈치 싸움. 과거 카드는 이 지루함의 원인을, 현재 카드는 지금 선택의 무게를, 미래 카드는 방향이 정해지는 순간을 암시한다.");
  } else if (changePercent > -5) {
    lines.push("최근 일주일: 실망이 조금씩 쌓이는 흐름. 과거 카드는 그 실망의 시작을, 현재 카드는 버텨야 할지 놓아야 할지의 기로를, 미래 카드는 이 압박이 끝나는 시점을 가리킨다.");
  } else {
    lines.push("최근 일주일: 빠른 하락으로 공포가 번진 상태. 과거 카드는 이 하락을 예고했던 신호를, 현재 카드는 지금 당신의 감정 상태를, 미래 카드는 이 공포를 통과한 뒤 무엇이 기다리는지를 보여준다.");
  }

  // 뉴스 감정 레이어 (있을 때만)
  if (market.sentimentScore !== undefined) {
    if (market.sentimentScore > 0.3) {
      lines.push("뉴스 분위기: 좋은 소식이 많다 — 현재 카드의 긍정적 에너지가 이 뉴스 흐름과 공명하는지 읽어라.");
    } else if (market.sentimentScore < -0.3) {
      lines.push("뉴스 분위기: 부정적 소식이 많다 — 현재 카드의 경고 신호와 뉴스 흐름이 같은 방향인지 주목하라.");
    }
  }

  return lines.join("\n");
}

/**
 * v2.3.0 프롬프트 빌더.
 * - cards.length === 3 (THREE_CARD): v2.2.0 기반에 스토리텔링 블록 주입
 * - cards.length !== 3 (SINGLE): v2.2.0과 동일하게 동작
 */
export function buildInterpretationPromptV2_3(
  market: MarketSnapshot,
  cards: DrawnCard[],
  ctx?: FinancialContext
): string {
  const basePrompt = buildInterpretationPromptV2_2(market, cards, ctx);

  // three-card 아닐 경우 추가 지침 불필요
  if (cards.length !== 3) return basePrompt;

  const storyBlock = buildThreeCardStorytellingBlock(market);

  // "6. **3장 스프레드**" 지침 뒤에 종목 데이터 기반 스토리텔링 가이드를 삽입
  return basePrompt.replace(
    "6. **3장 스프레드**: 과거의 집착 → 현재의 혼란 → 미래의 선택으로 감정 여정을 서술한다.",
    `6. **3장 스프레드**: 과거의 집착 → 현재의 혼란 → 미래의 선택으로 감정 여정을 서술한다.

7. **THREE_CARD 종목 데이터 스토리텔링 (3장 전용 필수)**:
   아래 종목 상황을 바탕으로 각 카드가 나타내는 시점(과거/현재/미래)의 감정을 구체적으로 연결하라.
   숫자를 직접 언급하지 말고, 아래 심리 맥락을 detail 서사에 녹여라.

   ${storyBlock}

   나쁜 예: "과거에는 어려움이 있었고, 현재에는 기회가 오고, 미래는 불확실하다."
   좋은 예: "지난주 빠른 하락 속에서 (과거 카드)는 당신이 이미 느꼈던 공포를 대변합니다.
            지금 (현재 카드)는 버텨온 당신에게 이제 방향을 정할 시간임을 알립니다.
            앞으로 (미래 카드)는 이 압박을 통과한 뒤 기다리는 새로운 에너지를 보여줍니다."`
  );
}
