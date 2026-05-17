import { Platform } from "react-native";
import Constants from "expo-constants";

// react-native-purchases는 네이티브 바이너리 필요 — Expo Go에서 직접 import 시 크래시
// try-require 패턴으로 안전하게 로드
let Purchases: any = null;
let LOG_LEVEL: any = null;

try {
  const mod = require("react-native-purchases");
  Purchases = mod.default;
  LOG_LEVEL = mod.LOG_LEVEL;
} catch {
  // Expo Go 환경 — RevenueCat 미지원
}

export type { CustomerInfo, PurchasesPackage } from "react-native-purchases";

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

export async function getOfferings(): Promise<any[]> {
  if (!Purchases) return [];
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
}

export async function purchasePackage(pkg: any): Promise<any> {
  if (!Purchases) throw new Error("RevenueCat not available in Expo Go");
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases(): Promise<any> {
  if (!Purchases) throw new Error("RevenueCat not available in Expo Go");
  return Purchases.restorePurchases();
}
