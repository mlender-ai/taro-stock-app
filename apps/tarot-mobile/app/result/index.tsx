import { useRef, useEffect } from "react";
import {
  SafeAreaView, View, ScrollView, TouchableOpacity,
  StyleSheet, Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { Text } from "../../components/ui/Text";
import { Button } from "../../components/ui/Button";
import { Colors, Spacing, Radius } from "../../constants/theme";
import { useDrawStore, type DrawnCard } from "../../lib/drawStore";

const DISCLAIMER = "본 해석은 오락 목적으로 제공되며 투자 조언이 아닙니다. 투자 결정은 본인의 판단과 책임 하에 이루어져야 합니다.";

function CardReveal({ card, index }: { card: DrawnCard; index: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, delay: index * 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, delay: index * 200, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.cardReveal, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardThumb}>
          <Text style={styles.cardThumSymbol}>{card.symbol}</Text>
        </View>
        <View style={styles.cardMeta}>
          <Text variant="subheading">{card.name}</Text>
          <Text variant="body-sm">{card.nameKo}</Text>
          {card.isReversed && (
            <View style={styles.reversedBadge}>
              <Text variant="caption" color={Colors.taroEssence}>역방향</Text>
            </View>
          )}
        </View>
      </View>

      <Text variant="heading" style={styles.headline}>{card.headline}</Text>
      <Text variant="body-sm" style={styles.summary}>{card.summary}</Text>
      <Text variant="body-sm" style={styles.detail}>{card.detail}</Text>
    </Animated.View>
  );
}

export default function ResultScreen() {
  const router = useRouter();
  const { result, reset } = useDrawStore();

  if (!result) {
    router.replace("/(tabs)");
    return null;
  }

  const handleDrawAgain = () => {
    reset();
    router.replace("/(tabs)/draw");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text variant="body-sm" color={Colors.midGrayText}>← 뒤로</Text>
          </TouchableOpacity>
        </View>

        {/* 종목 + 날짜 */}
        <View style={styles.meta}>
          <Text variant="caption" color={Colors.taroEssence} style={styles.spreadLabel}>
            {result.spread === "single" ? "1장 스프레드" : "3장 스프레드"}
          </Text>
          <Text variant="heading" style={styles.tickerTitle}>
            {result.tickerName}
          </Text>
          <Text variant="caption" color={Colors.ironOutline}>{result.ticker}</Text>
        </View>

        {/* 카드들 */}
        <View style={styles.cards}>
          {result.cards.map((card, i) => (
            <CardReveal key={card.id} card={card} index={i} />
          ))}
        </View>

        {/* 면책 고지 */}
        <View style={styles.disclaimer}>
          <Text variant="caption" color={Colors.ironOutline} style={styles.disclaimerText}>
            ⚠ {DISCLAIMER}
          </Text>
        </View>

        {/* 액션 버튼 */}
        <View style={styles.actions}>
          <Button variant="primary" label="다시 뽑기" onPress={handleDrawAgain} />
          <Button
            variant="secondary"
            label="홈으로"
            onPress={() => { reset(); router.replace("/(tabs)"); }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.ebonyCanvas },
  scroll:         { paddingHorizontal: Spacing.s24, paddingBottom: 48 },
  header:         { paddingTop: Spacing.s16, marginBottom: Spacing.s16 },
  backBtn:        { alignSelf: "flex-start", padding: 4 },
  meta:           { marginBottom: Spacing.s32, gap: 4 },
  spreadLabel:    { letterSpacing: 1, marginBottom: 4 },
  tickerTitle:    { color: Colors.whiteout },
  cards:          { gap: 16, marginBottom: Spacing.s24 },
  cardReveal:     { backgroundColor: Colors.graphiteBase, borderRadius: Radius.card, padding: Spacing.s24, borderWidth: 1, borderColor: Colors.carbonBorder },
  cardHeader:     { flexDirection: "row", gap: 16, marginBottom: Spacing.s16 },
  cardThumb:      { width: 56, height: 80, backgroundColor: Colors.ebonyCanvas, borderRadius: 8, borderWidth: 1, borderColor: Colors.taroEssence, alignItems: "center", justifyContent: "center" },
  cardThumSymbol: { fontSize: 14, color: Colors.taroEssence, fontWeight: "700" },
  cardMeta:       { flex: 1, justifyContent: "center", gap: 2 },
  reversedBadge:  { marginTop: 4, alignSelf: "flex-start", borderWidth: 1, borderColor: Colors.taroEssence, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  headline:       { color: Colors.whiteout, marginBottom: Spacing.s8 },
  summary:        { color: Colors.silverHighlight, marginBottom: Spacing.s8 },
  detail:         { color: Colors.midGrayText, lineHeight: 22 },
  disclaimer:     { backgroundColor: Colors.steelSurface, borderRadius: 10, padding: Spacing.s16, marginBottom: Spacing.s24, borderWidth: 1, borderColor: Colors.carbonBorder },
  disclaimerText: { lineHeight: 18 },
  actions:        { gap: 12 },
});
