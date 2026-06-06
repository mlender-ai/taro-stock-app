import { NextResponse } from "next/server";
import { EMOTION_TYPES, type EmotionType, type EmotionTally } from "@fomo/core";
import { prisma } from "./prisma";

/** Asia/Seoul 기준 YYYY-MM-DD. 파이프라인(scripts/fomo-index-pipeline.ts)과 동일 기준. */
export function kstDate(offsetDays = 0): string {
  const now = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(now);
}

export function isEmotionType(v: unknown): v is EmotionType {
  return typeof v === "string" && (EMOTION_TYPES as readonly string[]).includes(v);
}

/** 당일 감정 투표 집계 → {tally, total}. */
export async function todayTally(date = kstDate()): Promise<{ tally: EmotionTally; total: number }> {
  const rows = await prisma.emotionVote.groupBy({
    by: ["emotion"],
    where: { votedDate: date },
    _count: { _all: true },
  });
  const tally: EmotionTally = {};
  let total = 0;
  for (const r of rows) {
    if (isEmotionType(r.emotion)) {
      tally[r.emotion] = r._count._all;
      total += r._count._all;
    }
  }
  return { tally, total };
}

/** 무가입 웹 교차 출처 허용 — 익명 공개 데이터. CORS 헤더를 응답에 부착. */
export function withCors(res: NextResponse): NextResponse {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}

export function corsJson(body: unknown, init?: ResponseInit): NextResponse {
  return withCors(NextResponse.json(body, init));
}
