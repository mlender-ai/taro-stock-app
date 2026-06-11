import { yahooChange, twelveDataChange, type MacroQuote, type WhaleInput } from "@fomo/core";

/**
 * FOMO 시장 데이터 수집 공용부 — banner(롤링 배너)와 feed(감정 치환 피드)가 공유한다.
 * 원래 banner 라우트에 있던 것을 추출(#PIVOT Phase 3). 동작 동일.
 *
 * - macro: 1차 Twelve Data(키 있을 때 batch 1콜) → 누락분만 Yahoo chart 폴백(순차).
 * - whale: CoinGecko global + top10 markets.
 * 정직한 숫자 원칙: 실측값만, 결측은 생략.
 */

const YAHOO_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
// 호스트 2개 폴백 — 한쪽이 스로틀(429/빈응답)이면 다른 쪽 시도.
const YAHOO_HOSTS = ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"];

// symbol: Yahoo chart 심볼(폴백). td: Twelve Data `/quote` 심볼(1차 소스).
export const INDICES: { key: MacroQuote["key"]; label: string; symbol: string; td: string }[] = [
  { key: "kospi", label: "코스피", symbol: "^KS11", td: "KS11" },
  { key: "kosdaq", label: "코스닥", symbol: "^KQ11", td: "KQ11" },
  { key: "spx", label: "S&P500", symbol: "^GSPC", td: "GSPC" },
  { key: "ndq", label: "나스닥", symbol: "^IXIC", td: "IXIC" },
  { key: "sox", label: "필라델피아 반도체", symbol: "^SOX", td: "SOX" },
];

/** 한 심볼의 일봉 종가 배열. query1→query2 폴백. 실패 시 null. */
async function fetchIndexCloses(symbol: string): Promise<(number | null)[] | null> {
  for (const host of YAHOO_HOSTS) {
    try {
      const url = `${host}/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`;
      // no-store: 스로틀/빈 응답을 데이터 캐시에 박지 않는다. 레이트리밋 보호는 라우트 s-maxage.
      const res = await fetch(url, {
        headers: { accept: "application/json", "user-agent": YAHOO_UA },
        signal: AbortSignal.timeout(8_000),
        cache: "no-store",
      });
      if (!res.ok) continue;
      const payload = (await res.json()) as {
        chart?: { result?: { indicators?: { quote?: { close?: (number | null)[] }[] } }[] };
      };
      const closes = payload.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
      if (closes && closes.length > 0) return closes;
    } catch {
      // 다음 호스트로
    }
  }
  return null;
}

/**
 * Twelve Data `/quote` batch — 5개 지수를 1콜에(무료 800req/day). 키 없으면 빈 맵.
 */
async function fetchMacroTwelveData(): Promise<
  Map<MacroQuote["key"], { change: number; close: number }>
> {
  const out = new Map<MacroQuote["key"], { change: number; close: number }>();
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return out;
  try {
    const symbols = INDICES.map((s) => s.td).join(",");
    const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbols)}&apikey=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8_000),
      // 5분 데이터 캐시 — 무료 일일쿼터·레이트리밋 보호.
      next: { revalidate: 300 },
    });
    if (!res.ok) return out;
    const payload = (await res.json()) as Record<string, unknown> & { status?: string };
    // batch(>1심볼)는 심볼 키 객체, 단일은 quote 객체 자체.
    const pick = (td: string): Parameters<typeof twelveDataChange>[0] => {
      const byKey = (payload as Record<string, unknown>)[td];
      if (byKey && typeof byKey === "object") return byKey as Parameters<typeof twelveDataChange>[0];
      if (INDICES.length === 1) return payload as Parameters<typeof twelveDataChange>[0];
      return null;
    };
    for (const s of INDICES) {
      const parsed = twelveDataChange(pick(s.td));
      if (parsed) out.set(s.key, parsed);
    }
  } catch (err) {
    console.warn("[fomo/sources] twelvedata error", err);
  }
  return out;
}

/**
 * 거시 지수 변화율 수집. Yahoo 는 순차 요청(동시 burst 스로틀 회피).
 */
export async function fetchMacro(): Promise<MacroQuote[]> {
  const td = await fetchMacroTwelveData();
  const quotes: MacroQuote[] = [];
  for (const s of INDICES) {
    const hit = td.get(s.key);
    if (hit) {
      quotes.push({ ...s, change: hit.change, close: hit.close });
      continue;
    }
    // Twelve Data 누락(키 없음 포함) → Yahoo 폴백.
    const closes = await fetchIndexCloses(s.symbol);
    const parsed = closes ? yahooChange(closes) : null;
    if (parsed) quotes.push({ ...s, change: parsed.change, close: parsed.close });
    else console.warn(`[fomo/sources] macro miss ${s.symbol} (td+yahoo)`);
  }
  return quotes;
}

/** CoinGecko 시장 신호. */
export async function fetchWhale(): Promise<WhaleInput> {
  try {
    const [globalRes, marketsRes] = await Promise.allSettled([
      fetch("https://api.coingecko.com/api/v3/global", { next: { revalidate: 300 } }),
      fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&price_change_percentage=24h",
        { next: { revalidate: 300 } }
      ),
    ]);

    let marketCapChange24h: number | null = null;
    if (globalRes.status === "fulfilled" && globalRes.value.ok) {
      const g = (await globalRes.value.json()) as {
        data?: { market_cap_change_percentage_24h_usd?: number };
      };
      const mc = g.data?.market_cap_change_percentage_24h_usd;
      if (typeof mc === "number") marketCapChange24h = mc;
    }

    let coins: WhaleInput["coins"] = [];
    if (marketsRes.status === "fulfilled" && marketsRes.value.ok) {
      const raw = (await marketsRes.value.json()) as {
        name: string;
        symbol: string;
        price_change_percentage_24h: number | null;
        ath_change_percentage: number | null;
      }[];
      coins = raw.map((c) => ({
        name: c.name,
        symbol: c.symbol,
        change24h: c.price_change_percentage_24h,
        athChange: c.ath_change_percentage,
      }));
    }
    return { marketCapChange24h, coins };
  } catch (err) {
    console.warn("[fomo/sources] coingecko error", err);
    return { marketCapChange24h: null, coins: [] };
  }
}
