import { View, StyleSheet } from "react-native";
import { Colors } from "../constants/colors";

// react-native-google-mobile-ads는 네이티브 바이너리 필요 — Expo Go에서 직접 import 시 크래시
let BannerAd: ReturnType<typeof require> | null = null;
let BannerAdSize: Record<string, string> | null = null;

try {
  const ads = require("react-native-google-mobile-ads");
  BannerAd = ads.BannerAd;
  BannerAdSize = ads.BannerAdSize;
} catch {
  // Expo Go 환경 — 광고 미지원
}

export function AdBanner() {
  if (!BannerAd || !BannerAdSize) return null;

  const { AD_UNIT_BANNER } = require("../lib/ads/adIds");

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={AD_UNIT_BANNER}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", backgroundColor: Colors.bg },
});
