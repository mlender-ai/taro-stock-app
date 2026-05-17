import { useState, useRef } from "react";
import {
  SafeAreaView, View, TouchableOpacity, Animated,
  StyleSheet, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Text } from "../../components/ui/Text";
import { Button } from "../../components/ui/Button";
import { Colors, Spacing, Radius } from "../../constants/theme";
import { useDrawStore, getMockResult, type SpreadType } from "../../lib/drawStore";
import { useUserStore } from "../../lib/store";

const SPREAD_OPTIONS: { type: SpreadType; label: string; desc: string; cost: number }[] = [
  { type: "single",     label: "1장",  desc: "핵심 흐름",    cost: 1 },
  { type: "three-card", label: "3장",  desc: "과거·현재·미래", cost: 3 },
];

function CardBack({ flipped, delay }: { flipped: boolean; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  if (flipped) {
    Animated.timing(anim, {
      toValue: 1,
      duration: 600,
      delay,
      useNativeDriver: true,
    }).start();
  }

  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });

  return (
    <Animated.View style={[styles.card, { transform: [{ rotateY: rotate }] }]}>
      <Text style={styles.cardSymbol}>✦</Text>
    </Animated.View>
  );
}

export default function DrawScreen() {
  const router = useRouter();
  const { spread, ticker, tickerName, isDrawing, setSpread, setDrawing, setResult } = useDrawStore();
  const { credits } = useUserStore();
  const [phase, setPhase] = useState<"select" | "flipping" | "done">("select");

  const selectedOption = SPREAD_OPTIONS.find((o) => o.type === spread)!;
  const canDraw = credits >= selectedOption.cost || true; // mock: 항상 허용

  const handleDraw = async () => {
    if (isDrawing) return;
    setDrawing(true);
    setPhase("flipping");

    // 카드 뒤집기 애니메이션 시간 대기
    await new Promise((r) => setTimeout(r, 1200));

    const result = getMockResult(ticker || "AAPL", tickerName || "Apple Inc.", spread);
    setResult(result);
    setDrawing(false);
    setPhase("done");

    // 결과 화면으로 이동
    setTimeout(() => router.push("/result"), 400);
  };

  const cardCount = spread === "single" ? 1 : 3;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text variant="body-sm" color={Colors.midGrayText}>← 뒤로</Text>
          </TouchableOpacity>
          <View style={styles.creditBadge}>
            <Text variant="caption" color={Colors.taroEssence}>✦ {credits} 크레딧</Text>
          </View>
        </View>

        {/* 종목 */}
        <View style={styles.tickerRow}>
          <Text variant="subheading" color={Colors.whiteout}>
            {tickerName || "종목 미선택"}
          </Text>
          {ticker ? (
            <Text variant="caption" color={Colors.taroEssence}>{ticker}</Text>
          ) : null}
        </View>

        {/* 스프레드 선택 */}
        <View style={styles.spreadRow}>
          {SPREAD_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.type}
              style={[styles.spreadOpt, spread === opt.type && styles.spreadOptActive]}
              onPress={() => setSpread(opt.type)}
              disabled={phase !== "select"}
            >
              <Text
                variant="heading"
                color={spread === opt.type ? Colors.taroEssence : Colors.midGrayText}
              >
                {opt.label}
              </Text>
              <Text
                variant="caption"
                color={spread === opt.type ? Colors.taroEssence : Colors.ironOutline}
              >
                {opt.desc}
              </Text>
              <Text
                variant="caption"
                color={spread === opt.type ? Colors.taroEssence : Colors.ironOutline}
              >
                {opt.cost} 크레딧
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 카드 영역 */}
        <View style={styles.cardsArea}>
          <View style={styles.cardsRow}>
            {Array.from({ length: cardCount }).map((_, i) => (
              <CardBack key={i} flipped={phase === "flipping" || phase === "done"} delay={i * 200} />
            ))}
          </View>
          {phase === "flipping" && (
            <ActivityIndicator color={Colors.taroEssence} style={{ marginTop: 16 }} />
          )}
          {phase === "select" && (
            <Text variant="body-sm" style={styles.hint}>
              카드를 집중하여 바라보세요
            </Text>
          )}
        </View>

        {/* CTA */}
        <View style={styles.ctaArea}>
          {!ticker && (
            <Text variant="caption" color={Colors.midGrayText} style={styles.noTickerHint}>
              홈에서 종목을 선택하면 해당 종목으로 해석됩니다
            </Text>
          )}
          <Button
            variant="primary"
            label={phase === "select" ? `카드 뽑기 (${selectedOption.cost} 크레딧)` : "해석 중..."}
            loading={isDrawing}
            disabled={phase !== "select"}
            onPress={handleDraw}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.ebonyCanvas },
  inner:          { flex: 1, paddingHorizontal: Spacing.s24, paddingTop: Spacing.s16 },
  header:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.s24 },
  backBtn:        { padding: 4 },
  creditBadge:    { borderWidth: 1, borderColor: Colors.deepInsight, borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 4 },
  tickerRow:      { marginBottom: Spacing.s24, gap: 4 },
  spreadRow:      { flexDirection: "row", gap: 12, marginBottom: Spacing.s32 },
  spreadOpt:      { flex: 1, alignItems: "center", paddingVertical: Spacing.s16, backgroundColor: Colors.graphiteBase, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.carbonBorder, gap: 4 },
  spreadOptActive:{ borderColor: Colors.taroEssence, backgroundColor: Colors.voidGreen },
  cardsArea:      { flex: 1, alignItems: "center", justifyContent: "center" },
  cardsRow:       { flexDirection: "row", gap: 12 },
  card:           { width: 80, height: 128, backgroundColor: Colors.graphiteBase, borderRadius: 10, borderWidth: 1, borderColor: Colors.taroEssence, alignItems: "center", justifyContent: "center" },
  cardSymbol:     { fontSize: 28, color: Colors.taroEssence },
  hint:           { marginTop: 16, color: Colors.ironOutline, textAlign: "center" },
  ctaArea:        { paddingBottom: Spacing.s32, gap: 12 },
  noTickerHint:   { textAlign: "center" },
});
