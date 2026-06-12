import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { DeckCard } from "@fomo/core";
import { SwipeDeck } from "../../components/SwipeDeck";
import { fetchNews } from "../../lib/api";
import { FomoColors, Spacing } from "../../constants/fomoTheme";

/** 피드 탭 — 스와이프 카드 덱(뉴스+차트). 웹 HomeView '피드'의 미러. */
export default function Feed() {
  const [deck, setDeck] = useState<DeckCard[] | null>(null);

  useEffect(() => {
    fetchNews()
      .then((n) => setDeck(n.deck))
      .catch(() => setDeck([]));
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.logo}>FOMO CLUB</Text>
        <Text style={styles.sub}>가입 없이 둘러보기</Text>
      </View>
      <View style={styles.body}>
        <SwipeDeck deck={deck} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: FomoColors.ink, paddingHorizontal: Spacing.s24 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", marginTop: Spacing.s8, marginBottom: Spacing.s16 },
  logo: { color: FomoColors.whiteout, fontSize: 16, fontWeight: "700" },
  sub: { color: FomoColors.muted, fontSize: 12 },
  body: { flex: 1, justifyContent: "center" },
});
