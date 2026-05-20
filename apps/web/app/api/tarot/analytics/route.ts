import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/tarot/prisma";
import { requireAuth } from "@/lib/tarot/auth";

export const dynamic = "force-dynamic";

// per-user 인메모리 캐시 — 6개 병렬 DB 쿼리 중복 실행 방지 (TTL: 60초)
const ANALYTICS_CACHE_TTL_MS = 60_000;
const analyticsCache = new Map<string, { data: unknown; expiresAt: number }>();

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, string | number | boolean>;
  timestamp: string;
}

/**
 * POST /api/tarot/analytics — 모바일 앱 이벤트 배치 수집
 */
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const body = (await req.json().catch(() => ({}))) as { events?: AnalyticsEvent[] };
  const { events } = body;

  if (!events || !Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ error: "events array required", code: "MISSING_EVENTS" }, { status: 400 });
  }

  if (events.length > 50) {
    return NextResponse.json({ error: "max 50 events per batch", code: "TOO_MANY_EVENTS" }, { status: 400 });
  }

  const rows = events.map((e) => ({
    userId,
    event: e.event,
    properties: e.properties ?? {},
    clientTimestamp: new Date(e.timestamp),
  }));

  await prisma.tarotAnalyticsEvent.createMany({ data: rows });

  return NextResponse.json({ received: rows.length });
}

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  // 캐시 히트: 60초 내 동일 유저 재요청은 DB 쿼리 생략
  const now = Date.now();
  const cached = analyticsCache.get(userId);
  if (cached && cached.expiresAt > now) {
    return NextResponse.json(cached.data, {
      headers: { "X-Cache": "HIT", "Cache-Control": "private, max-age=60" },
    });
  }

  const [
    totalDraws,
    spreadBreakdown,
    topCards,
    topTickers,
    sourceBreakdown,
    recentActivity,
  ] = await Promise.all([
    // 총 뽑기 수
    prisma.tarotDrawHistory.count({ where: { userId } }),

    // 스프레드 타입별 분포
    prisma.tarotDrawHistory.groupBy({
      by: ["spread"],
      where: { userId },
      _count: true,
    }),

    // 자주 나온 카드 Top 5
    prisma.tarotDrawHistoryCard.groupBy({
      by: ["cardId"],
      where: { draw: { userId } },
      _count: true,
      orderBy: { _count: { cardId: "desc" } },
      take: 5,
    }),

    // 자주 검색한 종목 Top 5
    prisma.tarotDrawHistory.groupBy({
      by: ["ticker"],
      where: { userId },
      _count: true,
      orderBy: { _count: { ticker: "desc" } },
      take: 5,
    }),

    // 해석 소스 분포
    prisma.tarotDrawHistory.groupBy({
      by: ["source"],
      where: { userId },
      _count: true,
    }),

    // 최근 7일 일별 활동
    prisma.$queryRaw`
      SELECT DATE("createdAt") as date, COUNT(*)::int as count
      FROM "TarotDrawHistory"
      WHERE "userId" = ${userId}
        AND "createdAt" >= NOW() - INTERVAL '7 days'
      GROUP BY DATE("createdAt")
      ORDER BY date DESC
    ` as Promise<Array<{ date: string; count: number }>>,
  ]);

  // 카드 ID → 이름 매핑
  const cardIds = topCards.map((c) => c.cardId);
  const cardMeta =
    cardIds.length > 0
      ? await prisma.tarotCard.findMany({
          where: { id: { in: cardIds } },
          select: { id: true, nameKo: true, name: true, number: true },
        })
      : [];

  const cardMap = new Map(cardMeta.map((c) => [c.id, c]));

  const payload = {
    totalDraws,
    spreadBreakdown: spreadBreakdown.map((s) => ({ spread: s.spread, count: s._count })),
    topCards: topCards.map((c) => ({
      cardId: c.cardId,
      count: c._count,
      card: cardMap.get(c.cardId) ?? null,
    })),
    topTickers: topTickers.map((t) => ({ ticker: t.ticker, count: t._count })),
    sourceBreakdown: sourceBreakdown.map((s) => ({ source: s.source, count: s._count })),
    recentActivity,
  };

  analyticsCache.set(userId, { data: payload, expiresAt: now + ANALYTICS_CACHE_TTL_MS });

  return NextResponse.json(payload, {
    headers: { "X-Cache": "MISS", "Cache-Control": "private, max-age=60" },
  });
}
