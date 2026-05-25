import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { Colors } from "../../constants/theme";

interface Props {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function Skeleton({ width = "100%", height = 16, borderRadius = 8, style }: Props) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as number, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function TickerDetailSkeleton() {
  return (
    <View style={styles.container}>
      {/* Ticker header */}
      <View style={styles.row}>
        <Skeleton width={48} height={48} borderRadius={12} />
        <View style={styles.textBlock}>
          <Skeleton width={120} height={20} />
          <Skeleton width={80} height={14} />
        </View>
      </View>

      {/* Price */}
      <Skeleton width={180} height={36} style={{ marginTop: 16 }} />
      <Skeleton width={120} height={18} style={{ marginTop: 8 }} />

      {/* Chart placeholder */}
      <Skeleton width="100%" height={180} style={{ marginTop: 24 }} borderRadius={12} />

      {/* Range tabs */}
      <View style={[styles.row, { marginTop: 16, gap: 12, justifyContent: "center" }]}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} width={48} height={32} borderRadius={16} />
        ))}
      </View>

      {/* Stats */}
      <View style={{ marginTop: 24, gap: 12 }}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.statRow}>
            <Skeleton width={80} height={14} />
            <Skeleton width={60} height={14} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.graphiteBase,
  },
  container: {
    padding: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  textBlock: {
    gap: 6,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
