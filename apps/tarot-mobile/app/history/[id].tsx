import { useEffect } from "react";
import { SafeAreaView, ScrollView, View, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text } from "../../components/ui/Text";
import { Colors, Spacing } from "../../constants/theme";
import { useHistoryStore } from "../../lib/historyStore";


function slotLabel(slot: string | null) {
  if (slot === "past") return "과거";
  if (slot === "present") return "현재";
  if (slot === "future") return "미래";
  return "";
}

function ratingToStars(rating: string) {
  return { FIVE: "★★★★★", FOUR: "★★★★☆", THREE: "★★★☆☆", TWO: "★★☆☆☆", ONE: "★☆☆☆☆" }[rating] ?? rating;
}

export default function HistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { detail, detailLoading, fetchDetail } = useHistoryStore();

  const data = detail;

  useEffect(() => {
    if (id) fetchDetail(id as string);
  }, [id]);

  if (detailLoading && !data) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={Colors.taroEssence} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text variant="body-sm" color={Colors.midGrayText}>기록을 찾을 수 없습니다</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
            <Text variant="body-sm" color={Colors.taroEssence}>← 돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text variant="body-sm" color={Colors.midGrayText}>← 기록</Text>
          </TouchableOpacity>
          <Text variant="caption" color={Colors.ironOutline}>
            {new Date(data.createdAt).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>

        {/* 종목 + 스프레드 */}
        <View style={styles.tickerRow}>
          <Text variant="heading-lg" color={Colors.whiteout}>{data.ticker}</Text>
          <View style={styles.badges}>
            <View style={styles.badge}><Text variant="caption" color={Colors.midGrayText}>{data.market}</Text></View>
            <View style={[styles.badge, styles.badgeGreen]}>
              <Text variant="caption" color={Colors.taroEssence}>{data.spread === "SINGLE" ? "1장" : "3장"}</Text>
            </View>
          </View>
        </View>

        {/* 헤드라인 */}
        <View style={styles.headlineBox}>
          <Text style={styles.headlineSymbol}>✦</Text>
          <Text variant="subheading" style={styles.headline}>{data.headline}</Text>
        </View>

        {/* 카드들 */}
        <Text variant="caption" color={Colors.midGrayText} style={styles.sectionLabel}>뽑힌 카드</Text>
        {data.cards.map((dc: any) => (
          <View key={dc.cardId + dc.position} style={styles.cardItem}>
            <View style={styles.cardTop}>
              <View style={styles.cardNumBox}>
                <Text style={styles.cardNum}>{dc.card.number}</Text>
              </View>
              <View style={styles.cardInfo}>
                {dc.slot && <Text variant="caption" color={Colors.taroEssence}>{slotLabel(dc.slot)}</Text>}
                <Text variant="subheading" color={Colors.whiteout}>{dc.card.nameKo}</Text>
                <Text variant="caption" color={Colors.midGrayText}>{dc.card.name}</Text>
                <Text variant="caption" color={dc.orientation === "upright" ? Colors.taroEssence : "#e0875a"}>
                  {dc.orientation === "upright" ? "↑ 정방향" : "↓ 역방향"}
                </Text>
              </View>
            </View>
            <Text variant="body-sm" style={styles.meaning}>
              {dc.orientation === "upright" ? dc.card.meaningUpright : dc.card.meaningReversed}
            </Text>
            <View style={styles.keywords}>
              {dc.card.keywordsKo.slice(0, 3).map((kw: string) => (
                <View key={kw} style={styles.kwChip}><Text variant="caption" color={Colors.midGrayText}>{kw}</Text></View>
              ))}
            </View>
          </View>
        ))}

        {/* 해석 */}
        <Text variant="caption" color={Colors.midGrayText} style={styles.sectionLabel}>요약</Text>
        <Text variant="body-sm" style={styles.interpretText}>{data.summary}</Text>
        <Text variant="caption" color={Colors.midGrayText} style={[styles.sectionLabel, { marginTop: Spacing.s16 }]}>상세 해석</Text>
        <Text variant="body-sm" style={styles.interpretText}>{data.detail}</Text>

        {/* 면책 고지 */}
        <View style={styles.disclaimer}>
          <Text variant="caption" color={Colors.ironOutline}>⚠ 투자 조언이 아닙니다. 모든 투자 결정은 본인의 판단과 책임 하에 이루어져야 합니다.</Text>
        </View>

        {/* 메타 */}
        <View style={styles.meta}>
          <View style={styles.metaRow}>
            <Text variant="caption" color={Colors.midGrayText}>소스</Text>
            <Text variant="caption" color={Colors.silverHighlight}>{data.source === "LLM" ? "AI 실시간" : data.source === "CACHE" ? "캐시" : "폴백"}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text variant="caption" color={Colors.midGrayText}>비용</Text>
            <Text variant="caption" color={Colors.silverHighlight}>{data.creditCost} 크레딧</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.ebonyCanvas },
  scroll:       { paddingHorizontal: Spacing.s24, paddingBottom: 48 },
  center:       { flex: 1, alignItems: "center", justifyContent: "center" },
  header:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: Spacing.s16, marginBottom: Spacing.s16 },
  tickerRow:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.s16 },
  badges:       { flexDirection: "row", gap: 6 },
  badge:        { borderWidth: 1, borderColor: Colors.carbonBorder, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeGreen:   { borderColor: Colors.deepInsight },
  headlineBox:  { backgroundColor: Colors.graphiteBase, borderRadius: 14, padding: Spacing.s24, borderWidth: 1, borderColor: Colors.carbonBorder, alignItems: "center", marginBottom: Spacing.s24 },
  headlineSymbol: { fontSize: 20, color: Colors.taroEssence, marginBottom: 8 },
  headline:     { color: Colors.whiteout, textAlign: "center" },
  sectionLabel: { letterSpacing: 0.5, marginBottom: Spacing.s8 },
  cardItem:     { backgroundColor: Colors.graphiteBase, borderRadius: 12, padding: Spacing.s16, borderWidth: 1, borderColor: Colors.carbonBorder, marginBottom: 10 },
  cardTop:      { flexDirection: "row", gap: 12, marginBottom: 10 },
  cardNumBox:   { width: 36, height: 36, borderRadius: 8, backgroundColor: Colors.voidGreen, alignItems: "center", justifyContent: "center" },
  cardNum:      { fontSize: 13, color: Colors.taroEssence, fontWeight: "700" },
  cardInfo:     { flex: 1, gap: 2 },
  meaning:      { color: Colors.silverHighlight, lineHeight: 20, marginBottom: 8 },
  keywords:     { flexDirection: "row", gap: 6 },
  kwChip:       { borderWidth: 1, borderColor: Colors.carbonBorder, borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 2 },
  interpretText:{ color: Colors.silverHighlight, lineHeight: 22, marginBottom: 8 },
  disclaimer:   { backgroundColor: Colors.steelSurface, borderRadius: 10, padding: Spacing.s16, marginTop: Spacing.s16, marginBottom: Spacing.s16, borderWidth: 1, borderColor: Colors.carbonBorder },
  meta:         { gap: 8, marginBottom: 8 },
  metaRow:      { flexDirection: "row", justifyContent: "space-between" },
});
