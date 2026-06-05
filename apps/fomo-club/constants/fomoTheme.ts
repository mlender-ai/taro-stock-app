import { EMOTION_COLORS } from "@fomo/core";

/**
 * FOMO Club 다크 테마 토큰. docs/MASCOT.md §4 색 체계.
 * 배경 검정, 포모/수치 흰색, 감정 색은 포인트로만(@fomo/core 단일 소스).
 */
export const FomoColors = {
  ink: "#000000",
  surface: "#121212",
  elevated: "#1e1e1e",
  hairline: "#2e2e2e",
  muted: "#8a8a8a",
  whiteout: "#fafafa",
  emotion: EMOTION_COLORS,
} as const;

export const Spacing = { s4: 4, s8: 8, s12: 12, s16: 16, s24: 24, s32: 32, s40: 40 } as const;
export const Radius = { sm: 6, md: 12, lg: 16, pill: 9999 } as const;
