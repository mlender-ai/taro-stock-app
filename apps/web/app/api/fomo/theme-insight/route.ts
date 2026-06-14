import { NextResponse } from "next/server";
import { condenseThemeInsight, type CondensedInsight } from "@fomo/core";
import { withCors } from "../../../../lib/fomo";
import { understandTheme } from "../../../../lib/theme-understanding";

/**
 * 테마 이해·응축 API — DATA_ENGINE_STRATEGY Track A+B. 뎁스 페이지가 카드 탭 시 lazy 로 부른다.
 *
 * understandTheme(A: 원문 읽고 grounded 구조화) → condenseThemeInsight(B: 한 카드 분량 결정론적 응축).
 * 메인 피드(/api/fomo/keywords)는 안 건드린다 — 무겁기 때문(LLM+종토 fetch)에 *탭할 때만* 산출.
 *
 * 정직성: AI 미설정·원문 부족 → confidence:"insufficient"(가짜 응축 금지). 뎁스는 그때 기존 소스로 폴백.
 */
export const dynamic = "force-dynamic";
// 원문 수집 + LLM 이해가 수십 초 걸릴 수 있어 데드라인 넉넉히.
export const maxDuration = 60;

export function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

// 테마별 TTL 캐시 + in-flight dedup(같은 테마 동시 탭 → 외부 소스 반복 폭격 방지).
const TTL_MS = 30 * 60 * 1000;
const cache = new Map<string, { at: number; payload: CondensedInsight }>();
const inflight = new Map<string, Promise<CondensedInsight>>();

async function getInsight(theme: string): Promise<CondensedInsight> {
  const hit = cache.get(theme);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.payload;

  const running = inflight.get(theme);
  if (running) return running;

  const p = (async () => {
    const insight = await understandTheme(theme);
    const condensed = condenseThemeInsight(insight);
    cache.set(theme, { at: Date.now(), payload: condensed });
    return condensed;
  })().finally(() => inflight.delete(theme));

  inflight.set(theme, p);
  return p;
}

export async function GET(req: Request) {
  const theme = new URL(req.url).searchParams.get("theme")?.trim();
  if (!theme) {
    return withCors(NextResponse.json({ error: "theme required" }, { status: 400 }));
  }
  const payload = await getInsight(theme);
  return withCors(
    NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" },
    })
  );
}
