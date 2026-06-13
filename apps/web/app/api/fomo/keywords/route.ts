import { NextResponse } from "next/server";
import {
  extractKeywords,
  mergeCommunityEngagement,
  scoreKeywords,
  buildKeywordCards,
  overallConfidence,
  fetchCommunity,
  communityEngagementByTheme,
  MOCK_KEYWORD_CARDS,
  type KeywordCard,
  type KeywordConfidence,
  type KeywordSourceItem,
  type ScoredKeyword,
  type CommunitySourceSignal,
} from "@fomo/core";
import { withCors, kstDate } from "../../../../lib/fomo";
import { fetchAllNews } from "../../../../lib/fomo-news-sources";

/**
 * 키워드 카드 API — "오늘 사람들 시선이 가장 쏠린 키워드" 실데이터 산출. KEYWORD_ENGINE_SPEC §4.6 / Phase 2.
 *
 * 파이프라인: 뉴스 RSS + 커뮤니티(Promise.allSettled 병렬) → extract → community 가산 → score → 룰 폴백 코멘트.
 * 코멘트는 Phase 2 라 LLM 없이 룰 폴백 템플릿만(LLM 은 Phase 3).
 *
 * 응답 정직성(§5): confidence 를 반드시 동봉. 30일 기준선이 아직 없어 라이브는 'low'(가짜 high 금지).
 * 라이브 산출이 키워드 0건이면 mock 을 *명시적 폴백*(confidence:"fallback")으로 반환 — 진짜처럼 위장하지 않는다.
 *
 * 스냅샷-우선(§4.6 1단계: 오늘 스냅샷 있으면 그대로)은 Phase 4(cron + DDL 승인)에서 이 앞에 붙는다.
 * 지금은 스냅샷 테이블에 의존하지 않고 라이브 산출을 메인 경로로 둔다(prisma db push 미실행).
 */
export const dynamic = "force-dynamic";
// 외부 소스(뉴스 RSS·커뮤니티 HTML) 수집이 수초 걸릴 수 있어 데드라인 넉넉히.
export const maxDuration = 30;

export function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

interface KeywordsPayload {
  date: string;
  cards: readonly KeywordCard[];
  confidence: KeywordConfidence;
  live: boolean;
}

/**
 * [임시 debug — ?debug=1 일 때만 노출] 키워드별 내부 신호 + 새 공식(wa 0.500) 프리뷰.
 * 프로덕션 응답엔 절대 안 들어간다(공식 확정 전 진짜 입력값 관찰용). 공식 확정 후 제거 예정.
 *
 * 현재 점수(currentScore)는 Phase 1/2 공식((c)tone·(d)community 만, volume null).
 * newScorePreview 는 *제안 공식* 대입값일 뿐 — 아직 cards 의 fomoScore 엔 반영 안 됨.
 */
interface KeywordDebug {
  keyword: string;
  currentScore: number;
  mention: number;
  /** 새 (a)volume 후보 = mention / 당일 max mention. */
  volRel: number;
  /** (c)tone 0~1 (현재 산출에 쓰이는 실제값). */
  tone: number;
  /** 현재 (d) = engagement(upvote+댓글)/max — 단위 깨진 값(참고). */
  communityCurrent: number;
  /** 커뮤니티 원값: 참여(upvote+댓글) 합 / 글 수(option F 입력). */
  communityEngRaw: number;
  communityPosts: number;
  /** 새 (d) option F 후보 = postCount / 당일 max postCount. */
  commRelF: number;
  /** 제안 공식(wa .500 / wc .286 / wd .214) 대입 프리뷰. */
  newScorePreview: number;
}

interface CachedPayload extends KeywordsPayload {
  debug?: KeywordDebug[];
}

/** 제안 공식 프리뷰 산출(읽기 전용 — cards 점수엔 영향 없음). */
function buildDebug(
  scored: readonly ScoredKeyword[],
  signals: readonly CommunitySourceSignal[],
): KeywordDebug[] {
  const byTheme = communityEngagementByTheme(signals);
  const maxMention = Math.max(1, ...scored.map((s) => s.mentions));
  const maxPosts = Math.max(0, ...scored.map((s) => byTheme.get(s.keyword)?.postCount ?? 0));
  const anyCommunity = maxPosts > 0;
  // b(accel) null → {a,c,d} 재정규화. 커뮤니티 전무한 날은 d 빼고 {a,c} 로.
  const W = anyCommunity
    ? { a: 0.5, c: 0.286, d: 0.214 }
    : { a: 0.35 / 0.55, c: 0.2 / 0.55, d: 0 };
  return scored.map((s) => {
    const posts = byTheme.get(s.keyword)?.postCount ?? 0;
    const engRaw = byTheme.get(s.keyword)?.engagement ?? 0;
    const volRel = s.mentions / maxMention;
    const commRelF = anyCommunity ? posts / maxPosts : 0;
    const preview = Math.round(100 * (W.a * volRel + W.c * s.signals.tone + W.d * commRelF));
    return {
      keyword: s.keyword,
      currentScore: s.fomoScore,
      mention: s.mentions,
      volRel: Number(volRel.toFixed(3)),
      tone: Number(s.signals.tone.toFixed(3)),
      communityCurrent: Number(s.signals.community.toFixed(3)),
      communityEngRaw: engRaw,
      communityPosts: posts,
      commRelF: Number(commRelF.toFixed(3)),
      newScorePreview: preview,
    };
  });
}

