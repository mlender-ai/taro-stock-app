import { NextResponse } from "next/server";
import { EMOTION_TYPES } from "@fomo/core";
import { kstDate, todayTally, corsJson, withCors } from "../../../../../lib/fomo";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

// GET /api/fomo/emotions/today — 오늘 감정 투표 집계 (비율 + 총 N명).
// 정직한 숫자: total은 항상 실제 집계값. 0이어도 그대로.
export async function GET() {
  const date = kstDate();
  try {
    const { tally, total } = await todayTally(date);
    const counts = Object.fromEntries(EMOTION_TYPES.map((e) => [e, tally[e] ?? 0]));
    const ratios = Object.fromEntries(
      EMOTION_TYPES.map((e) => [e, total > 0 ? Math.round(((tally[e] ?? 0) / total) * 100) : 0])
    );
    return corsJson({ date, total, counts, ratios });
  } catch (err) {
    console.warn("[fomo/emotions/today] error", err);
    return corsJson({ error: "집계 조회 실패", code: "TALLY_ERROR" }, { status: 500 });
  }
}
