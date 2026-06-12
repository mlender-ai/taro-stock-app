import { NextResponse } from "next/server";
import { EMOTION_TYPES } from "@fomo/core";
import { kstDate, todayTally, corsJson, withCors } from "../../../../../lib/fomo";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

// GET /api/fomo/emotions/today — 오늘 감정 투표 집계 (비율 + 총 N명).
// 정직한 숫자: total은 항상 실제 집계값. 0이어도 그대로.
// fallback: true → 아직 투표 데이터 없음 (클라이언트에서 "집계 준비 중" 표시 기준).
export async function GET() {
  const date = kstDate();
  try {
    const { tally, total } = await todayTally(date);
    const counts = Object.fromEntries(EMOTION_TYPES.map((e) => [e, tally[e] ?? 0]));
    const ratios = Object.fromEntries(
      EMOTION_TYPES.map((e) => [e, total > 0 ? Math.round(((tally[e] ?? 0) / total) * 100) : 0])
    );
    return corsJson({ date, total, counts, ratios, fallback: total === 0 });
  } catch (err) {
    // DB 장애 시 500 대신 안전한 폴백 구조 반환 (#425).
    // 정직한 숫자: fallback=true로 데이터 미비임을 명시하되 빈 화면/에러 노출은 금지.
    console.warn("[fomo/emotions/today] error, returning safe fallback", err);
    const emptyCounts = Object.fromEntries(EMOTION_TYPES.map((e) => [e, 0]));
    return corsJson(
      { date, total: 0, counts: emptyCounts, ratios: emptyCounts, fallback: true, error: "TALLY_UNAVAILABLE" },
      { status: 200 }
    );
  }
}
