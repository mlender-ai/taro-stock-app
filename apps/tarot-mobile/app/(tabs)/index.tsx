import { SafeAreaView, View, StyleSheet } from "react-native";
import { Text } from "../../components/ui/Text";
import { Button } from "../../components/ui/Button";
import { Colors, Spacing } from "../../constants/theme";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text variant="caption" color={Colors.taroEssence}>TRADING TARO</Text>
          <View style={styles.creditBadge}>
            <Text variant="caption" color={Colors.taroEssence}>✦ 5 크레딧</Text>
          </View>
        </View>

        {/* 히어로 */}
        <View style={styles.hero}>
          <Text variant="heading-lg" style={styles.heroTitle}>
            오늘의 시장,{"\n"}
            <Text variant="heading-lg" color={Colors.taroEssence}>카드에 물어보세요</Text>
          </Text>
          <Text variant="body-sm" style={styles.heroSub}>
            AI가 분석한 시장 데이터를 타로 카드 해석으로 만나보세요
          </Text>
        </View>

        {/* 오늘의 이운 카드 미리보기 */}
        <View style={styles.todayCard}>
          <View style={styles.todayCardHeader}>
            <Text variant="caption" color={Colors.midGrayText}>오늘의 이운</Text>
            <Text variant="caption" color={Colors.taroEssence}>자세히 보기</Text>
          </View>
          <View style={styles.todayCardBody}>
            <View style={styles.cardThumb}>
              <Text style={styles.cardSymbol}>✦</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text variant="subheading">The Fool</Text>
              <Text variant="body-sm">광대</Text>
              <Text variant="caption" style={styles.mt8}>
                새로운 시작의 기운이 감지됩니다. 불확실성 속에서도 첫 걸음을 내딛을 용기가 필요한 시점입니다.
              </Text>
            </View>
          </View>
        </View>

        {/* 빠른 접근 */}
        <View style={styles.quickSection}>
          <Text variant="caption" color={Colors.midGrayText} style={styles.sectionLabel}>관심 종목</Text>
          <View style={styles.chipRow}>
            {["삼성전자", "SK하이닉스", "NVDA", "AAPL", "TSLA"].map((t) => (
              <View key={t} style={styles.chip}>
                <Text variant="caption" color={Colors.silverHighlight}>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        <Button
          variant="primary"
          label="카드 뽑기"
          style={styles.cta}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.ebonyCanvas },
  inner:           { flex: 1, paddingHorizontal: Spacing.s24, paddingTop: Spacing.s16 },
  header:          { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.s32 },
  creditBadge:     { borderWidth: 1, borderColor: Colors.deepInsight, borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 4 },
  hero:            { marginBottom: Spacing.s32 },
  heroTitle:       { color: Colors.whiteout, marginBottom: Spacing.s8 },
  heroSub:         { color: Colors.midGrayText },
  todayCard:       { backgroundColor: Colors.graphiteBase, borderRadius: 16, padding: Spacing.s24, marginBottom: Spacing.s24, borderWidth: 1, borderColor: Colors.carbonBorder },
  todayCardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.s16 },
  todayCardBody:   { flexDirection: "row", gap: Spacing.s16 },
  cardThumb:       { width: 60, height: 90, backgroundColor: Colors.ebonyCanvas, borderRadius: 8, borderWidth: 1, borderColor: Colors.taroEssence, alignItems: "center", justifyContent: "center" },
  cardSymbol:      { fontSize: 24, color: Colors.taroEssence },
  cardInfo:        { flex: 1 },
  mt8:             { marginTop: 8 },
  quickSection:    { marginBottom: Spacing.s32 },
  sectionLabel:    { marginBottom: Spacing.s8 },
  chipRow:         { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip:            { backgroundColor: Colors.graphiteBase, borderWidth: 1, borderColor: Colors.carbonBorder, borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 6 },
  cta:             { marginTop: "auto", marginBottom: Spacing.s16 },
});
