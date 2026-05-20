import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/tarot/auth";
import { addCredit, getCreditBalance } from "@/lib/tarot/credits";
import { prisma } from "@/lib/tarot/prisma";
import { verifyNonce } from "@/lib/tarot/rewardNonce";

export const dynamic = "force-dynamic";

const REWARD_AMOUNT = 1;
const REWARD_COOLDOWN_MS = 30 * 60 * 1000; // 30분

interface RewardBody {
  adNonce?: string;
  adToken?: string;
  adExpiresAt?: number;
}

function errorJson(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const body = (await req.json().catch(() => ({}))) as RewardBody;
  const { adNonce, adToken, adExpiresAt } = body;

  if (!adNonce || !adToken || !adExpiresAt) {
    return errorJson("광고 인증 정보가 필요합니다", "MISSING_AD_NONCE", 400);
  }

  if (!verifyNonce(adNonce, userId, adToken, adExpiresAt)) {
    return errorJson("광고 인증이 유효하지 않습니다", "INVALID_AD_NONCE", 403);
  }

  // 멱등성: 동일 nonce로 이미 처리된 리워드면 현재 잔액만 반환
  const existing = await prisma.tarotCreditLedger.findFirst({
    where: { userId, referenceId: adNonce, reason: "REWARD_AD" },
  });
  if (existing) {
    const credits = await getCreditBalance(userId);
    return NextResponse.json({ credits, duplicate: true });
  }

  // 쿨다운: 최근 30분 내 리워드 수령 여부 확인
  const recentReward = await prisma.tarotCreditLedger.findFirst({
    where: {
      userId,
      reason: "REWARD_AD",
      createdAt: { gte: new Date(Date.now() - REWARD_COOLDOWN_MS) },
    },
    orderBy: { createdAt: "desc" },
  });
  if (recentReward) {
    return errorJson("쿨다운 중입니다", "REWARD_COOLDOWN", 429);
  }

  const credits = await addCredit(userId, REWARD_AMOUNT, "REWARD_AD", adNonce);
  return NextResponse.json({ credits, rewarded: REWARD_AMOUNT });
}
