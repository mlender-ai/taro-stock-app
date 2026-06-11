import { NextResponse } from "next/server";
import {
  buildFeedCards,
  feedCardsToMoodSignals,
  fetchCommunity,
  pct,
  type RawSignal,
} from "@fomo/core";
import { withCors } from "../../../../lib/fomo";
import { fetchMacro, fetchWhale } from "../../../../lib/fomo-market-sources";

// 감정 치환 피드 — 시장/커뮤니티 신호를 5개 감정 카드로. docs/PIVOT_FEED_FIRST.md Phase 3.
// 치환 로직은 @fomo/core/emotion-translation 순수 엔진(테스트 보장)이 담당하고,
// 이 라우트는 기존 소스(macro/whale/community)를 RawSignal 로 정규화해 공급만 한다.
// 신뢰도 미달 신호는 엔진이 버리고, 부족한 탭은 큐레이션(근거 "샘플")으로 채운다 — 빈 화면 금지.
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

/** 코인 ATH 물림 판정(%) — banner 의 buildWhaleItems와 같은 감각의 보수적 기준. */
const DEEP_UNDERWATER = -30;

export async function GET() {
  const [macroQuotes, whaleInput, communityResult] = await Promise.allSettled([
    fetchMacro(),
    fetchWhale(),
    fetchCommunity(),
  ]);

  const raws: RawSignal[] = [];

  if (macroQuotes.status === "fulfilled") {
    for (const q of macroQuotes.value) {
      if (typeof q.change !== "number") continue;
      raws.push({
        id: `macro-${q.key}`,
        source: "macro",
        label: q.label,
        changePct: q.change,
        value: pct(q.change),
      });
    }
  } else {
    console.warn("[fomo/feed] macro error", macroQuotes.reason);
  }

  if (whaleInput.status === "fulfilled") {
    const { marketCapChange24h, coins } = whaleInput.value;
    if (typeof marketCapChange24h === "number") {
      raws.push({
        id: "whale-marketcap",
        source: "whale",
        label: "암호화폐 시장",
        changePct: marketCapChange24h,
        value: pct(marketCapChange24h),
      });
    }
    for (const c of coins ?? []) {
      if (typeof c.change24h === "number") {
        raws.push({
          id: `whale-${c.symbol}`,
          source: "whale",
          label: c.name,
          changePct: c.change24h,
          value: pct(c.change24h),
        });
      }
      if (typeof c.athChange === "number" && c.athChange <= DEEP_UNDERWATER) {
        raws.push({
          id: `whale-${c.symbol}-ath`,
          source: "whale",
          label: c.name,
          athChangePct: c.athChange,
          value: pct(c.athChange),
        });
      }
    }
  } else {
    console.warn("[fomo/feed] whale error", whaleInput.reason);
  }

  if (communityResult.status === "fulfilled") {
    for (const s of communityResult.value.sources) {
      raws.push({
        id: `community-${s.source}`,
        source: "community",
        label: "커뮤니티",
        bullishRatio: s.bullishRatio,
        mentions: s.postCount,
      });
    }
  } else {
    console.warn("[fomo/feed] community error", communityResult.reason);
  }

  const cards = buildFeedCards(raws);
  const moods = feedCardsToMoodSignals(cards);

  // 엣지 캐시 — 외부 소스 레이트리밋 보호(배너와 동일 정책).
  return withCors(
    NextResponse.json(
      { cards, moods },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    )
  );
}
