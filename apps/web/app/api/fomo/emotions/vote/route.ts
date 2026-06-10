import { NextRequest, NextResponse } from "next/server";
import { EMOTION_TYPES } from "@fomo/core";
import { prisma } from "../../../../../lib/prisma";
import { kstDate, todayTally, isEmotionType, corsJson, withCors } from "../../../../../lib/fomo";
import { extractBearerToken, verifyToken } from "@/lib/tarot/jwt";
import { verifySessionSig } from "../../../../../lib/sessionHmac";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

interface VoteBody {
  sessionId?: string;
  sessionSig?: string;
  emotion?: string;
  source?: string;
  userId?: string;
}

// POST /api/fomo/emotions/vote — 감정 투표 (sessionId + emotion). 무가입 허용, 1세션 1일 1회.
export async function POST(req: NextRequest) {
  const date = kstDate();
  try {
    const body = (await req.json().catch(() => ({}))) as VoteBody;
    const sessionId = body.sessionId?.trim();
    const emotion = body.emotion;
    const source = body.source === "mobile" ? "mobile" : "web";

    if (!sessionId) {
      return corsJson({ error: "sessionId 필요", code: "MISSING_SESSION" }, { status: 400 });
    }

    // HMAC 서명 검증 — 서명이 있으면 반드시 올바른 서명이어야 한다.
    // 서명이 없는 경우 레거시 클라이언트(서명 미지원)로 간주하고 허용.
    const sessionSig = body.sessionSig?.trim();
    if (sessionSig && !verifySessionSig(sessionId, sessionSig)) {
      console.warn("[fomo/emotions/vote] 세션 서명 불일치 — 위변조 의심", { sessionId: sessionId.slice(0, 8) + "…" });
      return corsJson({ error: "세션 서명이 올바르지 않습니다", code: "INVALID_SESSION_SIG" }, { status: 403 });
    }

    if (!isEmotionType(emotion)) {
      return corsJson(
        { error: `emotion은 ${EMOTION_TYPES.join("|")} 중 하나`, code: "BAD_EMOTION" },
        { status: 400 }
      );
    }

    // 로그인 상태면 Bearer 토큰의 userId를 우선(클라 위조 방지), 없으면 body.userId 폴백.
    const tokenUserId = verifyToken(extractBearerToken(req.headers.get("authorization")) ?? "");
    const userId = tokenUserId ?? body.userId ?? null;

    // 1세션 1일 1회 — 같은 날 재투표는 감정만 갱신(@@unique([sessionId, votedDate]))
    await prisma.emotionVote.upsert({
      where: { sessionId_votedDate: { sessionId, votedDate: date } },
      create: { sessionId, emotion, source, votedDate: date, userId },
      update: { emotion, source, ...(userId ? { userId } : {}) },
    });

    const { tally, total } = await todayTally(date);
    const counts = Object.fromEntries(EMOTION_TYPES.map((e) => [e, tally[e] ?? 0]));
    const ratios = Object.fromEntries(
      EMOTION_TYPES.map((e) => [e, total > 0 ? Math.round(((tally[e] ?? 0) / total) * 100) : 0])
    );
    return corsJson({ ok: true, mine: emotion, date, total, counts, ratios });
  } catch (err) {
    console.warn("[fomo/emotions/vote] error", err);
    return corsJson({ error: "투표 저장 실패", code: "VOTE_ERROR" }, { status: 500 });
  }
}
