import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// 면책 고지 동의 기록
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, version } = body;

    if (!userId || !version) {
      return NextResponse.json(
        { error: "userId and version are required", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        disclaimerVersion: version,
        disclaimerAgreedAt: new Date(),
      },
      select: {
        id: true,
        disclaimerVersion: true,
        disclaimerAgreedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Disclaimer update failed",
        code: "UPDATE_FAILED",
      },
      { status: 500 }
    );
  }
}

// 면책 고지 동의 상태 조회
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        disclaimerVersion: true,
        disclaimerAgreedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      hasAgreed: !!user.disclaimerVersion,
      version: user.disclaimerVersion,
      agreedAt: user.disclaimerAgreedAt,
      latestVersion: "V1",
      needsUpdate: user.disclaimerVersion !== "V1",
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
