import { describe, it, expect } from "vitest";
import { buildInterpretationPromptV2_3 } from "../prompts/interpret-v2.3.0.js";
import { buildInterpretationPromptV2_2, type FinancialContext } from "../prompts/interpret-v2.2.0.js";
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

function card(id: string, nameKo: string): DrawnCard {
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
    orientation: "upright",
  };
}

function threeCards(): DrawnCard[] {
  return [card("the-tower", "탑"), card("the-star", "별"), card("the-sun", "태양")];
}

describe("interpret-v2.3.0 — THREE_CARD 슬롯 매핑 + 리스크/회복력 통합", () => {
  it("단일 카드는 v2.2.0과 완전히 동일한 출력 (강화 미적용)", () => {
    const market = baseMarket();
    const ctx: FinancialContext = { debtToEquity: 50, returnOnEquity: 0.18 };
    const v23 = buildInterpretationPromptV2_3(market, [card("the-tower", "탑")], ctx);
    const v22 = buildInterpretationPromptV2_2(market, [card("the-tower", "탑")], ctx);
    expect(v23).toBe(v22);
  });

  it("3장 스프레드 — 슬롯별 심리 지형 섹션이 삽입된다", () => {
    const market = baseMarket();
    market.fiftyTwoWeekPosition = 0.8;
    market.rsi = 72;
    const prompt = buildInterpretationPromptV2_3(market, threeCards());
    expect(prompt).toContain("3장 스프레드 — 슬롯별 심리 지형");
    expect(prompt).toContain("과거 슬롯");
    expect(prompt).toContain("현재 슬롯");
  });

  it("3장 스프레드 — 강화된 스토리텔링 규칙과 detail 길이가 적용된다", () => {
    const market = baseMarket();
    market.fiftyTwoWeekPosition = 0.5;
    const prompt = buildInterpretationPromptV2_3(market, threeCards());
    expect(prompt).toContain("3장 스프레드 스토리텔링 (v2.3)");
    expect(prompt).toContain("감정 아크");
    expect(prompt).toContain("500-700자");
  });

  // 샘플 1: 고부채·저유동성 종목 → 리스크 심리
  it("미래 슬롯 — 높은 부채 + 낮은 유동비율이면 리스크 신호", () => {
    const market = baseMarket();
    market.support20 = 180;
    market.resistance20 = 220;
    const ctx: FinancialContext = { debtToEquity: 250, currentRatio: 0.8 };
    const prompt = buildInterpretationPromptV2_3(market, threeCards(), ctx);
    expect(prompt).toContain("미래 슬롯");
    expect(prompt).toContain("높은 부채가 앞날의 변동성을 키우는 요소");
    expect(prompt).toContain("외부 충격에 흔들리기 쉬운 앞날");
  });

  // 샘플 2: 저부채·고유동성·고ROE 종목 → 회복력 심리
  it("미래 슬롯 — 탄탄한 재무 + 높은 유동비율이면 회복력 신호", () => {
    const market = baseMarket();
    const ctx: FinancialContext = { debtToEquity: 20, currentRatio: 2.5, returnOnEquity: 0.2, freeCashflow: 1000 };
    const prompt = buildInterpretationPromptV2_3(market, threeCards(), ctx);
    expect(prompt).toContain("탄탄한 재무 구조가 앞날의 여유를 만들어줍니다");
    expect(prompt).toContain("갑작스러운 충격도 흡수하는 회복력");
    expect(prompt).toContain("역경 뒤 회복력이 있는 구조");
  });

  it("유동비율 중간값(1~2)은 슬롯 신호를 만들지 않는다 (과잉 노출 방지)", () => {
    const market = baseMarket();
    const ctx: FinancialContext = { currentRatio: 1.5 };
    const prompt = buildInterpretationPromptV2_3(market, threeCards(), ctx);
    expect(prompt).not.toContain("갑작스러운 충격도 흡수하는 회복력");
    expect(prompt).not.toContain("외부 충격에 흔들리기 쉬운 앞날");
  });

  it("재무 컨텍스트가 없어도 3장 스프레드는 정상 생성 (하위 호환)", () => {
    const market = baseMarket();
    const prompt = buildInterpretationPromptV2_3(market, threeCards());
    expect(prompt).toContain("탑");
    expect(prompt).toContain("3장 스프레드 스토리텔링 (v2.3)");
    expect(prompt.length).toBeGreaterThan(500);
  });

  it("슬롯 매핑은 원시 수치를 노출하지 않는다", () => {
    const market = baseMarket();
    market.fiftyTwoWeekPosition = 0.8;
    const ctx: FinancialContext = { debtToEquity: 250, currentRatio: 0.8 };
    const prompt = buildInterpretationPromptV2_3(market, threeCards(), ctx);
    expect(prompt).not.toContain("0.8");
    expect(prompt).not.toContain("250");
  });
});
