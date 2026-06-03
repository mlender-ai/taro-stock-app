import { describe, it, expect } from "vitest";
import { buildInterpretationPromptV2_5 } from "../prompts/interpret-v2.5.0.js";
import { buildInterpretationPromptV2_4 } from "../prompts/interpret-v2.4.0.js";
import type { FinancialContext } from "../prompts/interpret-v2.2.0.js";
import type { MarketSnapshot, DrawnCard } from "../types.js";

function baseMarket(): MarketSnapshot {
  return {
    ticker: "AAPL",
    market: "US",
    price: 200,
    changePercent: 0.5,
    volume: 1_000_000,
    condition: "neutral",
    summary: "AAPL 200 (+0.50%) — 중립",
  };
}

function card(id: string, nameKo: string, orientation: "upright" | "reversed" = "upright"): DrawnCard {
  return {
    card: {
      id,
      name: id,
      nameKo,
      arcana: "major",
      number: 0,
      keywords: ["change"],
      keywordsKo: ["변화"],
      meaningUpright: "흔들림",
      meaningReversed: "회복",
      imageUrl: `/cards/${id}.jpg`,
      toneGuide: "차분한",
      isActive: true,
    },
    orientation,
  };
}

describe("interpret-v2.5.0 — 몰입·리프레임 품질 레이어", () => {
  it("단일 카드 — detail 몰입 감각·리프레임 규칙이 삽입된다", () => {
    const prompt = buildInterpretationPromptV2_5(baseMarket(), [card("the-tower", "탑")]);
    expect(prompt).toContain("몰입 감각");
    expect(prompt).toContain("두 번째 시선(리프레임)");
    expect(prompt).toContain("여운 있는 마무리");
  });

  it("v2.4의 패의 결·안티-클리셰는 그대로 보존된다", () => {
    const prompt = buildInterpretationPromptV2_5(baseMarket(), [card("the-tower", "탑")]);
    expect(prompt).toContain("## 패의 결 — 정·역의 긴장");
    expect(prompt).toContain("안티-클리셰");
    expect(prompt).toContain("정조준");
  });

  it("3장 스프레드 — 슬롯 스토리텔링 유지 + 품질 레이어 덧댐", () => {
    const cards = [
      card("the-tower", "탑", "upright"),
      card("the-star", "별", "reversed"),
      card("the-sun", "태양", "upright"),
    ];
    const v25 = buildInterpretationPromptV2_5(baseMarket(), cards);
    expect(v25).toContain("3장 스프레드 스토리텔링 (v2.3)");
    expect(v25).toContain("두 번째 시선(리프레임)");
  });

  it("기존 detail 단문 규칙은 교체되어 사라진다", () => {
    const prompt = buildInterpretationPromptV2_5(baseMarket(), [card("the-tower", "탑")]);
    expect(prompt).not.toContain(
      '   - detail: 300-500자. 카드별로 감정 여정을 서사로 엮는다. 마지막 문장은 행동이 아닌 "자세"를 제안한다.'
    );
  });

  it("v2.4 출력에 덧대어진다 (재무·슬롯 컨텍스트 보존, 길이 증가)", () => {
    const market = baseMarket();
    market.fiftyTwoWeekPosition = 0.8;
    const ctx: FinancialContext = { debtToEquity: 250, currentRatio: 0.8 };
    const cards = [
      card("the-tower", "탑", "upright"),
      card("the-star", "별", "upright"),
      card("the-sun", "태양", "upright"),
    ];
    const v25 = buildInterpretationPromptV2_5(market, cards, ctx);
    const v24 = buildInterpretationPromptV2_4(market, cards, ctx);
    expect(v25.length).toBeGreaterThan(v24.length);
    expect(v25).toContain("미래 슬롯");
    expect(v25).toContain("높은 부채가 앞날의 변동성을 키우는 요소");
  });

  it("품질 레이어는 원시 수치를 노출하지 않는다", () => {
    const market = baseMarket();
    market.fiftyTwoWeekPosition = 0.8;
    const ctx: FinancialContext = { debtToEquity: 250 };
    const prompt = buildInterpretationPromptV2_5(market, [card("the-tower", "탑", "reversed")], ctx);
    expect(prompt).not.toContain("0.8");
    expect(prompt).not.toContain("250");
  });
});
