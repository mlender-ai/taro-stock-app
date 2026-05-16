import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// 관심 종목 목록 조회
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

    const favorites = await prisma.tarotFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ items: favorites });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Fetch failed",
        code: "FETCH_FAILED",
      },
      { status: 500 }
    );
  }
}

// 관심 종목 추가
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, ticker, market, label } = body;

    if (!userId || !ticker || !market) {
      return NextResponse.json(
        {
          error: "userId, ticker, and market are required",
          code: "MISSING_FIELDS",
        },
        { status: 400 }
      );
    }

    const favorite = await prisma.tarotFavorite.upsert({
      where: { userId_ticker: { userId, ticker } },
      create: {
        userId,
        ticker,
        market,
        label: label ?? null,
        alertEnabled: false,
      },
      update: {
        label: label ?? undefined,
        market,
      },
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Create failed",
        code: "CREATE_FAILED",
      },
      { status: 500 }
    );
  }
}

// 관심 종목 삭제
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const ticker = searchParams.get("ticker");

    if (!userId || !ticker) {
      return NextResponse.json(
        { error: "userId and ticker are required", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    await prisma.tarotFavorite.delete({
      where: { userId_ticker: { userId, ticker } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Delete failed",
        code: "DELETE_FAILED",
      },
      { status: 500 }
    );
  }
}
