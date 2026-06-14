import { NextResponse } from "next/server";
import type { KeywordCard, KeywordConfidence } from "@fomo/core";
import { withCors, kstDate } from "../../../../lib/fomo";
import { computeKeywordCards } from "../../../../lib/keyword-pipeline";
import { readKeywordSnapshot } from "../../../../lib/keyword-snapshot";

/**
 * 키워드 카드 API — "오늘 사람들 시선이 가장 쏠린 키워드" 실데이터 산출. KEYWORD_ENGINE_SPEC §4.6.
 *
 * 응답 경로(§4.6 — 절대 빈값 없음):
 *   1) 오늘 KeywordCardSnapshot 있으면 그대로 반환(live:false) — Phase 4 cron 이 미리 채운 것.
 *   2) 없으면(스냅샷 전/테이블 미생성) 라이브 산출(live:true). 산출·검증·코멘트는 computeKeywordCards 공유.
 *   3) 라이브도 실패하면 mock 명시적 폴백(confidence:"fallback").
 *
 * 응답 정직성(§5): confidence 를 반드시 동봉. 30일 기준선이 아직 없어 라이브는 'low'(가짜 high 금지).
 *
 * db push 게이트: KeywordCardSnapshot 테이블이 아직 prod 에 없을 수 있어, 스냅샷 조회는 실패해도
 *   조용히 라이브로 폴백한다(readKeywordSnapshot 내부 try/catch). 테이블이 생기면 1)이 자동 활성화.
 */
export const dynamic = "force-dynamic";
// 외부 소스(뉴스 RSS·커뮤니티 HTML) + LLM 코멘트가 수초 걸릴 수 있어 데드라인 넉넉히.
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

// ── 라이브 결과 메모리 캐시(TTL) + in-flight dedup ──────────────────────────
// snapshot-first 정신(§4.6): 한 사용자의 새로고침/동시 접속이 외부 소스를 반복 폭격하지 않게,
// 라이브 산출 결과를 서버 인스턴스 단위로 짧게 캐시하고 동시 요청은 진행 중 Promise 를 공유한다.
// (Phase 4 의 일일 DB 스냅샷이 메인이면 이 메모리 캐시는 스냅샷 미스 시 백업.)
const TTL_MS = 30 * 60 * 1000;
let cache: { at: number; payload: KeywordsPayload } | null = null;
let inflight: Promise<KeywordsPayload> | null = null;

/** 라이브 산출(공유 파이프라인). 실패해도 throw 없이 mock 폴백. */
async function computeLive(date: string): Promise<KeywordsPayload> {
  try {
    const { cards, confidence } = await computeKeywordCards();
    return { date, cards, confidence, live: true };
  } catch (err) {
    console.warn("[fomo/keywords] live compute failed — mock fallback", err);
    const { MOCK_KEYWORD_CARDS } = await import("@fomo/core");
    return { date, cards: MOCK_KEYWORD_CARDS, confidence: "fallback", live: false };
  }
}

/** 스냅샷-우선 → 캐시 → 라이브 dedup. */
async function getPayload(date: string): Promise<KeywordsPayload> {
  // 1) 오늘 스냅샷(테이블 없으면 null) — cron 이 채운 안정 데이터를 외부 호출 없이 즉시 반환.
  const snap = await readKeywordSnapshot(date);
  if (snap) return { date, cards: snap.cards, confidence: snap.confidence, live: false };

  // 2) 메모리 캐시.
  if (cache && Date.now() - cache.at < TTL_MS && cache.payload.date === date) {
    return cache.payload;
  }
  if (inflight) return inflight;

  // 3) 라이브 산출(dedup).
  inflight = (async () => {
    try {
      const payload = await computeLive(date);
      cache = { at: Date.now(), payload };
      return payload;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export async function GET() {
  const date = kstDate();
  const payload = await getPayload(date);
  return withCors(
    NextResponse.json(payload, {
      // 엣지 캐시 — 외부 소스 레이트리밋 보호(피드/배너와 동일 정책).
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200" },
    })
  );
}
