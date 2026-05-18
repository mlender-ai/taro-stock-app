import { Platform } from "react-native";
import Constants from "expo-constants";
import { apiFetch } from "../api";
import { useUserStore } from "../store";

// react-native-purchases는 네이티브 바이너리 필요 — Expo Go에서 직접 import 시 크래시
// try-require 패턴으로 안전하게 로드
let Purchases: ReturnType<typeof require> | null = null;
let LOG_LEVEL: ReturnType<typeof require> | null = null;

try {
  const mod = require("react-native-purchases");
  Purchases = mod.default;
  LOG_LEVEL = mod.LOG_LEVEL;
} catch {
  // Expo Go 환경 — RevenueCat 미지원
}

let initialized = false;

export function initRevenueCat(userId?: string) {
  if (!Purchases || initialized) return;
  const apiKey =
    Platform.OS === "ios"
      ? (Constants.expoConfig?.extra?.["revenueCatIosKey"] as string | undefined)
      : (Constants.expoConfig?.extra?.["revenueCatAndroidKey"] as string | undefined);

  if (!apiKey) return;

  if (__DEV__ && LOG_LEVEL) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey });
  if (userId) Purchases.logIn(userId);
  initialized = true;
}

export interface CreditPackage {
  identifier: string;
  productId: string;
  localizedPrice: string;
  credits: number;
  rcPackage: unknown; // RevenueCat PurchasesPackage
}

const PRODUCT_CREDITS: Record<string, number> = {
  tarot_credits_5: 5,
  tarot_credits_15: 15,
  tarot_credits_30: 30,
};

export async function getOfferings(): Promise<CreditPackage[]> {
  if (!Purchases) return [];
  const offerings = await Purchases.getOfferings();
  const packages = offerings.current?.availablePackages ?? [];
  return packages.map((pkg: { identifier: string; product: { identifier: string; priceString: string } }) => ({
    identifier: pkg.identifier,
    productId: pkg.product.identifier,
    localizedPrice: pkg.product.priceString,
    credits: PRODUCT_CREDITS[pkg.product.identifier] ?? 0,
    rcPackage: pkg,
  }));
}

interface PurchaseResult {
  credits: number;
  purchased: number;
  duplicate?: boolean;
}

export async function purchaseAndVerify(pkg: CreditPackage): Promise<PurchaseResult> {
  if (!Purchases) throw new Error("RevenueCat not available in Expo Go");

  // 1. RevenueCat 클라이언트에서 결제 진행
  const { customerInfo } = await Purchases.purchasePackage(pkg.rcPackage);

  // 2. 트랜잭션 토큰 추출
  const transactions = customerInfo.nonSubscriptionTransactions ?? [];
  const latestTx = transactions[transactions.length - 1];
  const purchaseToken = latestTx?.transactionIdentifier ?? customerInfo.originalAppUserId;

  // 3. 서버에 영수증 검증 요청
  const result = await apiFetch<PurchaseResult>("/api/tarot/credits/purchase", {
    method: "POST",
    body: JSON.stringify({
      productId: pkg.productId,
      purchaseToken,
      idempotencyKey: `iap_${purchaseToken}_${Date.now()}`,
    }),
  });

  // 4. 글로벌 크레딧 상태 업데이트
  useUserStore.getState().setCredits(result.credits);

  return result;
}

export async function restorePurchases(): Promise<void> {
  if (!Purchases) throw new Error("RevenueCat not available in Expo Go");
  await Purchases.restorePurchases();
}
