import { useState, useCallback } from "react";
import {
  SafeAreaView, View, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Text } from "../../components/ui/Text";
import { Colors, Spacing, Typography } from "../../constants/theme";
import { useUserStore } from "../../lib/store";
import { useDrawStore } from "../../lib/drawStore";

const POPULAR = ["삼성전자", "SK하이닉스", "NVDA", "AAPL", "TSLA", "005930.KS"];

export default function HomeScreen() {
  const router = useRouter();
  const { credits } = useUserStore();
  const { recentSearches, setTicker, addRecentSearch } = useDrawStore();
  const [query, setQuery] = useState("");

  const handleSelect = useCallback(
    (ticker: string, name?: string) => {
      const tickerName = name ?? ticker;
      setTicker(ticker, tickerName);
      addRecentSearch(ticker);
      router.push("/draw");
    },
    [setTicker, addRecentSearch, router]
  );

  const filtered = query.trim()
    ? POPULAR.filter((t) => t.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text variant="caption" color={Colors.taroEssence} style={styles.brand}>
            TRADING TARO
          </Text>
          <View style={styles.creditBadge}>
            <Text variant="caption" color={Colors.taroEssence}>✦ {credits} 크레딧</Text>
          </View>
        </View>

        {/* 히어로 */}
        <View style={styles.hero}>
          <Text variant="heading-lg" style={styles.heroTitle}>
            오늘의 시장,{"\n"}
            <Text variant="heading-lg" color={Colors.taroEssence}>
              카드에 물어보세요
            </Text>
          </Text>
          <Text variant="body-sm" style={styles.heroSub}>
            AI가 분석한 시장 데이터를 타로 카드 해석으로 만나보세요
          </Text>
        </View>

        {/* 검색 */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>⊕</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="종목명 또는 티커 검색 (예: AAPL, 삼성전자)"
              placeholderTextColor={Colors.ironOutline}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              onSubmitEditing={() => {
                if (query.trim()) handleSelect(query.trim().toUpperCase(), query.trim());
              }}
              autoCapitalize="characters"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")}>
                <Text style={styles.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 검색 자동완성 */}
          {filtered.length > 0 && (
            <View style={styles.dropdown}>
              {filtered.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={styles.dropdownItem}
                  onPress={() => handleSelect(t)}
                >
                  <Text variant="body-sm" color={Colors.whiteout}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 최근 검색 */}
        {recentSearches.length > 0 && (
          <View style={styles.section}>
            <Text variant="caption" color={Colors.midGrayText} style={styles.sectionLabel}>
              최근 검색
            </Text>
            <View style={styles.chipRow}>
              {recentSearches.map((t) => (
                <TouchableOpacity key={t} style={styles.chip} onPress={() => handleSelect(t)}>
                  <Text variant="caption" color={Colors.silverHighlight}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 인기 종목 */}
        <View style={styles.section}>
          <Text variant="caption" color={Colors.midGrayText} style={styles.sectionLabel}>
            인기 종목
          </Text>
          <View style={styles.chipRow}>
            {POPULAR.map((t) => (
              <TouchableOpacity key={t} style={styles.chip} onPress={() => handleSelect(t)}>
                <Text variant="caption" color={Colors.silverHighlight}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 사용 안내 */}
        <View style={styles.guide}>
          <View style={styles.guideRow}>
            <Text style={styles.guideStep}>1</Text>
            <Text variant="body-sm">종목을 검색하세요</Text>
          </View>
          <View style={styles.guideRow}>
            <Text style={styles.guideStep}>2</Text>
            <Text variant="body-sm">카드 수를 선택하세요 (1장 / 3장)</Text>
          </View>
          <View style={styles.guideRow}>
            <Text style={styles.guideStep}>3</Text>
            <Text variant="body-sm">AI 타로 해석을 확인하세요</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.ebonyCanvas },
  scroll:        { paddingHorizontal: Spacing.s24, paddingBottom: 40 },
  header:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: Spacing.s16, marginBottom: Spacing.s32 },
  brand:         { letterSpacing: 2 },
  creditBadge:   { borderWidth: 1, borderColor: Colors.deepInsight, borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 4 },
  hero:          { marginBottom: Spacing.s32 },
  heroTitle:     { color: Colors.whiteout, marginBottom: Spacing.s8 },
  heroSub:       { color: Colors.midGrayText },
  searchWrap:    { marginBottom: Spacing.s24, zIndex: 10 },
  searchBox:     { flexDirection: "row", alignItems: "center", backgroundColor: Colors.graphiteBase, borderRadius: 12, borderWidth: 1, borderColor: Colors.carbonBorder, paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  searchIcon:    { fontSize: 16, color: Colors.midGrayText },
  searchInput:   { flex: 1, fontSize: Typography.size.body, color: Colors.whiteout, padding: 0 },
  clearBtn:      { fontSize: 14, color: Colors.midGrayText, padding: 4 },
  dropdown:      { backgroundColor: Colors.graphiteBase, borderWidth: 1, borderColor: Colors.carbonBorder, borderRadius: 12, marginTop: 4, overflow: "hidden" },
  dropdownItem:  { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.carbonBorder },
  section:       { marginBottom: Spacing.s24 },
  sectionLabel:  { marginBottom: Spacing.s8, letterSpacing: 0.5 },
  chipRow:       { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip:          { backgroundColor: Colors.graphiteBase, borderWidth: 1, borderColor: Colors.carbonBorder, borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 6 },
  guide:         { backgroundColor: Colors.graphiteBase, borderRadius: 16, padding: Spacing.s24, borderWidth: 1, borderColor: Colors.carbonBorder, gap: 12 },
  guideRow:      { flexDirection: "row", alignItems: "center", gap: 12 },
  guideStep:     { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.arcaneCta, textAlign: "center", lineHeight: 24, fontSize: 12, color: Colors.whiteout, fontWeight: "700" },
});
