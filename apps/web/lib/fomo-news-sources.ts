import { parseYahooRss, type NewsSource, type RawArticle } from "@fomo/core";

/**
 * FOMO 뉴스 소스 — 실제 기사 수집. docs/PIVOT_FEED_FIRST.md.
 *
 * 지금은 Yahoo Finance RSS(영문) 1개. 한국어 소스(네이버 금융/연합 RSS 등)는
 * NewsSource 인터페이스를 구현해 SOURCES 배열에 추가하면 같은 파이프라인에 합류한다.
 * 파싱/점수/정렬은 @fomo/core/news-feed 순수부가 담당(테스트 보장).
 */

const YAHOO_RSS = "https://feeds.finance.yahoo.com/rss/2.0/headline";
const UA = "Mozilla/5.0 (compatible; FomoClubBot/1.0)";

// FOMO를 부르는 고관심 종목 — 국내 리테일이 자주 좇는 미국 대형 테크/코인 프록시.
// (한국어 소스 추가 전까지 영문 기사 유니버스. 종목은 운영 중 조정 가능.)
const SYMBOLS = ["NVDA", "TSLA", "AAPL", "AMD", "AVGO", "PLTR", "COIN", "MSTR"];

/** 한 심볼의 Yahoo RSS → RawArticle[]. 실패 시 빈 배열(부분 실패 허용). */
async function fetchYahooSymbol(symbol: string, nowIso: string): Promise<RawArticle[]> {
  try {
    const url = new URL(YAHOO_RSS);
    url.searchParams.set("s", symbol);
    url.searchParams.set("region", "US");
    url.searchParams.set("lang", "en-US");
    const res = await fetch(url.toString(), {
      headers: { "user-agent": UA, accept: "application/rss+xml, application/xml" },
      signal: AbortSignal.timeout(8_000),
      // 10분 데이터 캐시 — Yahoo 레이트리밋 보호.
      next: { revalidate: 600 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseYahooRss(xml, { symbol, nowIso, lang: "en" });
  } catch (err) {
    console.warn(`[fomo/news] yahoo ${symbol} error`, err);
    return [];
  }
}

/** Yahoo Finance 소스 — 심볼 유니버스를 병렬 수집해 합산. */
export const yahooSource: NewsSource = {
  id: "yahoo",
  lang: "en",
  enabled: true,
  async fetch() {
    const nowIso = new Date().toISOString();
    const settled = await Promise.allSettled(SYMBOLS.map((s) => fetchYahooSymbol(s, nowIso)));
    const out: RawArticle[] = [];
    for (const r of settled) if (r.status === "fulfilled") out.push(...r.value);
    return out;
  },
};

/**
 * 등록된 뉴스 소스 — 확장 지점.
 * 한국어 소스 추가 예) { id: "naver-finance", lang: "ko", enabled: true, fetch: ... }
 */
export const NEWS_SOURCES: readonly NewsSource[] = [yahooSource];

/** 모든 enabled 소스를 병렬 수집해 정규화 기사 배열로 합산. */
export async function fetchAllNews(): Promise<RawArticle[]> {
  const enabled = NEWS_SOURCES.filter((s) => s.enabled);
  const settled = await Promise.allSettled(enabled.map((s) => s.fetch()));
  const out: RawArticle[] = [];
  for (const r of settled) if (r.status === "fulfilled") out.push(...r.value);
  return out;
}
