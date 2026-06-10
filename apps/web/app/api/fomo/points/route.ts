import { NextRequest, NextResponse } from "next/server";
import { isPointReason, pointsForReason, type PointReason } from "@fomo/core";
import { prisma } from "../../../../lib/prisma";
import { kstDate, corsJson, withCors } from "../../../../lib/fomo";
import { extractBearerToken, verifyToken } from "@/lib/tarot/jwt";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

// GET /api/fomo/points?sessionId=... — 세션의 현재 포인트 잔액 + 최근 적립 로그.
// 정직한 숫자: 계정 미존재 시 balance 0, 로그 빈 배열로 안전 폴백.
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId")?.trim();
    if (!sessionId) {
      return corsJson({ error: "sessionId 필요", code: "MISSING_SESSION" }, { status: 400 });
    }

    const account = await prisma.fomoPointAccount.findUnique({
      where: { sessionId },
      include: { logs: { orderBy: { createdAt: "desc" }, take: 20 } },
    });

    const balance = account?.balance ?? 0;
    const logs = (account?.logs ?? []).map((l) => ({
      reason: l.reason,
      amount: l.amount,
      balanceAfter: l.balanceAfter,
      date: l.refDate,
      createdAt: l.createdAt.toISOString(),
    }));

    return corsJson({ sessionId, balance, logs });
  } catch (err) {
    console.warn("[fomo/points] GET error", err);
    return corsJson({ error: "포인트 조회 실패", code: "POINTS_GET_ERROR" }, { status: 500 });
  }
}

interface AwardBody {
  sessionId?: string;
  reason?: string;
  userId?: string;
}

// POST /api/fomo/points — 감정 투표/챌린지 완료 시 포인트 적립.
// 멱등성: 같은 사유(reason)는 하루(refDate)에 1회만 적립된다(중복 호출 안전).
export async function POST(req: NextRequest) {
  const date = kstDate();
  try {
    const body = (await req.json().catch(() => ({}))) as AwardBody;
    const sessionId = body.sessionId?.trim();
    const reason = body.reason;

    if (!sessionId) {
      return corsJson({ error: "sessionId 필요", code: "MISSING_SESSION" }, { status: 400 });
    }
    if (!isPointReason(reason)) {
      return corsJson(
        { error: "reason은 emotion_vote|challenge_complete 중 하나", code: "BAD_REASON" },
        { status: 400 }
      );
    }
    const earnReason: PointReason = reason;

    // 로그인 상태면 Bearer 토큰의 userId 우선(위조 방지), 없으면 body.userId 폴백.
    const tokenUserId = verifyToken(extractBearerToken(req.headers.get("authorization")) ?? "");
    const userId = tokenUserId ?? body.userId ?? null;
    const amount = pointsForReason(earnReason);

    const result = await prisma.$transaction(async (tx) => {
      // 계정 보장(없으면 생성). 로그인 정보가 있으면 동기화.
      const account = await tx.fomoPointAccount.upsert({
        where: { sessionId },
        create: { sessionId, userId, balance: 0 },
        update: userId ? { userId } : {},
      });

      // 멱등성 — 같은 사유 같은 날 이미 적립했으면 잔액만 반환.
      const existing = await tx.fomoPointLog.findUnique({
        where: { sessionId_reason_refDate: { sessionId, reason: earnReason, refDate: date } },
      });
      if (existing) {
        return { balance: account.balance, awarded: 0, duplicate: true };
      }

      const balanceAfter = account.balance + amount;
      await tx.fomoPointAccount.update({
        where: { sessionId },
        data: { balance: balanceAfter },
      });
      await tx.fomoPointLog.create({
        data: { accountId: account.id, sessionId, reason: earnReason, amount, balanceAfter, refDate: date },
      });
      return { balance: balanceAfter, awarded: amount, duplicate: false };
    });

    return corsJson({ ok: true, sessionId, reason: earnReason, date, ...result });
  } catch (err) {
    console.warn("[fomo/points] POST error", err);
    return corsJson({ error: "포인트 적립 실패", code: "POINTS_AWARD_ERROR" }, { status: 500 });
  }
}
