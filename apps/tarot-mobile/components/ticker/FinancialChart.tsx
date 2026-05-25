import React, { useMemo, useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Svg, Rect, SvgText, G, Line } from "../../lib/svg";
import { Text } from "../ui/Text";
import { Colors, Spacing, Radius } from "../../constants/theme";

interface QuarterlyEarning {
  date: string;
  revenue: number | null;
  earnings: number | null;
}

interface AnnualFinancial {
  year: string;
  revenue: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
}

interface Props {
  quarterlyEarnings: QuarterlyEarning[];
  annualFinancials: AnnualFinancial[];
  width: number;
  currency?: string;
}

type ViewMode = "quarterly" | "annual";

const BAR_COLORS = {
  revenue: Colors.taroEssence,
  operatingIncome: "#3b82f6",
  netIncome: "#eab308",
  earnings: "#eab308",
};

function formatCompact(n: number, currency: string): string {
  const abs = Math.abs(n);
  if (currency === "KRW") {
    if (abs >= 1e12) return `${(n / 1e12).toFixed(1)}조`;
    if (abs >= 1e8) return `${(n / 1e8).toFixed(0)}억`;
    return `${(n / 1e4).toFixed(0)}만`;
  }
  if (abs >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
  return n.toLocaleString();
}

const CHART_HEIGHT = 200;
const PADDING = { top: 20, bottom: 40, left: 8, right: 8 };

export function FinancialChart({ quarterlyEarnings, annualFinancials, width, currency = "USD" }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>(
    annualFinancials.length > 0 ? "annual" : "quarterly"
  );

  const hasQuarterly = quarterlyEarnings.length > 0;
  const hasAnnual = annualFinancials.length > 0;

  if (!hasQuarterly && !hasAnnual) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text variant="caption" color={Colors.midGrayText} style={styles.sectionLabel}>
          재무 실적
        </Text>
        <View style={styles.toggleRow}>
          {hasQuarterly && (
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === "quarterly" && styles.toggleActive]}
              onPress={() => setViewMode("quarterly")}
            >
              <Text variant="caption" color={viewMode === "quarterly" ? Colors.taroEssence : Colors.midGrayText}>
                분기
              </Text>
            </TouchableOpacity>
          )}
          {hasAnnual && (
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === "annual" && styles.toggleActive]}
              onPress={() => setViewMode("annual")}
            >
              <Text variant="caption" color={viewMode === "annual" ? Colors.taroEssence : Colors.midGrayText}>
                연간
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.card}>
        {viewMode === "quarterly" ? (
          <QuarterlyChart data={quarterlyEarnings} width={width - Spacing.s24 * 2 - 2} currency={currency} />
        ) : (
          <AnnualChart data={annualFinancials} width={width - Spacing.s24 * 2 - 2} currency={currency} />
        )}

        {/* Legend */}
        <View style={styles.legend}>
          {viewMode === "annual" ? (
            <>
              <LegendItem color={BAR_COLORS.revenue} label="매출" />
              <LegendItem color={BAR_COLORS.operatingIncome} label="영업이익" />
              <LegendItem color={BAR_COLORS.netIncome} label="순이익" />
            </>
          ) : (
            <>
              <LegendItem color={BAR_COLORS.revenue} label="매출" />
              <LegendItem color={BAR_COLORS.earnings} label="순이익" />
            </>
          )}
        </View>
      </View>
    </View>
  );
}

