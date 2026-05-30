import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "../ui/Text";
import { Colors } from "../../constants/theme";

interface Props {
  label: string;
  min: number | null | undefined;
  max: number | null | undefined;
  current: number | null | undefined;
  formatValue?: (v: number) => string;
}

/** 숫자가 유효한지 판단 — null, undefined, NaN, Infinity 모두 거부 */
function isValidNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function RangeBar({ label, min, max, current, formatValue }: Props) {
  const fmt = formatValue ?? ((v: number) => v.toLocaleString());
  const PLACEHOLDER = "—";

  // 결측치 안전 렌더: min, max, current 중 하나라도 유효하지 않으면 비활성 표시
  const hasValidData = isValidNum(min) && isValidNum(max) && isValidNum(current);

  if (!hasValidData) {
    return (
      <View style={styles.container}>
        <Text variant="caption" color={Colors.midGrayText} style={styles.label}>{label}</Text>
        <View style={styles.barContainer}>
          <Text variant="caption" color={Colors.midGrayText} style={styles.minMax}>{PLACEHOLDER}</Text>
          <View style={styles.track}>
            <View style={styles.trackFill} />
          </View>
          <Text variant="caption" color={Colors.midGrayText} style={styles.minMax}>{PLACEHOLDER}</Text>
        </View>
      </View>
    );
  }

  const range = max - min;
  const position = range > 0 ? Math.max(0, Math.min(1, (current - min) / range)) : 0.5;

  return (
    <View style={styles.container}>
      {/* 라벨은 보조 정보 — 11pt, 미드 그레이로 가독성보다 부담 줄임 (토스 패턴: 주변 정보 위계 낮춤) */}
      <Text variant="caption" color={Colors.midGrayText} style={styles.label}>{label}</Text>
      <View style={styles.barContainer}>
        <Text variant="caption" color={Colors.midGrayText} style={styles.minMax}>{fmt(min)}</Text>
        <View style={styles.track}>
          <View style={styles.trackFill} />
          <View style={[styles.dot, { left: `${position * 100}%` }]} />
        </View>
        <Text variant="caption" color={Colors.midGrayText} style={styles.minMax}>{fmt(max)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  barContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  minMax: {
    fontSize: 11,
    minWidth: 48,
  },
  track: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.carbonBorder,
    borderRadius: 2,
    position: "relative",
  },
  trackFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.carbonBorder,
    borderRadius: 2,
  },
  dot: {
    position: "absolute",
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.taroEssence,
    marginLeft: -6,
  },
});
