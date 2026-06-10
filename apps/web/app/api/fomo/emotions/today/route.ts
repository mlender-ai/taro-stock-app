import { NextResponse } from "next/server";
import { EMOTION_TYPES } from "@fomo/core";
import { kstDate, todayTally, corsJson, withCors } from "../../../../../lib/fomo";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

// GET /api/fomo/emotions/today — 오늘 감정 투표 집계 (비율 + 총 N명).
// 정직한 숫자: total은 항상 실제 집계값. 0이어도 그대로.
// 데이터 미비 시 fallback:true + 중립값으로 안전하게 반환 (빈 화면 방지).
export async function GET() {
  const date = kstDate();
  try {
    const { tally, total } = await todayTally(date);
    const counts = Object.fromEntries(EMOTION_TYPES.map((e) => [e, tally[e] ?? 0]));
    const ratios = Object.fromEntries(
      EMOTION_TYPES.map((e) => [e, total > 0 ? Math.round(((tally[e] ?? 0) / total) * 100) : 0])
    );
    // 투표 0건이면 fallback 플래그 명시 — 클라이언트가 "아직 집계 없음"을 구분 가능.
    return corsJson({ date, total, counts, ratios, fallback: total === 0 });
  } catch (err) {
    console.warn("[fomo/emotions/today] error", err);
    // DB 오류 시에도 안전한 중립 기본값 반환.
    const zero = Object.fromEntries(EMOTION_TYPES.map((e) => [e, 0]));
    return corsJson({ date, total: 0, counts: zero, ratios: zero, fallback: true });
  }
}
