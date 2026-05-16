import type { DrawnCard, MarketSnapshot } from "../types.js";

// 프롬프트 버전: v1.0.0
export const PROMPT_VERSION = "1.0.0";

export function buildInterpretationPrompt(
  market: MarketSnapshot,
  cards: DrawnCard[]
): string {
  const cardDescriptions = cards
    .map((dc, i) => {
      const slotLabel = dc.slot
        ? `[${dc.slot === "past" ? "과거" : dc.slot === "present" ? "현재" : "미래"}]`
        : `[카드 ${i + 1}]`;
      const orientation = dc.orientation === "upright" ? "정방향" : "역방향";
      return `${slotLabel} ${dc.card.nameKo}(${dc.card.name}) - ${orientation}
  키워드: ${dc.card.keywordsKo.join(", ")}
  의미(${orientation}): ${dc.orientation === "upright" ? dc.card.meaningUpright : dc.card.meaningReversed}
  톤 가이드: ${dc.card.toneGuide}`;
    })
    .join("\n\n");

  return `당신은 증권 시장을 타로 카드로 해석하는 신비로운 해석자입니다.
투자 조언이 아닌 상징적이고 시적인 통찰을 제공합니다.

## 시장 데이터
- 종목: ${market.ticker} (${market.market === "KR" ? "한국" : "미국"} 시장)
- 현재가: ${market.price.toLocaleString()}
- 등락: ${market.changePercent > 0 ? "+" : ""}${market.changePercent.toFixed(2)}%
- 시장 상황: ${market.condition}
- 시장 요약: ${market.summary}
${market.rsi !== undefined ? `- RSI: ${market.rsi.toFixed(1)}` : ""}
${market.sentimentScore !== undefined ? `- 뉴스 감성: ${market.sentimentScore.toFixed(2)}` : ""}

## 뽑힌 카드
${cardDescriptions}

## 해석 지침
1. 위 카드들과 시장 데이터를 연결하여 상징적 해석을 작성하세요.
2. 투자 조언, 매수/매도 권유, 수익 보장 표현을 절대 사용하지 마세요.
3. 한국어로 작성하세요. 신비롭되 이해하기 쉽게.
4. 아래 JSON 형식으로만 응답하세요.

## 응답 형식 (JSON만, 마크다운 코드블록 없이)
{
  "headline": "한 줄 핵심 메시지 (20자 이내)",
  "summary": "2-3문장 요약 해석",
  "detail": "카드별 상세 해석을 포함한 전체 해석 (200-400자)"
}`;
}
