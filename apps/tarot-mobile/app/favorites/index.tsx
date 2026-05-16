import { useEffect, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/colors";
import { useUserStore } from "../../lib/store";
import {
  useFavoritesStore,
  type FavoriteItem,
} from "../../lib/favoritesStore";

function FavoriteCard({
  item,
  onToggleAlert,
  onRemove,
}: {
  item: FavoriteItem;
  onToggleAlert: (id: string, enabled: boolean) => void;
  onRemove: (ticker: string) => void;
}) {
  return (
    <View style={styles.favCard}>
      <View style={styles.favLeft}>
        <View style={styles.favTickerRow}>
          <Text style={styles.favTicker}>{item.ticker}</Text>
          <Text style={styles.favMarket}>{item.market}</Text>
        </View>
        {item.label && <Text style={styles.favLabel}>{item.label}</Text>}
      </View>

      <View style={styles.favRight}>
        <View style={styles.alertRow}>
          <Text style={styles.alertLabel}>알림</Text>
          <Switch
            value={item.alertEnabled}
            onValueChange={(v) => onToggleAlert(item.id, v)}
            trackColor={{ false: Colors.border, true: Colors.accent }}
            thumbColor="#fff"
            style={styles.alertSwitch}
          />
        </View>
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              "관심 종목 삭제",
              `${item.ticker}을(를) 삭제하시겠습니까?`,
              [
                { text: "취소", style: "cancel" },
                {
                  text: "삭제",
                  style: "destructive",
                  onPress: () => onRemove(item.ticker),
                },
              ]
            )
          }
          style={styles.removeBtn}
        >
          <Text style={styles.removeBtnText}>삭제</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function FavoritesScreen() {
  const router = useRouter();
  const userId = useUserStore((s) => s.userId);
  const { items, loading, fetchFavorites, toggleAlert, removeFavorite } =
    useFavoritesStore();

  const load = useCallback(() => {
    if (userId) fetchFavorites(userId);
  }, [userId, fetchFavorites]);

  useEffect(() => {
    load();
  }, [load]);

  if (!userId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>☆</Text>
          <Text style={styles.emptyTitle}>로그인이 필요합니다</Text>
          <Text style={styles.emptyDesc}>
            관심 종목은 로그인 후 관리할 수 있습니다
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>관심 종목</Text>
        <Text style={styles.headerCount}>{items.length}개</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FavoriteCard
            item={item}
            onToggleAlert={toggleAlert}
            onRemove={(ticker) => {
              if (userId) removeFavorite(userId, ticker);
            }}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={Colors.accent}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>☆</Text>
              <Text style={styles.emptyTitle}>관심 종목이 없습니다</Text>
              <Text style={styles.emptyDesc}>
                종목 검색 후 ☆ 를 눌러 추가하세요
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={
          items.length === 0 ? styles.emptyList : styles.list
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: { paddingVertical: 4 },
  backText: { fontSize: 14, color: Colors.accent },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  headerCount: { fontSize: 13, color: Colors.muted },

  // List
  list: { paddingBottom: 24 },

  // Favorite card
  favCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 14,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  favLeft: { flex: 1, gap: 2 },
  favTickerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  favTicker: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    fontVariant: ["tabular-nums"],
  },
  favMarket: {
    fontSize: 9,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.06)",
    color: Colors.muted,
    overflow: "hidden",
  },
  favLabel: { fontSize: 12, color: Colors.muted },

  favRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  alertRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  alertLabel: { fontSize: 11, color: Colors.muted },
  alertSwitch: { transform: [{ scale: 0.8 }] },
  removeBtn: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(224,82,82,0.3)",
  },
  removeBtnText: { fontSize: 10, color: Colors.error },

  // Empty states
  emptyList: { flexGrow: 1 },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 36, color: Colors.border, marginBottom: 12 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
  },
});
