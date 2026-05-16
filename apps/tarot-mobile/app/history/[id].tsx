import { useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Colors } from "../../constants/colors";
import { useHistoryStore } from "../../lib/historyStore";

function formatFullDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function slotLabel(slot: string | null): string {
  if (slot === "past") return "과거";
  if (slot === "present") return "현재";
  if (slot === "future") return "미래";
  return "";
}

export default function HistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { detail, detailLoading, fetchDetail } = useHistoryStore();

  useEffect(() => {
    if (id) fetchDetail(id);
  }, [id, fetchDetail]);

  if (detailLoading || !detail) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← 기록</Text>
          </TouchableOpacity>
          <Text style={styles.dateText}>{formatFullDate(detail.createdAt)}</Text>
        </View>

        {/* 종목 정보 */}
        <View style={styles.tickerSection}>
          <View style={styles.tickerRow}>
            <Text style={styles.ticker}>{detail.ticker}</Text>
            <Text style={styles.marketBadge}>{detail.market}</Text>
            <Text style={styles.spreadType}>
              {detail.spread === "SINGLE" ? "1장 스프레드" : "3장 스프레드"}
            </Text>
          </View>
        </View>

        {/* 해석 헤드라인 */}
        <View style={styles.headlineSection}>
          <Text style={styles.headlineSymbol}>✦</Text>
          <Text style={styles.headline}>{detail.headline}</Text>
        </View>

        {/* 카드들 */}
        <View style={styles.cardsSection}>
          <Text style={styles.sectionTitle}>뽑힌 카드</Text>
          <View style={styles.cardsGrid}>
            {detail.cards.map((dc) => (
              <View key={dc.cardId + dc.position} style={styles.cardItem}>
                <View style={styles.cardNumberBox}>
                  <Text style={styles.cardNumber}>{dc.card.number}</Text>
                </View>
                <View style={styles.cardInfo}>
                  {dc.slot && (
                    <Text style={styles.slotLabel}>{slotLabel(dc.slot)}</Text>
                  )}
                  <Text style={styles.cardNameKo}>{dc.card.nameKo}</Text>
                  <Text style={styles.cardNameEn}>{dc.card.name}</Text>
                  <Text
                    style={[
                      styles.orientationBadge,
                      dc.orientation === "reversed" && styles.orientationReversed,
                    ]}
                  >
                    {dc.orientation === "upright" ? "↑ 정방향" : "↓ 역방향"}
                  </Text>
                </View>
                <View style={styles.cardMeaning}>
                  <Text style={styles.meaningText}>
                    {dc.orientation === "upright"
                      ? dc.card.meaningUpright
                      : dc.card.meaningReversed}
                  </Text>
                  <View style={styles.keywordsRow}>
                    {dc.card.keywordsKo.slice(0, 3).map((kw: string) => (
                      <Text key={kw} style={styles.keyword}>
                        {kw}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 요약 */}
        <View style={styles.interpretSection}>
          <Text style={styles.sectionTitle}>해석 요약</Text>
          <Text style={styles.summary}>{detail.summary}</Text>
        </View>

        {/* 상세 해석 */}
        <View style={styles.interpretSection}>
          <Text style={styles.sectionTitle}>상세 해석</Text>
          <Text style={styles.detailText}>{detail.detail}</Text>
        </View>

        {/* 면책 고지 */}
        <View style={styles.disclaimerSection}>
          <Text style={styles.disclaimerText}>
            이 해석은 투자 조언이 아닙니다. 투자 결정은 본인의 판단과 책임 하에
            이루어져야 합니다.
          </Text>
        </View>

        {/* 메타 정보 */}
        <View style={styles.metaSection}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>소스</Text>
            <Text style={styles.metaValue}>
              {detail.source === "LLM"
                ? "AI 실시간"
                : detail.source === "CACHE"
                  ? "캐시"
                  : "폴백"}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>비용</Text>
            <Text style={styles.metaValue}>{detail.creditCost} 크레딧</Text>
          </View>
        </View>

        {/* 피드백 */}
        {detail.feedbacks.length > 0 && (
          <View style={styles.feedbackSection}>
            <Text style={styles.sectionTitle}>내 피드백</Text>
            {detail.feedbacks.map((fb, i) => (
              <View key={i} style={styles.feedbackItem}>
                <Text style={styles.feedbackRating}>
                  {ratingToStars(fb.rating)}
                </Text>
                {fb.comment && (
                  <Text style={styles.feedbackComment}>{fb.comment}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ratingToStars(rating: string): string {
  const map: Record<string, string> = {
    FIVE: "★★★★★",
    FOUR: "★★★★☆",
    THREE: "★★★☆☆",
    TWO: "★★☆☆☆",
    ONE: "★☆☆☆☆",
  };
  return map[rating] ?? rating;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingBottom: 40 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: { paddingVertical: 4 },
  backText: { fontSize: 14, color: Colors.accent },
  dateText: { fontSize: 11, color: Colors.muted },

  // Ticker
  tickerSection: { paddingHorizontal: 20, paddingBottom: 12 },
  tickerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  ticker: { fontSize: 24, fontWeight: "800", color: Colors.text, letterSpacing: -1 },
  marketBadge: {
    fontSize: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.06)",
    color: Colors.muted,
    overflow: "hidden",
  },
  spreadType: { fontSize: 12, color: Colors.gold },

  // Headline
  headlineSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 18,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  headlineSymbol: { fontSize: 20, color: Colors.gold, marginBottom: 8 },
  headline: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
    letterSpacing: -0.3,
  },

  // Cards
  cardsSection: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  cardsGrid: { gap: 10 },
  cardItem: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 14,
    flexDirection: "column",
    gap: 8,
  },
  cardNumberBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "rgba(124, 92, 191, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardNumber: { fontSize: 12, fontWeight: "700", color: Colors.accent },
  cardInfo: { gap: 2 },
  slotLabel: { fontSize: 10, color: Colors.gold, fontWeight: "600" },
  cardNameKo: { fontSize: 16, fontWeight: "700", color: Colors.text },
  cardNameEn: { fontSize: 11, color: Colors.muted },
  orientationBadge: {
    fontSize: 11,
    color: Colors.success,
    marginTop: 2,
  },
  orientationReversed: { color: Colors.error },
  cardMeaning: { marginTop: 4 },
  meaningText: { fontSize: 12, color: Colors.text, lineHeight: 18, opacity: 0.8 },
  keywordsRow: { flexDirection: "row", gap: 4, marginTop: 6, flexWrap: "wrap" },
  keyword: {
    fontSize: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.05)",
    color: Colors.muted,
    overflow: "hidden",
  },

  // Interpretation
  interpretSection: { paddingHorizontal: 20, marginBottom: 20 },
  summary: { fontSize: 14, color: Colors.text, lineHeight: 22 },
  detailText: { fontSize: 13, color: Colors.text, lineHeight: 21, opacity: 0.85 },

  // Disclaimer
  disclaimerSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.2)",
    backgroundColor: "rgba(201,168,76,0.06)",
  },
  disclaimerText: { fontSize: 11, color: Colors.gold, lineHeight: 16, textAlign: "center" },

  // Meta
  metaSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 6,
  },
  metaRow: { flexDirection: "row", justifyContent: "space-between" },
  metaLabel: { fontSize: 12, color: Colors.muted },
  metaValue: { fontSize: 12, color: Colors.text },

  // Feedback
  feedbackSection: { paddingHorizontal: 20, marginBottom: 20 },
  feedbackItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  feedbackRating: { fontSize: 14, color: Colors.gold },
  feedbackComment: { fontSize: 12, color: Colors.text, opacity: 0.7 },
});
