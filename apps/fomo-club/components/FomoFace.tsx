import { View, StyleSheet } from "react-native";
import type { FomoFace as FomoFaceType } from "@fomo/core";
import { FomoColors } from "../constants/fomoTheme";

/**
 * 마스코트 '포모' 플레이스홀더. docs/MASCOT.md.
 * 구체적 형태/픽셀 표정은 미확정(§10) — 검은 얼굴 + 흰 눈 2점 원칙만 반영한 임시 조형.
 * 5표정(face)별 눈 모양만 최소 변형. 감정 색은 glow prop으로 배경광 처리.
 */
export function FomoFace({
  face,
  glow,
  size = 160,
}: {
  face: FomoFaceType;
  /** 감정/지수 포인트 색 (hex). 없으면 무채색. */
  glow?: string;
  size?: number;
}) {
  const eye = EYE_SHAPE[face];
  return (
    <View
      style={[
        styles.head,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          shadowColor: glow ?? "transparent",
          shadowOpacity: glow ? 0.6 : 0,
          shadowRadius: glow ? 28 : 0,
        },
      ]}
    >
      <View style={[styles.eyes, { gap: size * 0.16 }]}>
        {[0, 1].map((i) => (
          <View
            key={i}
            style={{
              width: size * 0.12,
              height: size * 0.12 * eye.heightRatio,
              borderRadius: 999,
              backgroundColor: FomoColors.whiteout,
              opacity: eye.opacity,
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: FomoColors.ink,
    borderWidth: 1,
    borderColor: FomoColors.hairline,
    shadowOffset: { width: 0, height: 0 },
  },
  eyes: { flexDirection: "row" },
});

const EYE_SHAPE: Record<FomoFaceType, { heightRatio: number; opacity: number }> = {
  sleepy: { heightRatio: 0.3, opacity: 0.7 },
  calm: { heightRatio: 0.8, opacity: 0.9 },
  curious: { heightRatio: 1.0, opacity: 1 },
  excited: { heightRatio: 1.3, opacity: 1 },
  manic: { heightRatio: 1.5, opacity: 1 },
};
