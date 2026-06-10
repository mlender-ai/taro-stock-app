import { NextRequest, NextResponse } from "next/server";
import { isChallengeStatus, shouldAwardOnComplete } from "@fomo/core";
import { prisma } from "../../../../lib/prisma";
import { kstDate, corsJson, withCors, awardPoints } from "../../../../lib/fomo";
import { extractBearerToken, verifyToken } from "@/lib/tarot/jwt";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

interface ChallengeBody {
  sessionId?: string;
  userId?: string;
  status?: string;
}

// GET /api/fomo/challenges?sessionId=... — 오늘 챌린지 상태 조회. 레코드 없으면 pending 폴백.
export async function GET(req: NextRequest) {
  const date = kstDate();
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId")?.trim();
    if (!sessionId) {
      return corsJson({ error: "sessionId 필요", code: "MISSING_SESSION" }, { status: 400 });
    }

    const row = await prisma.dailyChallenge.findUnique({
      where: { sessionId_challengeDate: { sessionId, challengeDate: date } },
    });

    // 미참여 — 안전 폴백(빈 값/에러 노출 금지)
    if (!row) {
      return corsJson({ date, status: "pending", completedAt: null });
    }
    return corsJson({ date, status: row.status, completedAt: row.completedAt });
  } catch (err) {
    console.warn("[fomo/challenges] GET error", err);
    return corsJson({ error: "챌린지 조회 실패", code: "CHALLENGE_ERROR" }, { status: 500 });
  }
}

// POST /api/fomo/challenges — 챌린지 상태 저장(완료 처리). 완료 시 포인트 적립(멱등).
export async function POST(req: NextRequest) {
  const date = kstDate();
  try {
    const body = (await req.json().catch(() => ({}))) as ChallengeBody;
    const sessionId = body.sessionId?.trim();
    const status = body.status ?? "completed";

    if (!sessionId) {
      return corsJson({ error: "sessionId 필요", code: "MISSING_SESSION" }, { status: 400 });
    }
    if (!isChallengeStatus(status)) {
      return corsJson({ error: "status는 pending|completed", code: "BAD_STATUS" }, { status: 400 });
    }

    const tokenUserId = verifyToken(extractBearerToken(req.headers.get("authorization")) ?? "");
    const userId = tokenUserId ?? body.userId ?? null;

    // 기존 상태 확인 — 이미 완료면 중복 적립 금지
    const prev = await prisma.dailyChallenge.findUnique({
      where: { sessionId_challengeDate: { sessionId, challengeDate: date } },
    });

    const completedAt = status === "completed" ? new Date() : null;
    const saved = await prisma.dailyChallenge.upsert({
      where: { sessionId_challengeDate: { sessionId, challengeDate: date } },
      create: { sessionId, userId, challengeDate: date, status, completedAt },
      update: { status, ...(userId ? { userId } : {}), completedAt },
    });

    // 완료 전환 시에만 적립
    let awarded = 0;
    if (status === "completed" && shouldAwardOnComplete(prev?.status as never)) {
      const result = await awardPoints({
        sessionId,
        userId,
        action: "challenge_complete",
        refDate: date,
      });
      awarded = result?.amount ?? 0;
    }

    return corsJson({ ok: true, date, status: saved.status, completedAt: saved.completedAt, awarded });
  } catch (err) {
    console.warn("[fomo/challenges] POST error", err);
    return corsJson({ error: "챌린지 저장 실패", code: "CHALLENGE_ERROR" }, { status: 500 });
  }
}