// ── 라이브 결과 메모리 캐시(TTL) + in-flight dedup ──────────────────────────
// snapshot-first 정신(§4.6): 한 사용자의 새로고침/동시 접속이 외부 소스를 반복 폭격하지 않게,
// 라이브 산출 결과를 서버 인스턴스 단위로 짧게 캐시하고 동시 요청은 진행 중 Promise 를 공유한다.
// (Phase 4 의 일일 DB 스냅샷이 들어오면 이 메모리 캐시는 백업 역할로 내려간다.)
const TTL_MS = 30 * 60 * 1000;
let cache: { at: number; payload: CachedPayload } | null = null;
let inflight: Promise<CachedPayload> | null = null;

/** 뉴스/커뮤니티 실수집 → 키워드 카드 산출. 실패해도 throw 없이 mock 폴백을 돌려준다. */
async function computeLive(date: string): Promise<CachedPayload> {
  const [newsResult, communityResult] = await Promise.allSettled([fetchAllNews(), fetchCommunity()]);

  const items: KeywordSourceItem[] = [];
  if (newsResult.status === "fulfilled") {
    for (const a of newsResult.value) {
      items.push({
        title: a.title,
        ...(a.summary ? { summary: a.summary } : {}),
        publishedAt: a.publishedAt,
        source: a.source,
        lang: a.lang,
      });
    }
  } else {
    console.warn("[fomo/keywords] news error", newsResult.reason);
  }

  const communitySignals =
    communityResult.status === "fulfilled" ? communityResult.value.sources : [];
  if (communityResult.status === "rejected") {
    console.warn("[fomo/keywords] community error", communityResult.reason);
  }

  // 뉴스 추출 → 커뮤니티 참여도 가산(뉴스로 확인된 테마에만, §4.3 보수적) → 점수.
  const extracted = mergeCommunityEngagement(extractKeywords(items), communitySignals);
  const scored = scoreKeywords(extracted, { nowMs: Date.now() });
  const cards = buildKeywordCards(scored);

  // 키워드 0건 = 보여줄 게 없음 → mock 명시적 폴백(가짜 점수 강제 생성 금지, §5).
  if (cards.length === 0) {
    return { date, cards: MOCK_KEYWORD_CARDS, confidence: "fallback", live: true, debug: [] };
  }
  return {
    date,
    cards,
    confidence: overallConfidence(scored),
    live: true,
    debug: buildDebug(scored, communitySignals),
  };
}

/** TTL 캐시 + dedup 래퍼. */
async function getPayload(date: string): Promise<CachedPayload> {
  if (cache && Date.now() - cache.at < TTL_MS && cache.payload.date === date) {
    return cache.payload;
  }
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const payload = await computeLive(date);
      cache = { at: Date.now(), payload };
      return payload;
    } catch (err) {
      // 라이브 경로 자체가 깨져도 빈 화면 금지 — mock 명시적 폴백.
      console.warn("[fomo/keywords] live compute failed — mock fallback", err);
      return { date, cards: MOCK_KEYWORD_CARDS, confidence: "fallback" as const, live: false, debug: [] };
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export async function GET(request: Request) {
  const date = kstDate();
  const full = await getPayload(date);
  // ?debug=1 일 때만 내부 신호 노출(공식 확정용). 없으면 프로덕션 응답 그대로(debug 제거).
  const debug = new URL(request.url).searchParams.get("debug") === "1";
  const { debug: dbg, ...payload } = full;
  const body = debug ? { ...payload, debug: dbg ?? [] } : payload;
  return withCors(
    NextResponse.json(body, {
      // debug 응답은 캐시 안 함(관찰용). 일반 응답만 엣지 캐시.
      headers: debug
        ? { "Cache-Control": "no-store" }
        : { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200" },
    })
  );
}
