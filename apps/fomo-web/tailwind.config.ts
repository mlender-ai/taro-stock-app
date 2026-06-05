import type { Config } from "tailwindcss";
import { EMOTION_COLORS } from "@fomo/core";

// 감정 색은 @fomo/core 단일 소스에서 직접 가져온다 (docs/MASCOT.md §4).
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#000000",
        surface: "#121212",
        elevated: "#1e1e1e",
        hairline: "#2e2e2e",
        muted: "#8a8a8a",
        whiteout: "#fafafa",
        fomo: EMOTION_COLORS.fomo,
        fear: EMOTION_COLORS.fear,
        regret: EMOTION_COLORS.regret,
        greed: EMOTION_COLORS.greed,
        conviction: EMOTION_COLORS.conviction,
      },
    },
  },
  plugins: [],
};

export default config;
