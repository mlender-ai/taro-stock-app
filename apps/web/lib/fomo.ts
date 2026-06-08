import { NextResponse } from "next/server";
import {
  EMOTION_TYPES,
  type EmotionType,
  type EmotionTally,
  computeFomoIndex,
  scoreToColor,
  scoreToDescription,
  type FomoIndex,
  type WhaleEvent,
  // @author 안티그래비티 — 1-A: Reddit 커뮤니티 시그널 수집
  fetchRedditSignals,
} from "@fomo/core";
import { prisma } from "./prisma";
import { createLogger } from "./logger";

const log = createLogger("fomo");

/** Asia/Seoul 기준 YYYY-MM-DD. 파이프라인(scripts/fomo-index-pipeline.ts)과 동일 기준. */
export function kstDate(offsetDays = 0): string {
  const now = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(now);
}

export function isEmotionType(v: unknown): v is EmotionType {
  return typeof v === "string" && (EMOTION_TYPES as readonly string[]).includes(v);
}

/** 당일 감정 투표 집계 → {tally, total}. */
export async function todayTally(date = kstDate()): Promise<{ tally: EmotionTally; total: number }> {
  const rows = await prisma.emotionVote.groupBy({
    by: ["emotion"],
    where: { votedDate: date },
    _count: { _all: true },
  });
  const tally: EmotionTally = {};
  let total = 0;
  for (const r of rows) {
    if (isEmotionType(r.emotion)) {
      tally[r.emotion] = r._count._all;
      total += r._count._all;
    }
  }
  return { tally, total };
}

interface CoinGeckoGlobal {
  data?: { market_cap_change_percentage_24h_usd?: number };
}
interface CoinGeckoMarket {
  symbol: string;
  price_change_percentage_24h: number | null;
  ath_change_percentage: number | null;
}

/**
 * CoinGecko 무료 API를 통해 Whale Heat 이벤트 목록 산출.
 * 암호화폐 시총 변화·BTC 전고점 근접도·BTC 24h 등락을 `WhaleEvent[]`로 변환.
 * 외부 API 실패 시 빈 배열 반환 → whaleHeat 폴백(0)으로 안전하게 처리. (#394)
 */
