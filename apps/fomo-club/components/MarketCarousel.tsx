import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { scoreToColor, type MarketScore } from "@fomo/core";
import { FomoColors, Spacing, Radius } from "../constants/fomoTheme";

/**
 * 시장 점수 캐러셀 — 나스닥·비트코인·코스피, 3초 자동 슬라이드. docs/PIVOT_FEED_FIRST.md.
 * 웹 MarketCarousel의 네이티브 미러. 점수 색=구간색, 실측 등락률 근거.
 */
const ROTATE_MS = 3000;

function pct(n: number): string {
  const v = Math.round(n * 10) / 10;
  return `${v > 0 ? "+" : ""}${v}%`;
}

export function MarketCarousel({ markets }: { markets: MarketScore[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (markets.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % markets.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [markets.length]);

  if (markets.length === 0) return null;
  const m = markets[Math.min(idx, markets.length - 1)]!;
  const color = scoreToColor(m.score);

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View>
          <Text style={styles.label}>{m.label}</Text>
          <Text style={[styles.change, { color }]}>{pct(m.changePct)} · 오늘</Text>
        </View>
        <View style={styles.right}>
          <Text style={[styles.score, { color }]}>{m.score}</Text>
          <Text style={styles.state}>{m.state}</Text>
        </View>
      </View>
      {markets.length > 1 && (
        <View style={styles.dots}>
          {markets.map((mk, i) => (
            <View
              key={mk.key}
              style={[styles.dot, { backgroundColor: i === idx ? FomoColors.whiteout : "#333" }]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: FomoColors.hairline,
    backgroundColor: FomoColors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s12,
  },
  label: { color: FomoColors.whiteout, fontSize: 14, fontWeight: "600" },
  change: { fontSize: 12, marginTop: 2 },
  right: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  score: { fontSize: 30, fontWeight: "700", lineHeight: 32 },
  state: { color: FomoColors.muted, fontSize: 12, marginBottom: 3 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: Spacing.s8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
