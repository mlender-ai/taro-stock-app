import { useCallback, useRef, useState } from "react";

type Status = "idle" | "loading" | "ready" | "showing" | "error";

// Expo Go / 개발 환경: react-native-google-mobile-ads는 네이티브 바이너리 필요
// 실제 빌드(EAS Build)에서만 AdMob SDK 활성화됨
// 여기서는 인터페이스만 유지하는 mock 구현 제공
let RewardedAd: any = null;
let RewardedAdEventType: any = null;
let AdEventType: any = null;

try {
  const ads = require("react-native-google-mobile-ads");
  RewardedAd = ads.RewardedAd;
  RewardedAdEventType = ads.RewardedAdEventType;
  AdEventType = ads.AdEventType;
} catch {
  // Expo Go 환경 — 광고 모듈 없음, mock으로 대체
}

export function useRewardedAd(onEarned: () => void) {
  const adRef = useRef<any>(null);
  const [status, setStatus] = useState<Status>("idle");

  const load = useCallback(() => {
    if (!RewardedAd) {
      // Expo Go: 광고 미지원 환경 안내
      setStatus("error");
      return;
    }
    setStatus("loading");
    const { AD_UNIT_REWARDED } = require("./adIds");
    const ad = RewardedAd.createForAdRequest(AD_UNIT_REWARDED, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setStatus("ready");
    });
    const unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      onEarned();
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      setStatus("idle");
      unsubLoaded();
      unsubEarned();
      unsubClosed();
      adRef.current = null;
    });
    ad.addAdEventListener(AdEventType.ERROR, () => {
      setStatus("error");
    });

    adRef.current = ad;
    ad.load();
  }, [onEarned]);

  const show = useCallback(() => {
    if (!adRef.current || status !== "ready") return;
    setStatus("showing");
    adRef.current.show();
  }, [status]);

  return { status, load, show };
}
