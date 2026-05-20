import { useCallback, useRef, useState } from "react";
import { apiFetch } from "../api";
import { useUserStore } from "../store";
import { trackEvent } from "../analytics";

type Status = "idle" | "loading" | "ready" | "showing" | "earned" | "error";

// Expo Go / 개발 환경: react-native-google-mobile-ads는 네이티브 바이너리 필요
// 실제 빌드(EAS Build)에서만 AdMob SDK 활성화됨
let RewardedAd: ReturnType<typeof require> | null = null;
let RewardedAdEventType: ReturnType<typeof require> | null = null;
let AdEventType: ReturnType<typeof require> | null = null;

try {
  const ads = require("react-native-google-mobile-ads");
  RewardedAd = ads.RewardedAd;
  RewardedAdEventType = ads.RewardedAdEventType;
  AdEventType = ads.AdEventType;
} catch {
  // Expo Go 환경 — 광고 모듈 없음
}

interface NonceResult {
  nonce: string;
  token: string;
  expiresAt: number;
}

interface RewardResult {
  credits: number;
  rewarded: number;
  duplicate?: boolean;
  cooldown?: boolean;
}

export function useRewardedAd() {
  const adRef = useRef<ReturnType<typeof require> | null>(null);
  const nonceRef = useRef<NonceResult | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const claimReward = useCallback(async () => {
    const nonce = nonceRef.current;
    if (!nonce) {
      setStatus("error");
      setErrorMessage("광고 인증 정보 없음");
      return null;
    }
    try {
      const result = await apiFetch<RewardResult>("/api/tarot/credits/reward", {
        method: "POST",
        body: JSON.stringify({
          adNonce: nonce.nonce,
          adToken: nonce.token,
          adExpiresAt: nonce.expiresAt,
        }),
      });
      useUserStore.getState().setCredits(result.credits);
      setStatus("earned");
      trackEvent("ad_earned", { credits: result.credits });
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "리워드 지급 실패";
      trackEvent("ad_error", { error: msg });
      if (msg.includes("429") || msg.includes("쿨다운")) {
        setErrorMessage("30분 후 다시 시도해 주세요");
      } else {
        setErrorMessage(msg);
      }
      setStatus("error");
      return null;
    }
  }, []);

  const load = useCallback(async () => {
    if (!RewardedAd) {
      setStatus("error");
      setErrorMessage("광고를 불러올 수 없습니다 (개발 환경)");
      return;
    }
    setStatus("loading");
    setErrorMessage(null);
    nonceRef.current = null;

    // 서버에서 광고 인증 nonce 발급 — 광고 로드 전 검증 토큰 획득
    try {
      const nonce = await apiFetch<NonceResult>("/api/tarot/credits/reward/nonce", {
        method: "POST",
      });
      nonceRef.current = nonce;
    } catch {
      setStatus("error");
      setErrorMessage("광고 인증 실패");
      return;
    }

    const { AD_UNIT_REWARDED } = require("./adIds");
    const ad = RewardedAd.createForAdRequest(AD_UNIT_REWARDED, {
      requestNonPersonalizedAdsOnly: true,
      serverSideVerificationOptions: {
        customData: nonceRef.current!.nonce,
      },
    });

    const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setStatus("ready");
      trackEvent("ad_loaded");
    });
    const unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      void claimReward();
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      unsubLoaded();
      unsubEarned();
      unsubClosed();
      adRef.current = null;
      setStatus((prev) => (prev === "earned" ? "earned" : "idle"));
    });
    ad.addAdEventListener(AdEventType.ERROR, () => {
      setStatus("error");
      setErrorMessage("광고 로드 실패");
    });

    adRef.current = ad;
    ad.load();
  }, [claimReward]);

  const show = useCallback(() => {
    if (!adRef.current || status !== "ready") return;
    setStatus("showing");
    trackEvent("ad_shown");
    adRef.current.show();
  }, [status]);

  const resetStatus = useCallback(() => {
    setStatus("idle");
    setErrorMessage(null);
  }, []);

  return { status, errorMessage, load, show, resetStatus };
}
