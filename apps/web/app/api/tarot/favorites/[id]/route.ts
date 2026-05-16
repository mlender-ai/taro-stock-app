import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

// 알림 토글 (관심 종목별 on/off)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { alertEnabled } = body;

    if (typeof alertEnabled !== "boolean") {
      return NextResponse.json(
        { error: "alertEnabled (boolean) is required", code: "INVALID_FIELD" },
        { status: 400 }
      );
    }

    const favorite = await prisma.tarotFavorite.update({
      where: { id: params.id },
      data: { alertEnabled },
    });

    return NextResponse.json(favorite);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Update failed",
        code: "UPDATE_FAILED",
      },
      { status: 500 }
    );
  }
}
