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

  // 멱등성: 동일 idempotencyKey로 이미 크레딧 지급됐으면 현재 잔액만 반환
  const existing = await prisma.tarotCreditLedger.findFirst({
    where: { userId, referenceId: idempotencyKey, reason: "PURCHASE" },
  });
  if (existing) {
    const credits = await getCreditBalance(userId);
    return NextResponse.json({ credits, duplicate: true });
  }

  // RevenueCat Subscriber API로 실제 거래 검증
  try {
    const { valid, isSandbox } = await verifyRevenueCat(userId, purchaseToken, productId, platform);
    if (!valid) {
      if (isSandbox) return errorJson("테스트 결제는 프로덕션에서 사용할 수 없습니다", "SANDBOX_NOT_ALLOWED", 402);
      return errorJson("영수증 검증 실패: 해당 거래를 찾을 수 없습니다", "RECEIPT_INVALID", 402);
    }
  } catch (err) {
    console.error("[iap/purchase] verification error:", err instanceof Error ? err.message : err);
    return errorJson("영수증 검증 서버 오류", "RECEIPT_ERROR", 502);
  }

  const credits = await addCredit(userId, creditAmount, "PURCHASE", idempotencyKey);
  return NextResponse.json({ credits, purchased: creditAmount });
}
