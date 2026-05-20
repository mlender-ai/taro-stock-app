import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/tarot/auth";
import { issueNonce } from "@/lib/tarot/rewardNonce";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const { nonce, token, expiresAt } = issueNonce(userId);
  return NextResponse.json({ nonce, token, expiresAt });
}
