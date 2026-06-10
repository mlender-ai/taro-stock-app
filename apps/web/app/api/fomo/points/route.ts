import { NextRequest, NextResponse } from "next/server";
import { totalPoints, type PointTx } from "@fomo/core";
import { corsJson, withCors, pointTransactions } from "../../../../lib/fomo";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

// GET /api/fomo/points?sessionId=... — 세션의 적립 포인트 총점 + 트랜잭션 로그.
// 정직한 숫자: 실제 기록된 적립만 합산하며, 무결성 위반 로그는 총점에서 제외(totalPoints).
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId")?.trim();
    if (!sessionId) {
      return corsJson({ error: "sessionId 필요", code: "MISSING_SESSION" }, { status: 400 });
    }

    const rows = await pointTransactions(sessionId);
    const total = totalPoints(rows as PointTx[]);
    const transactions = rows.map((r: (typeof rows)[number]) => ({
      action: r.action,
      amount: r.amount,
      refDate: r.refDate,
      createdAt: r.createdAt,
    }));

    return corsJson({ sessionId, total, transactions });
  } catch (err) {
    console.warn("[fomo/points] GET error", err);
    return corsJson({ error: "포인트 조회 실패", code: "POINTS_ERROR" }, { status: 500 });
  }
}
