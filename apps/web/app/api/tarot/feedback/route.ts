import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/tarot/auth";
import { prisma } from "@/lib/tarot/prisma";
import type { TarotFeedbackRating } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_RATINGS: TarotFeedbackRating[] = ["ONE", "TWO", "THREE", "FOUR", "FIVE"];

interface FeedbackBody {
  drawId?: string;
  rating?: string;
  comment?: string;
}

/**
 * POST /api/tarot/feedback — 뽑기 결과에 대한 만족도 피드백
 */
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const body = (await req.json().catch(() => ({}))) as FeedbackBody;
  const { drawId, rating, comment } = body;

  if (!drawId) return NextResponse.json({ error: "drawId is required", code: "MISSING_DRAW_ID" }, { status: 400 });
  if (!rating || !VALID_RATINGS.includes(rating as TarotFeedbackRating)) {
    return NextResponse.json({ error: "rating must be ONE~FIVE", code: "INVALID_RATING" }, { status: 400 });
  }

  // upsert: 동일 유저+뽑기 조합은 1개만 허용 (수정 가능)
  const feedback = await prisma.tarotFeedback.upsert({
    where: { userId_drawId: { userId, drawId } },
    create: { userId, drawId, rating: rating as TarotFeedbackRating, comment: comment?.trim() || null },
    update: { rating: rating as TarotFeedbackRating, comment: comment?.trim() || null },
  });

  return NextResponse.json(feedback);
}
