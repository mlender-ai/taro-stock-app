import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// 푸시 토큰 등록/갱신
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, pushToken } = body;

    if (!userId || !pushToken) {
      return NextResponse.json(
        { error: "userId and pushToken are required", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { pushToken },
      select: {
        id: true,
        pushToken: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Token update failed",
        code: "UPDATE_FAILED",
      },
      { status: 500 }
    );
  }
}

// 푸시 토큰 해제
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required", code: "MISSING_USER_ID" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { pushToken: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Token delete failed",
        code: "DELETE_FAILED",
      },
      { status: 500 }
    );
  }
}
