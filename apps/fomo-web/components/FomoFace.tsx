import type { FomoFace as FomoFaceType } from "@fomo/core";

/**
 * 마스코트 '포모' 플레이스홀더 (웹). docs/MASCOT.md.
 * 검은 얼굴 + 흰 눈 2점 원칙만 반영한 임시 조형. 감정 색은 glow로 배경광.
 */
export function FomoFace({
  face,
  glow,
  size = 160,
}: {
  face: FomoFaceType;
  glow?: string | undefined;
  size?: number;
}) {
  const eye = EYE_SHAPE[face];
  const eyeW = size * 0.12;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "9999px",
        background: "#000",
        border: "1px solid #2e2e2e",
        boxShadow: glow ? `0 0 28px ${glow}` : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: size * 0.16,
      }}
    >
      {[0, 1].map((i) => (
        <span
          key={i}
          style={{
            width: eyeW,
            height: eyeW * eye.heightRatio,
            borderRadius: "9999px",
            background: "#fafafa",
            opacity: eye.opacity,
          }}
        />
      ))}
    </div>
  );
}

const EYE_SHAPE: Record<FomoFaceType, { heightRatio: number; opacity: number }> = {
  sleepy: { heightRatio: 0.3, opacity: 0.7 },
  calm: { heightRatio: 0.8, opacity: 0.9 },
  curious: { heightRatio: 1.0, opacity: 1 },
  excited: { heightRatio: 1.3, opacity: 1 },
  manic: { heightRatio: 1.5, opacity: 1 },
};
