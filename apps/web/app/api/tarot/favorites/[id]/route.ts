import { NextResponse } from "next/server";
import { prisma } from "@/lib/tarot/prisma";
import { requireAuth } from "@/lib/tarot/auth-api";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const userId = auth;

  try {
    const body = await request.json() as { alertEnabled?: unknown };
    const { alertEnabled } = body;

    if (typeof alertEnabled !== "boolean") {
      return NextResponse.json(
        { error: "alertEnabled (boolean) is required", code: "INVALID_FIELD" },
        { status: 400 }
      );
    }

    // 본인 소유 항목만 수정 가능
    const favorite = await prisma.tarotFavorite.update({
      where: { id: params.id, userId },
      data: { alertEnabled },
    });

    return NextResponse.json(favorite);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed", code: "UPDATE_FAILED" },
      { status: 500 }
    );
  }
}
