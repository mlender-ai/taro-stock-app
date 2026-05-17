import { Platform } from "react-native";

// Google 공식 테스트 ID — react-native-google-mobile-ads TestIds 대신 하드코딩
// (Expo Go 환경에서 TestIds import 시 네이티브 모듈 초기화로 크래시 발생)
const TEST_BANNER = "ca-app-pub-3940256099942544/2934735716";
const TEST_REWARDED = "ca-app-pub-3940256099942544/1712485313";

export const AD_UNIT_BANNER = __DEV__
  ? TEST_BANNER
  : Platform.OS === "ios"
  ? "ca-app-pub-PLACEHOLDER/PLACEHOLDER_BANNER_IOS"
  : "ca-app-pub-PLACEHOLDER/PLACEHOLDER_BANNER_ANDROID";

export const AD_UNIT_REWARDED = __DEV__
  ? TEST_REWARDED
  : Platform.OS === "ios"
  ? "ca-app-pub-PLACEHOLDER/PLACEHOLDER_REWARDED_IOS"
  : "ca-app-pub-PLACEHOLDER/PLACEHOLDER_REWARDED_ANDROID";
