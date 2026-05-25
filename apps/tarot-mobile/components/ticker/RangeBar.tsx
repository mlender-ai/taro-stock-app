import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "../ui/Text";
import { Colors } from "../../constants/theme";

interface Props {
  label: string;
  min: number;
  max: number;
  current: number;
  formatValue?: (v: number) => string;
}

export function RangeBar({ label, min, max, current, formatValue }: Props) {
  const range = max - min;
  const position = range > 0 ? Math.max(0, Math.min(1, (current - min) / range)) : 0.5;
  const fmt = formatValue ?? ((v: number) => v.toLocaleString());

  return (
    <View style={styles.container}>
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
    gap: 6,
  },
  label: {
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
