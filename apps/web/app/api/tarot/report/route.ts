import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/tarot/auth";
import { prisma } from "@/lib/tarot/prisma";

export const dynamic = "force-dynamic";

interface ReportBody {
  drawId?: string;
  reason?: string;
}

/**
 * POST /api/tarot/report — 부적절한 해석 콘텐츠 신고
 */
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const body = (await req.json().catch(() => ({}))) as ReportBody;
  const { drawId, reason } = body;

  if (!drawId) return NextResponse.json({ error: "drawId is required", code: "MISSING_DRAW_ID" }, { status: 400 });
  if (!reason?.trim()) return NextResponse.json({ error: "reason is required", code: "MISSING_REASON" }, { status: 400 });

  // 동일 유저+뽑기 중복 신고 방지
  const existing = await prisma.tarotReport.findFirst({
    where: { userId, drawId },
  });
  if (existing) {
    return NextResponse.json({ ...existing, duplicate: true });
  }

  const report = await prisma.tarotReport.create({
    data: { userId, drawId, reason: reason.trim() },
  });

  return NextResponse.json(report);
}
