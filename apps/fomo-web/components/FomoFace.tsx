import type { FomoFace as FomoFaceType } from "@fomo/core";

/**
 * 마스코트 '포모' (웹) — 레트로 픽셀 버전 초안. docs/MASCOT.md / DESIGN_FOMO.md.
 * 타마고치/Alter Ego 류 픽셀 게임 감성: 얼굴을 픽셀 그리드로 그리고, 눈·입 픽셀만으로 5표정 표현.
 * 감정·지수 색(glow)은 외곽 광 + 픽셀 본체 색으로. glow 없으면 무채(흑백 유지).
 * 형태는 미확정(MASCOT §10) — 애니메이션 고도화 전 초안.
 */

const COLS = 11;
const ROWS = 12;

// 얼굴 실루엣(둥근 덩어리). '#' = 픽셀, 그 외 = 비움. 표정별 눈/입은 여기서 '파낸다'(배경색으로 덮음).
const FACE = [
  "...#####...",
  "..#######..",
  ".#########.",
  ".#########.",
  ".#########.",
  ".#########.",
  ".#########.",
  ".#########.",
  ".#########.",
  ".#########.",
  "..#######..",
  "...#####...",
];

// 표정별 눈·입 픽셀 좌표("row,col"). 얼굴 위에서 이 칸을 비워 표정을 만든다.
const EXPR: Record<FomoFaceType, { holes: string[] }> = {
  // 졸림 — 감긴 눈(가로 2칸), 무표정 입
  sleepy: {
    holes: ["4,2", "4,3", "4,7", "4,8", "8,4", "8,5", "8,6"],
  },
  // 차분 — 점 눈, 옅은 가로 입
  calm: {
    holes: ["4,3", "4,7", "8,4", "8,5", "8,6"],
  },
  // 또렷 — 점 눈, 작은 입
  curious: {
    holes: ["3,3", "4,3", "3,7", "4,7", "8,5"],
  },
  // 들뜸 — 큰 눈(2칸), 벌어진 입(o)
  excited: {
    holes: ["3,3", "4,3", "3,7", "4,7", "7,5", "8,4", "8,6", "9,5"],
  },
  // 광기 — 더 큰 눈, 크게 벌어진 입
  manic: {
    holes: ["3,2", "3,3", "4,2", "4,3", "3,7", "3,8", "4,7", "4,8", "7,4", "7,5", "7,6", "8,4", "8,6", "9,4", "9,5", "9,6"],
  },
};

export function FomoFace({
  face,
  glow,
  size = 168,
}: {
  face: FomoFaceType;
  glow?: string | undefined;
  size?: number;
}) {
  const holes = new Set(EXPR[face].holes);
  const pixel = size / (COLS + 2); // 좌우 1칸씩 여백
  const gap = Math.max(1, pixel * 0.08); // 픽셀 사이 미세 간격(레트로 격자감)
  const body = glow ?? "#E8E8E8"; // glow 있으면 감정색이 본체색, 없으면 무채

  const rects: { x: number; y: number }[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (FACE[r]![c] !== "#") continue;
      if (holes.has(`${r},${c}`)) continue; // 눈·입은 비움
      rects.push({ x: c, y: r });
    }
  }

  const w = COLS * pixel;
  const h = ROWS * pixel;

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // 감정/지수 색은 배경광으로만
        filter: glow ? `drop-shadow(0 0 ${pixel * 1.6}px ${glow}AA)` : "none",
        transition: "filter 420ms cubic-bezier(0.16,1,0.3,1)",
        animation: "fomo-float 6s ease-in-out infinite",
      }}
    >
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" aria-hidden>
        {rects.map(({ x, y }) => (
          <rect
            key={`${x},${y}`}
            x={x * pixel + gap / 2}
            y={y * pixel + gap / 2}
            width={pixel - gap}
            height={pixel - gap}
            fill={body}
          />
        ))}
      </svg>
    </div>
  );
}
