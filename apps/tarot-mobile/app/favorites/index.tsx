import { useEffect, useState } from "react";
import { SafeAreaView, View, FlatList, TouchableOpacity, Switch, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "../../components/ui/Text";
import { Colors, Spacing } from "../../constants/theme";
import { useDrawStore } from "../../lib/drawStore";
import { useFavoritesStore } from "../../lib/favoritesStore";
import { TickerLogo } from "../../components/TickerLogo";
import { apiFetch } from "../../lib/api";

interface MiniQuote {
  symbol: string;
  shortName: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  currency: string;
}

export default function FavoritesScreen() {
  const router = useRouter();
  const { setTicker, addRecentSearch } = useDrawStore();
  const { items, loading, fetchFavorites, toggleAlert, removeFavorite } = useFavoritesStore();
  const [quotes, setQuotes] = useState<Record<string, MiniQuote>>({});

  useEffect(() => {
    void fetchFavorites();
  }, [fetchFavorites]);

  // 실시간 가격 조회
  useEffect(() => {
    if (items.length === 0) return;
    const symbols = items.map((f) => f.ticker).join(",");
    apiFetch<{ quotes: MiniQuote[] }>(`/api/tarot/quotes?symbols=${symbols}`)
      .then((data) => {
        const map: Record<string, MiniQuote> = {};
        data.quotes.forEach((q) => { map[q.symbol] = q; });
        setQuotes(map);
      })
      .catch(() => {});
  }, [items]);

  const handleRemove = (ticker: string) =>
    Alert.alert("관심 종목 삭제", `${ticker}을(를) 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      { text: "삭제", style: "destructive", onPress: () => void removeFavorite(ticker) },
    ]);

  const handleNavigate = (ticker: string) => {
    addRecentSearch(ticker);
    router.push(`/ticker/${encodeURIComponent(ticker)}`);
  };

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
          renderItem={({ item }) => {
            const q = quotes[item.ticker];
            const isPos = q ? q.change >= 0 : true;
            const priceColor = isPos ? Colors.taroEssence : "#f43f5e";

            return (
              <View style={styles.card}>
                <TouchableOpacity style={styles.cardLeft} onPress={() => handleNavigate(item.ticker)} activeOpacity={0.75}>
                  <View style={styles.tickerRow}>
                    <TickerLogo ticker={item.ticker} size={36} />
                    <View style={styles.tickerMeta}>
                      <Text variant="body-sm" color={Colors.whiteout}>{item.label ?? item.ticker}</Text>
                      <Text variant="caption" color={Colors.midGrayText}>{item.ticker}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
                <View style={styles.cardRight}>
                  {/* 실시간 가격 */}
                  {q ? (
                    <View style={styles.priceArea}>
                      <Text variant="body-sm" color={Colors.whiteout} style={styles.price}>
                        {q.currency === "KRW"
                          ? `₩${q.currentPrice.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}`
                          : `$${q.currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        }
                      </Text>
                      <Text variant="caption" color={priceColor}>
                        {isPos ? "+" : ""}{q.changePercent.toFixed(2)}%
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.marketBadge}>
                      <Text variant="caption" color={Colors.ironOutline}>{item.market}</Text>
                    </View>
                  )}
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.drawBtn} onPress={() => handleDraw(item.ticker, item.label)}>
                      <Text variant="caption" color={Colors.taroEssence}>타로</Text>
                    </TouchableOpacity>
                    <View style={styles.alertRow}>
                      <Switch
                        value={item.alertEnabled}
                        onValueChange={(v) => void toggleAlert(item.id, v)}
                        trackColor={{ false: Colors.carbonBorder, true: Colors.arcaneCta }}
                        thumbColor={Colors.whiteout}
                        style={{ transform: [{ scale: 0.7 }] }}
                      />
                    </View>
                    <TouchableOpacity onPress={() => handleRemove(item.ticker)}>
                      <Text variant="caption" color="#e0875a">삭제</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
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
  cardLeft:    { flex: 1, justifyContent: "center" },
  tickerRow:   { flexDirection: "row", alignItems: "center", gap: 10 },
  tickerMeta:  { gap: 2 },
  marketBadge: { alignSelf: "flex-end", borderWidth: 1, borderColor: Colors.carbonBorder, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  cardRight:   { alignItems: "flex-end", gap: 8 },
  priceArea:   { alignItems: "flex-end", gap: 2 },
  price:       { fontWeight: "600" },
  alertRow:    { flexDirection: "row", alignItems: "center" },
  actions:     { flexDirection: "row", gap: 8, alignItems: "center" },
  drawBtn:     { borderWidth: 1, borderColor: Colors.deepInsight, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 },
  empty:       { alignItems: "center", justifyContent: "center", paddingTop: 80 },
  emptyIcon:   { fontSize: 40, color: Colors.ironOutline },
});
