import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);
    const ticker = searchParams.get("ticker");
    const spread = searchParams.get("spread");
    const sort = searchParams.get("sort") ?? "newest";

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required", code: "MISSING_USER_ID" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { userId };
    if (ticker) where.ticker = ticker;
    if (spread) where.spread = spread;

    const orderBy =
      sort === "oldest"
        ? { createdAt: "asc" as const }
        : { createdAt: "desc" as const };

    const [items, total] = await Promise.all([
      prisma.tarotDrawHistory.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          ticker: true,
          market: true,
          spread: true,
          headline: true,
          source: true,
          creditCost: true,
          createdAt: true,
          cards: {
            select: {
              cardId: true,
              orientation: true,
              slot: true,
              position: true,
              card: {
                select: {
                  nameKo: true,
                  name: true,
                  number: true,
                },
              },
            },
            orderBy: { position: "asc" },
          },
        },
      }),
      prisma.tarotDrawHistory.count({ where }),
    ]);

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "History fetch failed",
        code: "FETCH_FAILED",
      },
      { status: 500 }
    );
  }
}