function QuarterlyChart({ data, width, currency }: { data: QuarterlyEarning[]; width: number; currency: string }) {
  const chartData = useMemo(() => {
    const items = data.slice(-8); // 최근 8분기
    if (items.length === 0) return null;

    const allValues = items.flatMap((d) => [d.revenue ?? 0, d.earnings ?? 0]);
    const maxVal = Math.max(...allValues, 1);
    const minVal = Math.min(...allValues, 0);
    const range = maxVal - Math.min(minVal, 0);

    const drawH = CHART_HEIGHT - PADDING.top - PADDING.bottom;
    const drawW = width - PADDING.left - PADDING.right;
    const groupW = drawW / items.length;
    const barW = groupW * 0.3;
    const zeroY = PADDING.top + (maxVal / range) * drawH;

    return { items, maxVal, minVal, range, drawH, groupW, barW, zeroY };
  }, [data, width]);

  if (!chartData) return null;

  return (
    <Svg width={width} height={CHART_HEIGHT} viewBox={`0 0 ${width} ${CHART_HEIGHT}`}>
      {/* Zero line */}
      <Line x1={PADDING.left} y1={chartData.zeroY} x2={width - PADDING.right} y2={chartData.zeroY} stroke={Colors.carbonBorder} strokeWidth={1} />

      {chartData.items.map((item, i) => {
        const x = PADDING.left + i * chartData.groupW;
        const revH = ((item.revenue ?? 0) / chartData.range) * chartData.drawH;
        const earnH = ((item.earnings ?? 0) / chartData.range) * chartData.drawH;

        return (
          <G key={i}>
            {/* Revenue bar */}
            <Rect
              x={x + chartData.groupW * 0.1}
              y={revH >= 0 ? chartData.zeroY - revH : chartData.zeroY}
              width={chartData.barW}
              height={Math.abs(revH) || 1}
              fill={BAR_COLORS.revenue}
              rx={2}
            />
            {/* Earnings bar */}
            <Rect
              x={x + chartData.groupW * 0.1 + chartData.barW + 2}
              y={earnH >= 0 ? chartData.zeroY - earnH : chartData.zeroY}
              width={chartData.barW}
              height={Math.abs(earnH) || 1}
              fill={BAR_COLORS.earnings}
              rx={2}
            />
            {/* Label */}
            <SvgText
              x={x + chartData.groupW / 2}
              y={CHART_HEIGHT - 8}
              fill={Colors.midGrayText}
              fontSize={9}
              textAnchor="middle"
            >
              {item.date}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

function AnnualChart({ data, width, currency }: { data: AnnualFinancial[]; width: number; currency: string }) {
  const chartData = useMemo(() => {
    const items = data.slice(-5); // 최근 5년
    if (items.length === 0) return null;

    const allValues = items.flatMap((d) => [d.revenue ?? 0, d.operatingIncome ?? 0, d.netIncome ?? 0]);
    const maxVal = Math.max(...allValues, 1);
    const minVal = Math.min(...allValues, 0);
    const range = maxVal - Math.min(minVal, 0);

    const drawH = CHART_HEIGHT - PADDING.top - PADDING.bottom;
    const drawW = width - PADDING.left - PADDING.right;
    const groupW = drawW / items.length;
    const barW = groupW * 0.2;
    const zeroY = PADDING.top + (maxVal / range) * drawH;

    return { items, range, drawH, groupW, barW, zeroY };
  }, [data, width]);

  if (!chartData) return null;

  return (
    <Svg width={width} height={CHART_HEIGHT} viewBox={`0 0 ${width} ${CHART_HEIGHT}`}>
      <Line x1={PADDING.left} y1={chartData.zeroY} x2={width - PADDING.right} y2={chartData.zeroY} stroke={Colors.carbonBorder} strokeWidth={1} />

      {chartData.items.map((item, i) => {
        const x = PADDING.left + i * chartData.groupW;
        const revH = ((item.revenue ?? 0) / chartData.range) * chartData.drawH;
        const opH = ((item.operatingIncome ?? 0) / chartData.range) * chartData.drawH;
        const netH = ((item.netIncome ?? 0) / chartData.range) * chartData.drawH;
        const gap = 2;

        return (
          <G key={i}>
            <Rect
              x={x + chartData.groupW * 0.1}
              y={revH >= 0 ? chartData.zeroY - revH : chartData.zeroY}
              width={chartData.barW}
              height={Math.abs(revH) || 1}
              fill={BAR_COLORS.revenue}
              rx={2}
            />
            <Rect
              x={x + chartData.groupW * 0.1 + chartData.barW + gap}
              y={opH >= 0 ? chartData.zeroY - opH : chartData.zeroY}
              width={chartData.barW}
              height={Math.abs(opH) || 1}
              fill={BAR_COLORS.operatingIncome}
              rx={2}
            />
            <Rect
              x={x + chartData.groupW * 0.1 + (chartData.barW + gap) * 2}
              y={netH >= 0 ? chartData.zeroY - netH : chartData.zeroY}
              width={chartData.barW}
              height={Math.abs(netH) || 1}
              fill={BAR_COLORS.netIncome}
              rx={2}
            />
            <SvgText
              x={x + chartData.groupW / 2}
              y={CHART_HEIGHT - 8}
              fill={Colors.midGrayText}
              fontSize={10}
              textAnchor="middle"
            >
              {item.year}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text variant="caption" color={Colors.midGrayText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.s24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.s8,
  },
  sectionLabel: {
    letterSpacing: 0.5,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 4,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  toggleActive: {
    backgroundColor: Colors.voidGreen,
  },
  card: {
    backgroundColor: Colors.graphiteBase,
    borderRadius: Radius.cards,
    padding: Spacing.s24,
    borderWidth: 1,
    borderColor: Colors.carbonBorder,
  },
  legend: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
