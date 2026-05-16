import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required", code: "MISSING_USER_ID" },
        { status: 400 }
      );
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
        where: {
          draw: { userId },
        },
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

    return NextResponse.json({
      totalDraws,
      spreadBreakdown: spreadBreakdown.map((s) => ({
        spread: s.spread,
        count: s._count,
      })),
      topCards: topCards.map((c) => ({
        cardId: c.cardId,
        count: c._count,
        card: cardMap.get(c.cardId) ?? null,
      })),
      topTickers: topTickers.map((t) => ({
        ticker: t.ticker,
        count: t._count,
      })),
      sourceBreakdown: sourceBreakdown.map((s) => ({
        source: s.source,
        count: s._count,
      })),
      recentActivity,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Analytics fetch failed",
        code: "FETCH_FAILED",
      },
      { status: 500 }
    );
  }
}
