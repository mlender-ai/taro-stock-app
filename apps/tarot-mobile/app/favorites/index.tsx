import { useEffect } from "react";
import { SafeAreaView, View, FlatList, TouchableOpacity, Switch, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "../../components/ui/Text";
import { Colors, Spacing } from "../../constants/theme";
import { useDrawStore } from "../../lib/drawStore";
import { useFavoritesStore } from "../../lib/favoritesStore";

export default function FavoritesScreen() {
  const router = useRouter();
  const { setTicker, addRecentSearch } = useDrawStore();
  const { items, loading, fetchFavorites, toggleAlert, removeFavorite } = useFavoritesStore();

  useEffect(() => {
    void fetchFavorites();
  }, [fetchFavorites]);

  const handleRemove = (ticker: string) =>
    Alert.alert("관심 종목 삭제", `${ticker}을(를) 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      { text: "삭제", style: "destructive", onPress: () => void removeFavorite(ticker) },
    ]);

  const handleDraw = (ticker: string, label: string | null) => {
    setTicker(ticker, label ?? ticker);
    addRecentSearch(ticker);
    router.push("/(tabs)/draw");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text variant="body-sm" color={Colors.midGrayText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text variant="subheading" color={Colors.whiteout}>관심 종목</Text>
        <Text variant="caption" color={Colors.midGrayText}>{items.length}개</Text>
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.empty}>
          <ActivityIndicator color={Colors.taroEssence} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>☆</Text>
              <Text variant="body-sm" color={Colors.midGrayText} style={{ marginTop: 12 }}>관심 종목이 없습니다</Text>
              <Text variant="caption" color={Colors.ironOutline} style={{ marginTop: 4 }}>홈에서 종목 검색 후 추가하세요</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity style={styles.cardLeft} onPress={() => handleDraw(item.ticker, item.label)} activeOpacity={0.75}>
                <Text variant="body-sm" color={Colors.taroEssence}>{item.ticker}</Text>
                <Text variant="caption" color={Colors.midGrayText}>{item.label ?? item.ticker}</Text>
                <View style={styles.marketBadge}>
                  <Text variant="caption" color={Colors.ironOutline}>{item.market}</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.cardRight}>
                <View style={styles.alertRow}>
                  <Text variant="caption" color={Colors.midGrayText}>알림</Text>
                  <Switch
                    value={item.alertEnabled}
                    onValueChange={(v) => void toggleAlert(item.id, v)}
                    trackColor={{ false: Colors.carbonBorder, true: Colors.arcaneCta }}
                    thumbColor={Colors.whiteout}
                    style={{ transform: [{ scale: 0.8 }] }}
                  />
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.drawBtn} onPress={() => handleDraw(item.ticker, item.label)}>
                    <Text variant="caption" color={Colors.taroEssence}>카드 뽑기</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleRemove(item.ticker)}>
                    <Text variant="caption" color="#e0875a">삭제</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.ebonyCanvas },
  header:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: Spacing.s24, paddingTop: Spacing.s16, paddingBottom: Spacing.s16 },
  list:        { paddingHorizontal: Spacing.s24, paddingBottom: 40 },
  card:        { flexDirection: "row", backgroundColor: Colors.graphiteBase, borderRadius: 14, padding: Spacing.s16, borderWidth: 1, borderColor: Colors.carbonBorder },
  cardLeft:    { flex: 1, gap: 4 },
  marketBadge: { alignSelf: "flex-start", borderWidth: 1, borderColor: Colors.carbonBorder, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  cardRight:   { alignItems: "flex-end", gap: 10 },
  alertRow:    { flexDirection: "row", alignItems: "center", gap: 6 },
  actions:     { flexDirection: "row", gap: 12, alignItems: "center" },
  drawBtn:     { borderWidth: 1, borderColor: Colors.deepInsight, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 },
  empty:       { alignItems: "center", justifyContent: "center", paddingTop: 80 },
  emptyIcon:   { fontSize: 40, color: Colors.ironOutline },
});
