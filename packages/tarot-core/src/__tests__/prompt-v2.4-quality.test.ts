import { describe, it, expect } from "vitest";
import { buildInterpretationPromptV2_4 } from "../prompts/interpret-v2.4.0.js";
import { buildInterpretationPromptV2_3 } from "../prompts/interpret-v2.3.0.js";
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

describe("interpret-v2.4.0 — 해석 텍스트 품질 강화", () => {
  it("단일 정방향 — 패의 결 섹션과 품질 규칙이 삽입된다", () => {
    const prompt = buildInterpretationPromptV2_4(baseMarket(), [card("the-tower", "탑", "upright")]);
    expect(prompt).toContain("## 패의 결 — 정·역의 긴장");
    expect(prompt).toContain("정방향 한 장");
    expect(prompt).toContain("안티-클리셰");
    expect(prompt).toContain("정조준");
  });

  it("단일 역방향 — 역방향 전용 결 문구가 나온다", () => {
    const prompt = buildInterpretationPromptV2_4(baseMarket(), [card("the-tower", "탑", "reversed")]);
    expect(prompt).toContain("역방향 한 장");
    expect(prompt).not.toContain("정방향 한 장");
  });

  it("3장 모두 정방향 — 정렬된 결, 슬롯 스토리텔링은 그대로 유지", () => {
    const cards = [
      card("the-tower", "탑", "upright"),
      card("the-star", "별", "upright"),
      card("the-sun", "태양", "upright"),
    ];
    const prompt = buildInterpretationPromptV2_4(baseMarket(), cards);
    expect(prompt).toContain("모두 정방향");
    expect(prompt).toContain("3장 스프레드 스토리텔링 (v2.3)");
  });

  it("3장 정·역 혼합 — 엇갈림 긴장 문구", () => {
    const cards = [
      card("the-tower", "탑", "upright"),
      card("the-star", "별", "reversed"),
      card("the-sun", "태양", "upright"),
    ];
    const prompt = buildInterpretationPromptV2_4(baseMarket(), cards);
    expect(prompt).toContain("섞인 패");
    expect(prompt).toContain("엇갈리는");
  });

  it("3장 모두 역방향 — 내면 저항의 결", () => {
    const cards = [
      card("the-tower", "탑", "reversed"),
      card("the-star", "별", "reversed"),
      card("the-sun", "태양", "reversed"),
    ];
    const prompt = buildInterpretationPromptV2_4(baseMarket(), cards);
    expect(prompt).toContain("모두 역방향");
  });

  it("패의 결은 v2.3 출력에 덧대어진다 (재무·슬롯 컨텍스트 보존)", () => {
    const market = baseMarket();
    market.fiftyTwoWeekPosition = 0.8;
    const ctx: FinancialContext = { debtToEquity: 250, currentRatio: 0.8 };
    const cards = [
      card("the-tower", "탑", "upright"),
      card("the-star", "별", "upright"),
      card("the-sun", "태양", "upright"),
    ];
    const v24 = buildInterpretationPromptV2_4(market, cards, ctx);
    const v23 = buildInterpretationPromptV2_3(market, cards, ctx);
    expect(v24.length).toBeGreaterThan(v23.length);
    expect(v24).toContain("미래 슬롯");
    expect(v24).toContain("높은 부채가 앞날의 변동성을 키우는 요소");
  });

  it("품질 레이어는 원시 수치를 노출하지 않는다", () => {
    const market = baseMarket();
    market.fiftyTwoWeekPosition = 0.8;
    const ctx: FinancialContext = { debtToEquity: 250 };
    const prompt = buildInterpretationPromptV2_4(market, [card("the-tower", "탑", "reversed")], ctx);
    expect(prompt).not.toContain("0.8");
    expect(prompt).not.toContain("250");
  });
});
