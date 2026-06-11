import { NextResponse } from "next/server";
import { buildNewsFeed, localizeFeed, type NewsLang } from "@fomo/core";
import { withCors } from "../../../../lib/fomo";
import { fetchAllNews } from "../../../../lib/fomo-news-sources";

// FOMO 뉴스 피드 — 실제 기사를 FOMO 점수순으로. docs/PIVOT_FEED_FIRST.md.
// 사실 헤드라인 그대로 + 점수만 산출(감정 치환 아님). 점수/정렬은 @fomo/core/news-feed 순수부.
// 언어: 지금은 영문 그대로(lang=en). ?lang=ko 면 번역(titleKo) 있는 기사부터 한국어 표기 —
// 번역 파이프라인 붙기 전까진 영문 폴백(확장 seam).
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(req: Request) {
  const lang: NewsLang = new URL(req.url).searchParams.get("lang") === "ko" ? "ko" : "en";

  const raw = await fetchAllNews();
  const feed = localizeFeed(buildNewsFeed(raw, { nowMs: Date.now(), limit: 40 }), lang);

  return withCors(
    NextResponse.json(
      { articles: feed, lang },
      // 엣지 캐시 — 외부 RSS 레이트리밋 보호(배너와 동일 정책).
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    )
  );
}
