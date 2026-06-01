import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "./Text";
import { Colors, Spacing, Radius } from "../../constants/theme";

interface Props {
  // 섹션 라벨 (없으면 라벨 줄 생략)
  label?: string;
  // 폴백 안내 문구
  message?: string;
  onRetry: () => void;
}

// API 결측/실패 시 보여주는 인라인 폴백 + 재시도 UI.
// 네트워크 의존 위젯이 조용히 null을 반환하는 대신 사용자에게 상태를 알리고 재시도 경로를 제공한다.
export function DataFetchError({ label, message, onRetry }: Props) {
  return (
    <View style={styles.container}>
      {label ? (
        <Text variant="caption" color={Colors.midGrayText} style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View style={styles.card}>
        <Text variant="body-sm" color={Colors.midGrayText} style={styles.message}>
          {message ?? "정보를 불러오지 못했어요"}
        </Text>
        <TouchableOpacity onPress={onRetry} activeOpacity={0.7} style={styles.retryBtn}>
          <Text variant="caption" color={Colors.taroEssence} style={styles.retryText}>
            다시 시도
          </Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: Colors.graphiteBase,
    borderRadius: Radius.cards,
    borderWidth: 1,
    borderColor: Colors.carbonBorder,
    paddingVertical: Spacing.s24,
    paddingHorizontal: Spacing.s16,
    alignItems: "center",
    gap: 12,
  },
  message: {
    textAlign: "center",
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: Colors.deepInsight,
    backgroundColor: Colors.voidGreen,
  },
  retryText: {
    fontWeight: "700",
  },
});
