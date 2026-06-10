import { NextResponse } from "next/server";
import { curatedVoices, type CuratedVoice } from "@fomo/core";
import { kstDate, corsJson, withCors } from "../../../../lib/fomo";

export const dynamic = "force-dynamic";

// M4 — 피드: 타인의 구조화 한마디. docs/M4_EXECUTION_PLAN.md §4.3.
// 현 단계(P0 읽기): EmotionVote에 situationKey/resolveKey 컬럼이 아직 없어
// (Prisma migration = 사용자 확인 대기) 실사용자 voice는 0건 → 포모 큐레이션 폴백만 반환.
// 정직한 숫자 원칙: 가짜 사용자로 위장하지 않는다 — curated:true로 명시하고 UI가
// "포모가 모아둔 마음"으로 표기한다. migration 후 composeVoice(실측 vote) 항목이
// items 앞쪽에 합류하고 부족분만 큐레이션으로 채운다.

export interface VoiceItem extends CuratedVoice {
  /** true=포모 큐레이션(폴백) / false=실제 사용자의 조합. */
  curated: boolean;
}

export function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET() {
  try {
    const date = kstDate();
    const items: VoiceItem[] = curatedVoices(date, 3).map((v) => ({ ...v, curated: true }));
    return corsJson({ date, items });
  } catch (err) {
    console.warn("[fomo/voices] error", err);
    return corsJson({ error: "피드 조회 실패", code: "VOICES_ERROR" }, { status: 500 });
  }
}
