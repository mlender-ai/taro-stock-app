import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "../ui/Text";
import { Colors, Spacing, Radius } from "../../constants/theme";
import { useDrawStore } from "../../lib/drawStore";

interface Props {
  symbol: string;
  tickerName?: string;
}

export function TarotCardRecommendation({ symbol, tickerName }: Props) {
  const router = useRouter();
  const { setTicker } = useDrawStore();

  const handlePress = () => {
    setTicker(symbol, tickerName ?? symbol);
    router.push("/draw");
  };

  return (
    <View style={styles.container}>
      <Text variant="caption" color={Colors.midGrayText} style={styles.label}>
        뉴스 관련 타로 카드 추천
      </Text>

      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.75}
      >
        <View style={styles.iconRow}>
          <Text style={styles.icon}>✦</Text>
          <View style={styles.textBlock}>
            <Text variant="body-sm" color={Colors.whiteout} style={styles.title}>
              이 뉴스를 타로로 해석해보세요
            </Text>
            <Text variant="caption" color={Colors.midGrayText} style={styles.desc}>
              {symbol} 종목 데이터와 카드를 연결해 투자 심리를 읽어드립니다.
            </Text>
          </View>
          <Text style={styles.arrow} color={Colors.taroEssence}>›</Text>
        </View>

        <View style={styles.ctaRow}>
          <View style={styles.ctaBadge}>
            <Text variant="caption" color={Colors.taroEssence} style={styles.ctaText}>
              카드 뽑기 →
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.s24,
  },
  label: {
    marginBottom: Spacing.s8,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.voidGreen,
    borderRadius: Radius.cards,
    borderWidth: 1,
    borderColor: Colors.deepInsight,
    padding: 16,
    gap: 12,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  icon: {
    fontSize: 24,
    color: Colors.taroEssence,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontWeight: "600",
    lineHeight: 20,
  },
  desc: {
    lineHeight: 18,
  },
  arrow: {
    fontSize: 20,
    color: Colors.taroEssence,
    fontWeight: "300",
  },
  ctaRow: {
    alignItems: "flex-start",
  },
  ctaBadge: {
    backgroundColor: Colors.arcaneCta,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  ctaText: {
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
