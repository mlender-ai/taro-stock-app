import React from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "../ui/Text";
import { Colors, Spacing, Radius } from "../../constants/theme";
import { useDrawStore } from "../../lib/drawStore";
import { useStockStore } from "../../lib/stockStore";

interface Props {
  symbol: string;
  /** 가장 빈도 높은 뉴스 카테고리 — 카피 개인화 (선택). */
  topCategory?: string;
}

// 카테고리별 카피 — 뉴스 맥락을 카드 뽑기 동기로 이어주기 위함 (PM #263).
// 단정형/투자조언 금칙어 회피.
const CATEGORY_HOOKS: Record<string, string> = {
  "실적": "실적 발표 직후의 흐름, 타로로 읽어볼까요?",
  "M&A": "큰 변화의 신호, 타로가 어떻게 보는지 궁금하지 않으세요?",
  "애널리스트": "전문가 시선 너머의 흐름, 타로로 들여다보기",
  "주주환원": "주주환원 발표 흐름, 타로 카드로 해석해 보세요",
  "경영진": "리더십 변화의 의미, 타로의 상징으로 풀어보기",
  "규제/소송": "외부 변수 속 흐름, 타로가 어떤 신호를 보일지",
  "기술": "기술 혁신의 흐름, 카드로 해석해 보세요",
  "거시경제": "거시 흐름 속 이 종목, 타로의 시선으로",
  "시장": "오늘의 흐름, 타로로 들여다보기",
};
const DEFAULT_HOOK = "이 종목의 흐름, 타로로 풀어볼까요?";

export function NewsTarotCta({ symbol, topCategory }: Props) {
  const router = useRouter();
  const { setTicker } = useDrawStore();
  const { quote } = useStockStore();

  const hook = (topCategory && CATEGORY_HOOKS[topCategory]) || DEFAULT_HOOK;

  const handlePress = () => {
    setTicker(symbol, quote?.shortName ?? symbol);
    router.push("/(tabs)/draw");
  };

  return (
    <TouchableOpacity style={styles.row} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.left}>
        <Text style={styles.icon}>🔮</Text>
        <View style={styles.textCol}>
          <Text variant="body-sm" color={Colors.whiteout} style={styles.title}>
            {hook}
          </Text>
          <Text variant="caption" color={Colors.midGrayText}>
            {symbol} · 1장 또는 3장 스프레드
          </Text>
        </View>
      </View>
      <Text variant="body-sm" color={Colors.taroEssence} style={styles.arrow}>
        ›
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    gap: 12,
    backgroundColor: Colors.voidGreen,
    borderTopWidth: 1,
    borderTopColor: Colors.carbonBorder,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  icon: {
    fontSize: 22,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontWeight: "600",
  },
  arrow: {
    fontSize: 24,
    marginLeft: Spacing.s8,
  },
});

// 사용처에서 사용 — 라디우스 일치를 위해 호출 부에서 카드 안에 배치 권장.
NewsTarotCta.displayName = "NewsTarotCta";
export const NEWS_CTA_BORDER_RADIUS = Radius.cards;
