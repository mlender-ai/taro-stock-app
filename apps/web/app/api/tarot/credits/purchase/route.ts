import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/tarot/auth";
import { addCredit, getCreditBalance } from "@/lib/tarot/credits";
import { prisma } from "@/lib/tarot/prisma";

export const dynamic = "force-dynamic";

function errorJson(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

interface PurchaseBody {
  productId?: string;
  purchaseToken?: string; // RevenueCat transaction ID
  idempotencyKey?: string;
  platform?: "ios" | "android";
}

// 상품 ID → 크레딧 매핑
const PRODUCT_CREDIT_MAP: Record<string, number> = {
  "tarot_credits_5":  5,
  "tarot_credits_15": 15,
  "tarot_credits_30": 30,
};

interface RevenueCatNonSubscription {
  id: string;
  is_sandbox: boolean;
  purchase_date: string;
  store: string;
}

interface RevenueCatSubscriberResponse {
  subscriber?: {
    non_subscriptions?: Record<string, RevenueCatNonSubscription[]>;
  };
}

// RevenueCat GET /v1/subscribers/{app_user_id} 로 거래 실제 검증
async function verifyRevenueCat(
  userId: string,
  purchaseToken: string,
  productId: string,
  platform: "ios" | "android"
): Promise<{ valid: boolean; isSandbox: boolean }> {
  const apiKey = process.env["REVENUECAT_SECRET_API_KEY"];
  if (!apiKey) throw new Error("REVENUECAT_SECRET_API_KEY not set");

  const res = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Platform": platform,
      },
      signal: AbortSignal.timeout(10_000),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[iap/verify] RevenueCat ${res.status}: ${body}`);
    throw new Error(`RevenueCat subscriber lookup failed: ${res.status}`);
  }

  const data = (await res.json()) as RevenueCatSubscriberResponse;
  const transactions: RevenueCatNonSubscription[] =
    data.subscriber?.non_subscriptions?.[productId] ?? [];

  const match = transactions.find((tx) => tx.id === purchaseToken);
  if (!match) return { valid: false, isSandbox: false };

  // 프로덕션 환경에서는 sandbox 구매 거부
  const isProduction = process.env["NODE_ENV"] === "production";
  if (isProduction && match.is_sandbox) {
    console.warn(`[iap/verify] sandbox purchase rejected in production: ${purchaseToken}`);
    return { valid: false, isSandbox: true };
  }

  return { valid: true, isSandbox: match.is_sandbox };
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const body = (await req.json().catch(() => ({}))) as PurchaseBody;
  const { productId, purchaseToken, idempotencyKey, platform = "ios" } = body;

  if (!productId) return errorJson("productId is required", "MISSING_PRODUCT_ID", 400);
  if (!purchaseToken) return errorJson("purchaseToken is required", "MISSING_PURCHASE_TOKEN", 400);
  if (!idempotencyKey) return errorJson("idempotencyKey is required", "MISSING_IDEMPOTENCY_KEY", 400);
  if (platform !== "ios" && platform !== "android") {
    return errorJson("platform must be ios or android", "INVALID_PLATFORM", 400);
  }

  const creditAmount = PRODUCT_CREDIT_MAP[productId];
  if (!creditAmount) return errorJson("Unknown product", "INVALID_PRODUCT", 400);

  // 1차 중복 방지: idempotencyKey 기반 클라이언트 재시도 (빠른 경로)
  const existingByKey = await prisma.tarotCreditLedger.findFirst({
    where: { userId, referenceId: idempotencyKey, reason: "PURCHASE" },
  });
  if (existingByKey) {
    const credits = await getCreditBalance(userId);
    return NextResponse.json({ credits, duplicate: true });
  }

  // 2차 중복 방지: purchaseToken 글로벌 재사용 차단 — RevenueCat 호출 전에 처리해 API 비용 절감
  const existingByToken = await prisma.tarotCreditLedger.findFirst({
    where: { referenceId: purchaseToken, reason: "PURCHASE" },
  });
  if (existingByToken) {
    console.warn(`[iap/purchase] token reuse attempt: userId=${userId} token=${purchaseToken} idempotencyKey=${idempotencyKey}`);
    void prisma.adminAuditLog.create({
      data: {
        action: "iap.token_reuse",
        targetId: userId,
        targetType: "User",
        after: { purchaseToken, productId, idempotencyKey, platform },
      },
    });
    return errorJson("이미 사용된 구매 토큰입니다", "TOKEN_ALREADY_USED", 409);
  }

  // RevenueCat Subscriber API로 실제 거래 검증
  let isSandboxPurchase = false;
  try {
    const { valid, isSandbox } = await verifyRevenueCat(userId, purchaseToken, productId, platform);
    isSandboxPurchase = isSandbox;
    if (!valid) {
      void prisma.adminAuditLog.create({
        data: {
          action: isSandbox ? "iap.sandbox_rejected" : "iap.receipt_invalid",
          targetId: userId,
          targetType: "User",
          after: { purchaseToken, productId, platform, idempotencyKey },
        },
      });
      if (isSandbox) return errorJson("테스트 결제는 프로덕션에서 사용할 수 없습니다", "SANDBOX_NOT_ALLOWED", 402);
      return errorJson("영수증 검증 실패: 해당 거래를 찾을 수 없습니다", "RECEIPT_INVALID", 402);
    }
  } catch (err) {
    console.error("[iap/purchase] verification error:", err instanceof Error ? err.message : err);
    return errorJson("영수증 검증 서버 오류", "RECEIPT_ERROR", 502);
  }

  // referenceId를 purchaseToken으로 저장 — 글로벌 유일성 보장 (2차 중복 방지와 일관성)
  const credits = await addCredit(userId, creditAmount, "PURCHASE", purchaseToken);

  void prisma.adminAuditLog.create({
    data: {
      action: "iap.purchase_success",
      targetId: userId,
      targetType: "User",
      after: { purchaseToken, productId, creditAmount, platform, isSandbox: isSandboxPurchase, idempotencyKey },
    },
  });

  return NextResponse.json({ credits, purchased: creditAmount });
}