export async function fetchWhaleHeatData(): Promise<WhaleEvent[]> {
  try {
    const [globalRes, marketsRes] = await Promise.allSettled([
      fetch("https://api.coingecko.com/api/v3/global", { next: { revalidate: 300 } }),
      fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&price_change_percentage=24h",
        { next: { revalidate: 300 } }
      ),
    ]);

    const events: WhaleEvent[] = [];

    if (globalRes.status === "fulfilled" && globalRes.value.ok) {
      const g = (await globalRes.value.json()) as CoinGeckoGlobal;
      const mc = g.data?.market_cap_change_percentage_24h_usd;
      if (typeof mc === "number") {
        if (mc > 5)       events.push({ weight: 3, label: `암호화폐 시총 +${mc.toFixed(1)}%` });
        else if (mc > 2)  events.push({ weight: 1, label: `암호화폐 시총 +${mc.toFixed(1)}%` });
        else if (mc < -5) events.push({ weight: 2, label: `암호화폐 시총 ${mc.toFixed(1)}%` });
      }
    }

    if (marketsRes.status === "fulfilled" && marketsRes.value.ok) {
      const coins = (await marketsRes.value.json()) as CoinGeckoMarket[];
      const btc = coins.find((c) => c.symbol?.toLowerCase() === "btc");
      if (btc) {
        // BTC 전고점 5% 이내 → 고래 활동 신호 (weight 4 = whale max의 40%)
        if (typeof btc.ath_change_percentage === "number" && btc.ath_change_percentage > -5) {
          events.push({ weight: 4, label: `BTC 전고점 근접 (${btc.ath_change_percentage.toFixed(1)}%)` });
        }
        if (typeof btc.price_change_percentage_24h === "number" && btc.price_change_percentage_24h > 5) {
          events.push({ weight: 2, label: `BTC 24h +${btc.price_change_percentage_24h.toFixed(1)}%` });
        }
      }
    }

    log.debug("whale events derived from CoinGecko", { count: events.length });
    return events;
  } catch (err) {
    log.warn("fetchWhaleHeatData failed — whale heat will be 0", {
      err: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

/**
 * 스냅샷 미존재 시 라이브 계산.
 *
 * @author 안티그래비티
 * - 1-A: Reddit 커뮤니티 시그널을 병렬 수집하여 Community Heat에 반영
 * - 1-B: 각 Heat 컴포넌트의 confidence 메타를 로그에 기록 (정직한 숫자 원칙)
 * - 추가: Whale Heat를 CoinGecko 무료 API 기반으로 병렬 산출 (#394, #398)
 *
 * 모든 외부 데이터 소스 실패 시에도 중립 폴백으로 안전하게 반환한다.
 */
export async function computeLiveFomoIndex(date: string): Promise<FomoIndex> {
  // 3개 소스 병렬 페치: 감정 투표 + Reddit 시그널 + Whale 이벤트 (#398 병렬화)
  const [tallyResult, redditResult, whaleResult] = await Promise.allSettled([
    todayTally(date),
    fetchRedditSignals(),
    fetchWhaleHeatData(),
  ]);

  // 감정 투표
  let tally: EmotionTally = {};
  if (tallyResult.status === "fulfilled") {
    tally = tallyResult.value.tally;
    if (tallyResult.value.total === 0) {
      log.debug("emotion tally empty — using fallback neutral", { date });
    }
  } else {
    log.warn("emotion tally fetch failed — fallback to empty tally", {
      date,
      err: tallyResult.reason instanceof Error ? tallyResult.reason.message : String(tallyResult.reason),
    });
  }

  // Reddit 커뮤니티 시그널 (1-A)
  let reddit: import("@fomo/core").RedditSignal[] = [];
  if (redditResult.status === "fulfilled") {
    reddit = redditResult.value;
    log.debug("reddit signals fetched", {
      date,
      count: reddit.length,
      subreddits: reddit.map((r) => r.subreddit),
    });
  } else {
    log.warn("reddit signals fetch failed — community heat will use fallback", {
      date,
      err: redditResult.reason instanceof Error ? redditResult.reason.message : String(redditResult.reason),
    });
  }

  // Whale 이벤트 (#394)
  let whale: WhaleEvent[] = [];
  if (whaleResult.status === "fulfilled") {
    whale = whaleResult.value;
    log.debug("whale events fetched", { date, count: whale.length });
  } else {
    log.warn("whale heat fetch failed — whale heat will be 0", {
      date,
      err: whaleResult.reason instanceof Error ? whaleResult.reason.message : String(whaleResult.reason),
    });
  }

  const inputs: import("@fomo/core").FomoIndexInputs = { emotion: tally };
  if (reddit.length > 0) inputs.community = { reddit };
  if (whale.length > 0) inputs.whale = whale;

  const idx = computeFomoIndex(inputs, date);

  // 1-B: 각 Heat 컴포넌트 신뢰도 로깅
  for (const c of idx.components) {
    const confidence = c.meta?.confidence ?? "fallback";
    if (confidence === "fallback") {
      log.info("heat using fallback", {
        heat: c.key,
        score: c.score,
        confidence,
        date,
      });
    } else {
      log.debug("heat computed", {
        heat: c.key,
        score: c.score,
        confidence,
        sourcesAvailable: c.meta?.sourcesAvailable,
        sourcesTotal: c.meta?.sourcesTotal,
        date,
      });
    }
  }

  return idx;
}

/**
 * FOMO Index 응답 공통 직렬화 — zoneColor·zoneDescription 포함.
 *
 * @author 안티그래비티 — 1-B: confidence 메타데이터 추가
 */
export function serializeFomoIndex(
  idx: FomoIndex,
  extra: {
    aiSummary?: string;
    prevDayDelta?: number;
    avg30Delta?: number;
    live: boolean;
    fallback?: boolean;
  }
) {
  const comp = (k: string) => idx.components.find((c) => c.key === k)?.score ?? 0;
  const confidence = (k: string) => idx.components.find((c) => c.key === k)?.meta?.confidence ?? "fallback";
  return {
    date: idx.date,
    score: idx.score,
    state: idx.state,
    zoneColor: scoreToColor(idx.score),
    zoneDescription: scoreToDescription(idx.score),
    components: {
      market:    comp("market"),
      community: comp("community"),
      emotion:   comp("emotion"),
      whale:     comp("whale"),
    },
    /** @author 안티그래비티 — 1-B: 각 Heat 데이터 신뢰도 (정직한 숫자 원칙) */
    confidence: {
      market:    confidence("market"),
      community: confidence("community"),
      emotion:   confidence("emotion"),
      whale:     confidence("whale"),
    },
    aiSummary:    extra.aiSummary    ?? "",
    prevDayDelta: extra.prevDayDelta ?? 0,
    avg30Delta:   extra.avg30Delta   ?? 0,
    live: extra.live,
    ...(extra.fallback ? { fallback: true } : {}),
  };
}

/** 무가입 웹 교차 출처 허용 — 익명 공개 데이터. CORS 헤더를 응답에 부착. */
export function withCors(res: NextResponse): NextResponse {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}

export function corsJson(body: unknown, init?: ResponseInit): NextResponse {
  return withCors(NextResponse.json(body, init));
}
