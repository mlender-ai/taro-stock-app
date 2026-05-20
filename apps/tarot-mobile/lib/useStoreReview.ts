import { useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// expo-store-review는 네이티브 바이너리 필요 — try-require 패턴
let StoreReview: { isAvailableAsync: () => Promise<boolean>; requestReview: () => Promise<void> } | null = null;
try {
  StoreReview = require("expo-store-review");
} catch {
  // Expo Go 환경
}

const STORAGE_KEY = "store_review_asked";
const DRAW_THRESHOLD = 3; // 3회 뽑기 후 리뷰 요청
const RATING_THRESHOLD = 4; // 4점 이상 피드백 후 리뷰 요청

async function hasAlreadyAsked(): Promise<boolean> {
  const val = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
  return val === "1";
}

async function markAsked(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, "1").catch(() => {});
}

async function tryRequestReview(): Promise<void> {
  if (!StoreReview) return;
  if (await hasAlreadyAsked()) return;

  const available = await StoreReview.isAvailableAsync().catch(() => false);
  if (!available) return;

  await StoreReview.requestReview().catch(() => {});
  await markAsked();
}

export function useStoreReview() {
  const drawCount = useRef(0);

  const onDrawComplete = useCallback(() => {
    drawCount.current += 1;
    if (drawCount.current >= DRAW_THRESHOLD) {
      void tryRequestReview();
    }
  }, []);

  const onPositiveFeedback = useCallback((rating: number) => {
    if (rating >= RATING_THRESHOLD) {
      void tryRequestReview();
    }
  }, []);

  return { onDrawComplete, onPositiveFeedback };
}
