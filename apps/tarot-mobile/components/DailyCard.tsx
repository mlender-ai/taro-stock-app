import React, { useEffect, useState, useRef } from "react";
import { View, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "./ui/Text";
import { Colors, Spacing, Radius } from "../constants/theme";
import { apiFetch } from "../lib/api";
import { useUserStore } from "../lib/store";

interface DailyCardData {
  id: number;
  name: string;
  nameKo: string;
  symbol: string;
  message: string;
  isReversed: boolean;
}

export function DailyCard() {
  const router = useRouter();
  const { isLoggedIn } = useUserStore();
  const [card, setCard] = useState<DailyCardData | null>(null);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 오늘 이미 뽑았는지 확인
    apiFetch<{ available: boolean; drawnToday: boolean }>("/api/tarot/daily-card")
      .then((data) => setAvailable(data.available))
      .catch(() => {});
  }, []);

  const handleDraw = async () => {
    if (!available || loading) return;
    setLoading(true);
    try {
      const data = await apiFetch<{ card: DailyCardData; success: boolean }>(
        "/api/tarot/daily-card",
        { method: "POST" }
      );
      if (data.success) {
        setCard(data.card);
        setAvailable(false);
        // 카드 뒤집기 애니메이션
        Animated.timing(flipAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }
    } catch {
      // 비로그인 또는 이미 뽑음
    } finally {
      setLoading(false);
    }
  };

  // 카드 뽑기 전 상태
  if (!card) {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={available ? handleDraw : () => router.push("/(tabs)/draw")}
        activeOpacity={0.8}
      >
        <View style={styles.cardBack}>
          <Text style={styles.cardBackSymbol}>✦</Text>
        </View>
        <View style={styles.textArea}>
          <Text variant="caption" color={Colors.taroEssence} style={styles.label}>
            오늘의 무료 카드
          </Text>
          <Text variant="body-sm" color={Colors.silverHighlight}>
            {available
              ? (isLoggedIn ? "탭하여 오늘의 카드를 뽑아보세요" : "로그인하고 무료 카드를 뽑아보세요")
              : "내일 다시 뽑을 수 있어요"
            }
          </Text>
        </View>
        <Text variant="caption" color={Colors.ironOutline}>→</Text>
      </TouchableOpacity>
    );
  }

  // 카드 뽑기 후 상태
  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["90deg", "0deg"],
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push("/(tabs)/draw")}
      activeOpacity={0.8}
    >
      <Animated.View style={[styles.cardFront, { transform: [{ rotateY: frontRotate }] }]}>
        <Text style={styles.cardFrontSymbol}>{card.symbol}</Text>
        {card.isReversed && <Text style={styles.reversedMark}>▽</Text>}
      </Animated.View>
      <View style={styles.textArea}>
        <View style={styles.cardNameRow}>
          <Text variant="caption" color={Colors.taroEssence} style={styles.label}>
            오늘의 카드
          </Text>
          <Text variant="caption" color={Colors.midGrayText}>
            {card.nameKo}
            {card.isReversed ? " (역방향)" : ""}
          </Text>
        </View>
        <Text variant="body-sm" color={Colors.silverHighlight} numberOfLines={2} style={styles.message}>
          {card.message}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.voidGreen,
    borderRadius: 14,
    padding: 16,
    marginBottom: Spacing.s24,
    borderWidth: 1,
    borderColor: Colors.deepInsight,
    gap: 12,
  },
  cardBack: {
    width: 44,
    height: 60,
    borderRadius: 8,
    backgroundColor: Colors.arcaneCta,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.taroEssence,
  },
  cardBackSymbol: {
    fontSize: 20,
    color: Colors.taroEssence,
  },
  cardFront: {
    width: 44,
    height: 60,
    borderRadius: 8,
    backgroundColor: Colors.ebonyCanvas,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.taroEssence,
    gap: 2,
  },
  cardFrontSymbol: {
    fontSize: 16,
    color: Colors.taroEssence,
    fontWeight: "700",
  },
  reversedMark: {
    fontSize: 8,
    color: Colors.ironOutline,
  },
  textArea: {
    flex: 1,
    gap: 4,
  },
  label: {
    letterSpacing: 0.5,
    fontWeight: "700",
  },
  cardNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  message: {
    lineHeight: 18,
  },
});
