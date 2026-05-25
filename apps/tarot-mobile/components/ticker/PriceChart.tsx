import React, { useMemo } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { Svg, Path, Defs, LinearGradient, Stop, Rect } from "../../lib/svg";
import { Text } from "../ui/Text";
import { Colors } from "../../constants/theme";
import type { StockChartBar } from "@trading/shared/src/stockTypes";

interface Props {
  bars: StockChartBar[];
  loading?: boolean;
  width: number;
  height?: number;
  positive?: boolean; // true = green, false = red
}

const CHART_HEIGHT = 180;
const VOLUME_HEIGHT = 40;
const PADDING_X = 4;
const PADDING_Y = 12;

export function PriceChart({ bars, loading, width, height = CHART_HEIGHT, positive = true }: Props) {
  const chartData = useMemo(() => {
    if (bars.length < 2) return null;

    const closes = bars.map((b) => b.close);
    const volumes = bars.map((b) => b.volume);
    const minP = Math.min(...closes);
    const maxP = Math.max(...closes);
    const maxV = Math.max(...volumes, 1);
    const rangeP = maxP - minP || 1;

    const w = width - PADDING_X * 2;
    const h = height - PADDING_Y * 2;
    const stepX = w / (closes.length - 1);

    // Price line path
    const points = closes.map((c, i) => ({
      x: PADDING_X + i * stepX,
      y: PADDING_Y + h - ((c - minP) / rangeP) * h,
    }));

    let linePath = `M ${points[0]!.x} ${points[0]!.y}`;
    for (let i = 1; i < points.length; i++) {
      linePath += ` L ${points[i]!.x} ${points[i]!.y}`;
    }

    // Area fill path
    const areaPath = `${linePath} L ${points[points.length - 1]!.x} ${height} L ${points[0]!.x} ${height} Z`;

    // Volume bars
    const barWidth = Math.max(1, stepX * 0.6);
    const volBars = volumes.map((v, i) => ({
      x: PADDING_X + i * stepX - barWidth / 2,
      h: (v / maxV) * VOLUME_HEIGHT,
    }));

    return { linePath, areaPath, volBars, barWidth, minP, maxP };
  }, [bars, width, height]);

  if (loading) {
    return (
      <View style={[styles.container, { height: height + VOLUME_HEIGHT }]}>
        <ActivityIndicator size="small" color={Colors.taroEssence} />
      </View>
    );
  }

  if (!chartData) {
    return (
      <View style={[styles.container, { height: height + VOLUME_HEIGHT }]}>
        <Text variant="caption" color={Colors.midGrayText}>차트 데이터 없음</Text>
      </View>
    );
  }

  const lineColor = positive ? Colors.taroEssence : "#f43f5e";
  const gradientId = positive ? "areaGradientGreen" : "areaGradientRed";

  return (
    <View style={styles.wrapper}>
      {/* Price chart */}
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lineColor} stopOpacity="0.25" />
            <Stop offset="1" stopColor={lineColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={chartData.areaPath} fill={`url(#${gradientId})`} />
        <Path d={chartData.linePath} stroke={lineColor} strokeWidth={1.5} fill="none" />
      </Svg>

      {/* Volume bars */}
      <Svg width={width} height={VOLUME_HEIGHT} viewBox={`0 0 ${width} ${VOLUME_HEIGHT}`}>
        {chartData.volBars.map((bar, i) => (
          <Rect
            key={i}
            x={bar.x}
            y={VOLUME_HEIGHT - bar.h}
            width={chartData.barWidth}
            height={bar.h}
            fill={Colors.ironOutline}
            opacity={0.5}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { },
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
