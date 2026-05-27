import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "../ui/Text";
import { Colors, Spacing } from "../../constants/theme";

interface Props {
  symbol: string;
  shortName: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  currency: string;
}

function formatPrice(price: number, currency: string): string {
  if (currency === "KRW") {
    return `₩${price.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}`;
  }
  return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// 토스증권 패턴: 스크롤 시 상단에 sticky로 노출되는 압축 헤더 (이름 + 가격 + 등락 알약)
export function CompactHeader({ symbol, shortName, currentPrice, change, changePercent, currency }: Props) {
  const isPositive = change >= 0;
  const priceColor = isPositive ? Colors.taroEssence : "#f43f5e";

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text variant="body-sm" color={Colors.whiteout} style={styles.name} numberOfLines={1}>
          {shortName || symbol}
        </Text>
      </View>
      <View style={styles.right}>
        <Text variant="body-sm" color={Colors.whiteout} style={styles.price}>
          {formatPrice(currentPrice, currency)}
        </Text>
        <View style={[styles.changeBadge, { backgroundColor: isPositive ? "rgba(62, 207, 142, 0.15)" : "rgba(244, 63, 94, 0.15)" }]}>
          <Text variant="caption" color={priceColor} style={styles.changeText}>
            {isPositive ? "+" : ""}{changePercent.toFixed(2)}%
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.s24,
    paddingVertical: 10,
    backgroundColor: Colors.ebonyCanvas,
    borderBottomWidth: 1,
    borderBottomColor: Colors.carbonBorder,
  },
  left: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontWeight: "600",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  price: {
    fontWeight: "700",
  },
  changeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  changeText: {
    fontWeight: "700",
  },
});
