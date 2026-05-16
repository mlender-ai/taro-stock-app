import { useEffect, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/colors";
import { useUserStore } from "../../lib/store";
import {
  useHistoryStore,
  type DrawHistoryItem,
  type SpreadFilter,
  type SortOption,
} from "../../lib/historyStore";

const SPREAD_OPTIONS: { label: string; value: SpreadFilter }[] = [
  { label: "전체", value: "ALL" },
  { label: "1장", value: "SINGLE" },
  { label: "3장", value: "THREE_CARD" },
];

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "최신순", value: "newest" },
  { label: "오래된순", value: "oldest" },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours().toString().padStart(2, "0");
  const mins = d.getMinutes().toString().padStart(2, "0");
  return `${month}/${day} ${hours}:${mins}`;
}

function sourceLabel(source: string): string {
  if (source === "LLM") return "AI";
  if (source === "CACHE") return "캐시";
  return "폴백";
}

function HistoryCard({ item, onPress }: { item: DrawHistoryItem; onPress: () => void }) {
  const cardNames = item.cards.map((c) => c.card.nameKo).join(", ");
  return (
    <TouchableOpacity style={styles.historyCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardRow}>
        <View style={styles.cardLeft}>
          <View style={styles.tickerRow}>
            <Text style={styles.ticker}>{item.ticker}</Text>
            <Text style={styles.marketBadge}>{item.market}</Text>
            <Text style={styles.spreadBadge}>
              {item.spread === "SINGLE" ? "1장" : "3장"}
            </Text>
          </View>
          <Text style={styles.headline} numberOfLines={1}>
            {item.headline}
          </Text>
          <Text style={styles.cardNames} numberOfLines={1}>
            {cardNames}
          </Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          <Text
            style={[
              styles.sourceBadge,
              item.source === "LLM"
                ? styles.sourceLlm
                : item.source === "CACHE"
                  ? styles.sourceCache
                  : styles.sourceFallback,
            ]}
          >
            {sourceLabel(item.source)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const userId = useUserStore((s) => s.userId);
  const {
    items,
    pagination,
    loading,
    error,
    filters,
    fetchHistory,
    setFilter,
  } = useHistoryStore();

  const load = useCallback(() => {
    if (userId) fetchHistory(userId, 1);
  }, [userId, fetchHistory]);

  useEffect(() => {
    load();
  }, [load, filters.spread, filters.sort]);

  const loadMore = useCallback(() => {
    if (!userId || !pagination || pagination.page >= pagination.totalPages || loading) return;
    fetchHistory(userId, pagination.page + 1);
  }, [userId, pagination, loading, fetchHistory]);

  if (!userId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>◈</Text>
          <Text style={styles.emptyTitle}>로그인이 필요합니다</Text>
          <Text style={styles.emptyDesc}>뽑기 기록은 로그인 후 확인할 수 있습니다</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>뽑기 기록</Text>
        <TouchableOpacity
          style={styles.analyticsBtn}
          onPress={() => router.push("/history/analytics")}
        >
          <Text style={styles.analyticsBtnText}>내 분석 →</Text>
        </TouchableOpacity>
      </View>

      {/* 필터 바 */}
      <View style={styles.filterBar}>
        <View style={styles.filterGroup}>
          {SPREAD_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.filterBtn,
                filters.spread === opt.value && styles.filterBtnActive,
              ]}
              onPress={() => setFilter("spread", opt.value)}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  filters.spread === opt.value && styles.filterBtnTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.filterGroup}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.sortBtn,
                filters.sort === opt.value && styles.sortBtnActive,
              ]}
              onPress={() => setFilter("sort", opt.value)}
            >
              <Text
                style={[
                  styles.sortBtnText,
                  filters.sort === opt.value && styles.sortBtnTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 결과 카운트 */}
      {pagination && (
        <View style={styles.countBar}>
          <Text style={styles.countText}>총 {pagination.total}건</Text>
        </View>
      )}

      {/* 리스트 */}
      {error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryBtnText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HistoryCard
              item={item}
              onPress={() => router.push(`/history/${item.id}`)}
            />
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={loading && (pagination?.page ?? 1) === 1}
              onRefresh={load}
              tintColor={Colors.accent}
            />
          }
          ListFooterComponent={
            loading && (pagination?.page ?? 1) > 1 ? (
              <ActivityIndicator
                style={styles.footer}
                color={Colors.accent}
              />
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>◈</Text>
                <Text style={styles.emptyTitle}>아직 기록이 없습니다</Text>
                <Text style={styles.emptyDesc}>
                  홈에서 종목을 검색하고 타로 카드를 뽑아보세요
                </Text>
              </View>
            ) : null
          }
          contentContainerStyle={items.length === 0 ? styles.emptyList : undefined}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  analyticsBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  analyticsBtnText: { fontSize: 12, color: Colors.accent },

  // Filter bar
  filterBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  filterGroup: { flexDirection: "row", gap: 4 },
  filterBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "transparent",
  },
  filterBtnActive: {
    backgroundColor: "rgba(124, 92, 191, 0.15)",
    borderColor: Colors.accent,
  },
  filterBtnText: { fontSize: 12, color: Colors.muted },
  filterBtnTextActive: { color: Colors.accent },
  sortBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  sortBtnActive: { backgroundColor: "rgba(255,255,255,0.05)" },
  sortBtnText: { fontSize: 11, color: Colors.muted },
  sortBtnTextActive: { color: Colors.text },

  // Count bar
  countBar: { paddingHorizontal: 20, paddingBottom: 4 },
  countText: { fontSize: 11, color: Colors.muted },

  // History card
  historyCard: {
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 14,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardRow: { flexDirection: "row", justifyContent: "space-between" },
  cardLeft: { flex: 1, marginRight: 12 },
  cardRight: { alignItems: "flex-end", gap: 6 },
  tickerRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  ticker: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    fontVariant: ["tabular-nums"],
  },
  marketBadge: {
    fontSize: 9,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.06)",
    color: Colors.muted,
    overflow: "hidden",
  },
  spreadBadge: {
    fontSize: 10,
    color: Colors.gold,
  },
  headline: { fontSize: 13, color: Colors.text, marginBottom: 2 },
  cardNames: { fontSize: 11, color: Colors.muted },
  date: { fontSize: 11, color: Colors.muted, fontVariant: ["tabular-nums"] },
  sourceBadge: {
    fontSize: 9,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
    fontWeight: "600",
  },
  sourceLlm: { backgroundColor: "rgba(82,168,130,0.15)", color: Colors.success },
  sourceCache: { backgroundColor: "rgba(201,168,76,0.15)", color: Colors.gold },
  sourceFallback: { backgroundColor: "rgba(224,82,82,0.12)", color: Colors.error },

  // Empty states
  emptyList: { flexGrow: 1 },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 36, color: Colors.border, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: Colors.text, marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: Colors.muted, textAlign: "center" },
  errorText: { fontSize: 13, color: Colors.error, marginBottom: 12 },
  retryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  retryBtnText: { fontSize: 13, color: Colors.accent },

  // Footer
  footer: { paddingVertical: 16 },
});
