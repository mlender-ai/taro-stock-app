import { View, Text, StyleSheet } from "react-native";
import { assetHeatScore, scoreToFace, type ChartCard } from "@fomo/core";
import { FomoFace } from "../FomoFace";
import { FomoColors, Spacing } from "../../constants/fomoTheme";

function pct(n: number): string {
  const v = Math.round(n * 10) / 10;
  return `${v > 0 ? "+" : ""}${v}%`;
}
function fmt(v: number): string {
  return v.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

/**
 * 차트 카드 본문 — 포모 코멘트 + 자산명·현재가·등락%. docs/PIVOT_FEED_FIRST.md.
 * 네이티브 1차: 추이선(스파크라인)은 생략(react-native-svg 미설치) — 숫자 카드. 후속 추가.
 */
export function ChartCardBody({ chart }: { chart: ChartCard }) {
  const up = chart.changePct >= 0;
  const color = up ? "#FF5A36" : "#38BDF8";
  const face = scoreToFace(assetHeatScore(chart.changePct));

  return (
    <View style={styles.root}>
      <View style={styles.topRow}>
        <FomoFace face={face} size={44} glow={color} />
        <View style={styles.col}>
          <Text style={styles.name}>포모 · 시장 한눈에</Text>
          {!!chart.comment && (
            <View style={styles.bubble}>
              <Text style={styles.bubbleText}>{chart.comment}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.values}>
        <Text style={styles.label}>{chart.label}</Text>
        <View style={styles.valueRow}>
          <Text style={styles.value}>{fmt(chart.value)}</Text>
          <Text style={[styles.change, { color }]}>{pct(chart.changePct)}</Text>
        </View>
      </View>

      <Text style={styles.note}>최근 추이는 앱에서 곧 보여줄게. 지금은 숫자만.</Text>
      <Text style={styles.disclaimer}>시장 체감용 지표예요. 투자 조언이 아니에요.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topRow: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.s8 },
  col: { flex: 1 },
  name: { color: FomoColors.muted, fontSize: 11 },
  bubble: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: FomoColors.hairline,
    backgroundColor: FomoColors.elevated,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: Spacing.s12,
    paddingVertical: Spacing.s8,
  },
  bubbleText: { color: FomoColors.whiteout, fontSize: 14, lineHeight: 20 },
  values: { marginTop: Spacing.s24 },
  label: { color: FomoColors.muted, fontSize: 14 },
  valueRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: 4 },
  value: { color: FomoColors.whiteout, fontSize: 32, fontWeight: "700", lineHeight: 34 },
  change: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  note: { color: FomoColors.muted, fontSize: 12, marginTop: Spacing.s16, flex: 1 },
  disclaimer: {
    color: FomoColors.muted,
    fontSize: 11,
    borderTopWidth: 1,
    borderTopColor: FomoColors.hairline,
    paddingTop: Spacing.s12,
    marginTop: Spacing.s12,
  },
});
