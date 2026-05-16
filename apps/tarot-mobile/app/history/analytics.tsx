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
import { useRouter } from "expo-router";
import { Colors } from "../../constants/colors";
import { useUserStore } from "../../lib/store";
import { useHistoryStore } from "../../lib/historyStore";

function sourceLabel(source: string): string {
  if (source === "LLM") return "AI 실시간";
  if (source === "CACHE") return "캐시";
  return "폴백";
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const userId = useUserStore((s) => s.userId);
  const { analytics, analyticsLoading, fetchAnalytics } = useHistoryStore();

  useEffect(() => {
    if (userId) fetchAnalytics(userId);
  }, [userId, fetchAnalytics]);

  if (analyticsLoading || !analytics) {
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
          <Text style={styles.headerTitle}>내 분석</Text>
        </View>

        {/* 총 뽑기 수 */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>총 뽑기</Text>
          <Text style={styles.heroValue}>{analytics.totalDraws}</Text>
          <Text style={styles.heroSub}>회</Text>
        </View>

        {/* 스프레드 분포 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>스프레드 선호</Text>
          <View style={styles.barGroup}>
            {analytics.spreadBreakdown.map((s) => {
              const pct =
                analytics.totalDraws > 0
                  ? (s.count / analytics.totalDraws) * 100
                  : 0;
              return (
                <View key={s.spread} style={styles.barItem}>
                  <View style={styles.barLabelRow}>
                    <Text style={styles.barLabel}>
                      {s.spread === "SINGLE" ? "1장" : "3장"}
                    </Text>
                    <Text style={styles.barCount}>
                      {s.count}회 ({pct.toFixed(0)}%)
                    </Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[styles.barFill, { width: `${pct}%` }]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* 자주 나온 카드 Top 5 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>자주 나온 카드</Text>
          {analytics.topCards.length === 0 ? (
            <Text style={styles.emptyText}>아직 데이터 없음</Text>
          ) : (
            <View style={styles.rankList}>
              {analytics.topCards.map((c, i) => (
                <View key={c.cardId} style={styles.rankItem}>
                  <Text style={styles.rankNumber}>{i + 1}</Text>
                  <View style={styles.rankInfo}>
                    <Text style={styles.rankName}>
                      {c.card?.nameKo ?? c.cardId}
                    </Text>
                    <Text style={styles.rankSub}>
                      {c.card?.name ?? ""}
                    </Text>
                  </View>
                  <Text style={styles.rankCount}>{c.count}회</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 자주 검색한 종목 Top 5 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>관심 종목</Text>
          {analytics.topTickers.length === 0 ? (
            <Text style={styles.emptyText}>아직 데이터 없음</Text>
          ) : (
            <View style={styles.rankList}>
              {analytics.topTickers.map((t, i) => (
                <View key={t.ticker} style={styles.rankItem}>
                  <Text style={styles.rankNumber}>{i + 1}</Text>
                  <Text style={[styles.rankName, styles.tickerMono]}>
                    {t.ticker}
                  </Text>
                  <Text style={styles.rankCount}>{t.count}회</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 해석 소스 분포 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>해석 소스 분포</Text>
          <View style={styles.sourceGrid}>
            {analytics.sourceBreakdown.map((s) => (
              <View key={s.source} style={styles.sourceItem}>
                <Text
                  style={[
                    styles.sourceBadge,
                    s.source === "LLM"
                      ? styles.sourceLlm
                      : s.source === "CACHE"
                        ? styles.sourceCache
                        : styles.sourceFallback,
                  ]}
                >
                  {sourceLabel(s.source)}
                </Text>
                <Text style={styles.sourceCount}>{s.count}건</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 최근 7일 활동 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>최근 7일</Text>
          {analytics.recentActivity.length === 0 ? (
            <Text style={styles.emptyText}>최근 7일간 활동 없음</Text>
          ) : (
            <View style={styles.activityList}>
              {analytics.recentActivity.map((a) => (
                <View key={a.date} style={styles.activityRow}>
                  <Text style={styles.activityDate}>
                    {new Date(a.date).toLocaleDateString("ko-KR", {
                      month: "short",
                      day: "numeric",
                      weekday: "short",
                    })}
                  </Text>
                  <View style={styles.activityBarTrack}>
                    <View
                      style={[
                        styles.activityBarFill,
                        {
                          width: `${Math.min(
                            (a.count /
                              Math.max(
                                ...analytics.recentActivity.map((r) => r.count)
                              )) *
                              100,
                            100
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.activityCount}>{a.count}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingBottom: 40 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: { paddingVertical: 4 },
  backText: { fontSize: 14, color: Colors.accent },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },

  // Hero
  heroCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 24,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  heroLabel: { fontSize: 12, color: Colors.muted, marginBottom: 4 },
  heroValue: {
    fontSize: 48,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -2,
  },
  heroSub: { fontSize: 14, color: Colors.muted },

  // Section
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },

  // Bar chart
  barGroup: { gap: 10 },
  barItem: { gap: 4 },
  barLabelRow: { flexDirection: "row", justifyContent: "space-between" },
  barLabel: { fontSize: 13, fontWeight: "600", color: Colors.text },
  barCount: { fontSize: 12, color: Colors.muted },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },

  // Rank list
  rankList: { gap: 6 },
  rankItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  rankNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(124, 92, 191, 0.12)",
    color: Colors.accent,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 22,
    overflow: "hidden",
  },
  rankInfo: { flex: 1 },
  rankName: { fontSize: 14, fontWeight: "600", color: Colors.text },
  rankSub: { fontSize: 11, color: Colors.muted },
  rankCount: {
    fontSize: 13,
    color: Colors.muted,
    fontVariant: ["tabular-nums"],
  },
  tickerMono: { fontVariant: ["tabular-nums"], flex: 1 },

  // Source grid
  sourceGrid: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  sourceItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    gap: 6,
    minWidth: 90,
  },
  sourceBadge: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontWeight: "600",
    overflow: "hidden",
  },
  sourceLlm: { backgroundColor: "rgba(82,168,130,0.15)", color: Colors.success },
  sourceCache: { backgroundColor: "rgba(201,168,76,0.15)", color: Colors.gold },
  sourceFallback: { backgroundColor: "rgba(224,82,82,0.12)", color: Colors.error },
  sourceCount: { fontSize: 16, fontWeight: "700", color: Colors.text },

  // Activity
  activityList: { gap: 6 },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  activityDate: { fontSize: 12, color: Colors.muted, width: 80 },
  activityBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  activityBarFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: Colors.gold,
  },
  activityCount: {
    fontSize: 12,
    color: Colors.text,
    width: 24,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },

  emptyText: { fontSize: 13, color: Colors.muted, textAlign: "center", paddingVertical: 16 },
});
