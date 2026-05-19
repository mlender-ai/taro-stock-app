import { NextResponse } from "next/server";
import { prisma } from "@/lib/tarot/prisma";
import { requireAuth } from "@/lib/tarot/auth-api";
import type { TarotMarket } from "@prisma/client";

export async function GET(request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const userId = auth;

  try {
    const favorites = await prisma.tarotFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items: favorites });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fetch failed", code: "FETCH_FAILED" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const userId = auth;

  try {
    const body = await request.json() as { ticker?: string; market?: string; label?: string };
    const { ticker, label } = body;
    const market = body.market as TarotMarket | undefined;

    if (!ticker || !market) {
      return NextResponse.json(
        { error: "ticker and market are required", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    const favorite = await prisma.tarotFavorite.upsert({
      where: { userId_ticker: { userId, ticker } },
      create: { userId, ticker, market, label: label ?? null, alertEnabled: false },
      update: { market, ...(label !== undefined ? { label } : {}) },
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Create failed", code: "CREATE_FAILED" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const userId = auth;

  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get("ticker");

    if (!ticker) {
      return NextResponse.json(
        { error: "ticker is required", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    await prisma.tarotFavorite.delete({
      where: { userId_ticker: { userId, ticker } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed", code: "DELETE_FAILED" },
      { status: 500 }
    );
  }
}
