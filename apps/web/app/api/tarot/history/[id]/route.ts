import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const draw = await prisma.tarotDrawHistory.findUnique({
      where: { id: params.id },
      include: {
        cards: {
          include: {
            card: true,
          },
          orderBy: { position: "asc" },
        },
        feedbacks: {
          select: {
            rating: true,
            comment: true,
            createdAt: true,
          },
        },
      },
    });

    if (!draw) {
      return NextResponse.json(
        { error: "Draw not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json(draw, {
      headers: { "Cache-Control": "private, max-age=300, stale-while-revalidate=60" },
    });
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
