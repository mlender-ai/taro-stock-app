import type { DrawnCard, MarketSnapshot } from "../types.js";

// 프롬프트 버전: v1.1.0
export const PROMPT_VERSION_1_1 = "1.1.0";

function formatIndicators(market: MarketSnapshot): string {
  const lines: string[] = [];

  // 기본 시세
  lines.push(`- 현재가: ${market.price.toLocaleString()} (${market.changePercent > 0 ? "+" : ""}${market.changePercent.toFixed(2)}%)`);
  lines.push(`- 거래량: ${market.volume.toLocaleString()}`);

  // RSI
  if (market.rsi !== undefined) {
    const zone = market.rsi > 70 ? "과매수 구간" : market.rsi < 30 ? "과매도 구간" : "중립 구간";
    lines.push(`- RSI(14): ${market.rsi.toFixed(1)} → ${zone}`);
  }

  // MACD
  if (market.macd !== undefined && market.macdSignal !== undefined) {
    const cross = market.macd > market.macdSignal ? "골든크로스 (상승 신호)" : "데드크로스 (하락 신호)";
    lines.push(`- MACD: ${market.macd.toFixed(2)} / 시그널: ${market.macdSignal.toFixed(2)} → ${cross}`);
    if (market.macdHistogram !== undefined) {
      lines.push(`  히스토그램: ${market.macdHistogram > 0 ? "+" : ""}${market.macdHistogram.toFixed(2)}`);
    }
  }

  // 이동평균선
  const smaLines: string[] = [];
  if (market.sma20 !== undefined) smaLines.push(`20일: ${market.sma20.toFixed(0)}`);
  if (market.sma50 !== undefined) smaLines.push(`50일: ${market.sma50.toFixed(0)}`);
  if (market.sma200 !== undefined) smaLines.push(`200일: ${market.sma200.toFixed(0)}`);
  if (smaLines.length > 0) {
    lines.push(`- 이동평균선: ${smaLines.join(" / ")}`);
    if (market.sma20 !== undefined && market.sma200 !== undefined) {
      lines.push(`  ${market.sma20 > market.sma200 ? "장기 상승 배열" : "장기 하락 배열"}`);
    }
  }

  // 볼린저 밴드
  if (market.bbUpper !== undefined && market.bbLower !== undefined && market.bbMiddle !== undefined) {
    const pos = market.price > market.bbUpper ? "상단 돌파 (과열)"
      : market.price < market.bbLower ? "하단 이탈 (위축)"
      : "밴드 내 안정";
    lines.push(`- 볼린저밴드: 상단 ${market.bbUpper.toFixed(0)} / 중심 ${market.bbMiddle.toFixed(0)} / 하단 ${market.bbLower.toFixed(0)} → ${pos}`);
  }

  // 지지/저항선
  if (market.support20 !== undefined && market.resistance20 !== undefined) {
    lines.push(`- 20일 지지선: ${market.support20.toFixed(0)} / 저항선: ${market.resistance20.toFixed(0)}`);
  }

  // 뉴스 감성
  if (market.sentimentScore !== undefined) {
    const mood = market.sentimentScore > 0.3 ? "긍정적" : market.sentimentScore < -0.3 ? "부정적" : "중립";
    lines.push(`- 뉴스 감성: ${market.sentimentScore.toFixed(2)} (${mood})`);
  }

  return lines.join("\n");
}

function formatRecentNews(news: { title: string; source: string }[]): string {
  if (news.length === 0) return "";
  return news
    .slice(0, 3)
    .map((n, i) => `  ${i + 1}. "${n.title}" (${n.source})`)
    .join("\n");
}

function conditionToKo(condition: string): string {
  const map: Record<string, string> = {
    bullish: "상승 추세",
    bearish: "하락 추세",
    neutral: "횡보/중립",
    volatile: "높은 변동성",
    consolidating: "수렴/정리 구간",
  };
  return map[condition] ?? condition;
}

export function buildInterpretationPromptV1_1(
  market: MarketSnapshot,
  cards: DrawnCard[]
): string {
  const cardDescriptions = cards
    .map((dc, i) => {
      const slotLabel = dc.slot
        ? `[${dc.slot === "past" ? "과거/배경" : dc.slot === "present" ? "현재/핵심" : "미래/전망"}]`
        : `[카드 ${i + 1}]`;
      const orientation = dc.orientation === "upright" ? "정방향" : "역방향";
      return `${slotLabel} ${dc.card.nameKo}(${dc.card.name}) — ${orientation}
  핵심 키워드: ${dc.card.keywordsKo.join(", ")}
  해석 방향(${orientation}): ${dc.orientation === "upright" ? dc.card.meaningUpright : dc.card.meaningReversed}
  톤/분위기: ${dc.card.toneGuide}`;
    })
    .join("\n\n");

  const newsBlock = market.recentNews && market.recentNews.length > 0
    ? `\n### 최근 뉴스 헤드라인\n${formatRecentNews(market.recentNews)}\n`
    : "";

  return `## 역할
당신은 증권 시장의 에너지를 타로 카드로 해석하는 신비로운 해석자입니다.
기술적 지표의 숫자를 상징과 은유로 번역하되, 절대로 투자 조언을 하지 않습니다.

## 시장 데이터
종목: ${market.ticker} (${market.market === "KR" ? "한국" : "미국"} 시장)
시장 국면: ${conditionToKo(market.condition)}

### 기술적 지표
${formatIndicators(market)}

### 시장 요약
${market.summary}
${newsBlock}
## 뽑힌 카드
${cardDescriptions}

## 해석 규칙
1. **카드와 지표를 연결하라**: 각 카드의 상징이 기술적 지표와 어떻게 공명하는지 구체적으로 연결하세요.
   - 예: RSI 과매수 + 탑(The Tower) = "높이 쌓아올린 기세가 벼락을 부르고 있습니다"
   - 예: MACD 골든크로스 + 별(The Star) = "어둠을 지나 새로운 흐름이 빛나기 시작합니다"
   - 예: 볼린저밴드 하단 이탈 + 은둔자(The Hermit) = "시장이 깊은 침묵 속으로 걸어가는 시간"

2. **뉴스 헤드라인이 제공된 경우**: 최근 뉴스의 핵심 키워드나 감정 톤을 카드 해석에 자연스럽게 녹이세요.
   - 뉴스의 출처나 링크는 직접 인용하지 말 것 (상징 언어로 재해석)
   - 해석의 구체성을 높이되, 확정적 예측은 절대 금지

3. **금지 표현**: 아래 표현은 절대 사용 금지. 위반 시 응답 무효.
   - "매수", "매도", "사세요", "파세요", "수익률", "목표가"
   - "투자 추천", "강력 추천", "반드시 ~해야"
   - 확정적 예측: "반드시 오릅니다", "반드시 내립니다"

4. **한국어 품질 기준**:
   - 자연스러운 한국어 (번역체 금지)
   - 시적이고 상징적이되 이해하기 쉽게
   - headline은 호기심을 자극하는 한 줄 (15자 이내)
   - summary는 핵심 메시지 2-3문장
   - detail은 카드별 해석 + 종합 통찰 (300-500자)

5. **3장 스프레드인 경우**: 과거→현재→미래 흐름으로 서사를 구성하세요. 각 포지션에 맞는 뉴스 흐름(과거 배경→현재 상황→미래 전망)을 반영하세요.

## 응답 형식 (JSON만, 마크다운 코드블록 없이)
{
  "headline": "한 줄 핵심 (15자 이내)",
  "summary": "2-3문장 요약",
  "detail": "카드별 상세 해석 + 종합 (300-500자)"
}`;
}
