import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { scoreToState, scoreToFace, scoreToColor, marketLine, type MarketScore, type MoodSignal } from "@fomo/core";
import { FomoFace } from "../../components/FomoFace";
import { MarketCarousel } from "../../components/MarketCarousel";
import { MoodSignals } from "../../components/MoodSignals";
import {
  fetchIndex,
  fetchBanner,
  fetchFeed,
  type FomoIndexResponse,
  type BannerResponse,
} from "../../lib/api";
import { FomoColors, Spacing } from "../../constants/fomoTheme";
import type { BannerItem } from "@fomo/core";

/** 오늘 탭 — 포모 + FOMO Index + 롤링 시그널 (액션 제로). 웹 HomeView '오늘'의 미러. */
export default function Today() {
  const [index, setIndex] = useState<FomoIndexResponse | null>(null);
  const [banner, setBanner] = useState<BannerItem[]>([]);
  const [markets, setMarkets] = useState<MarketScore[]>([]);
  const [moods, setMoods] = useState<MoodSignal[]>([]);

  useEffect(() => {
    fetchIndex().then(setIndex).catch(() => {});
    fetchBanner()
      .then((b: BannerResponse) => {
        setBanner(b.items ?? []);
        setMarkets(b.markets ?? []);
      })
      .catch(() => {});
    fetchFeed()
      .then((f) => setMoods(f.moods ?? []))
      .catch(() => {});
  }, []);

  const state = index ? scoreToState(index.score) : null;
  const color = index ? scoreToColor(index.score) : FomoColors.muted;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.logo}>FOMO CLUB</Text>
          <Text style={styles.sub}>가입 없이 둘러보기</Text>
        </View>

        {markets.length > 0 && (
          <View style={styles.block}>
            <MarketCarousel markets={markets} />
          </View>
        )}

        <Text style={styles.faceLabel}>오늘의 포모</Text>
        <FomoFace face={index ? scoreToFace(index.score) : "curious"} size={96} glow={color} />

        <View style={styles.indexBox}>
          {index ? (
            <>
              <Text style={[styles.score, { color }]}>{index.score}</Text>
              <Text style={styles.indexMeta}>
                FOMO INDEX · {index.state}
                {index.prevDayDelta ? ` · 전일 ${index.prevDayDelta > 0 ? "+" : ""}${index.prevDayDelta}` : ""}
              </Text>
            </>
          ) : (
            <Text style={styles.indexMeta}>불러오는 중…</Text>
          )}
        </View>

        {state && <Text style={styles.line}>{marketLine(state)}</Text>}

        <View style={styles.block}>
          <MoodSignals items={banner} extra={moods} />
        </View>

        <Text style={styles.disclaimer}>
          FOMO Index는 감정 체감 지표예요. 투자 조언이 아니에요.{"\n"}
          도박문제로 힘들 땐 <Text style={styles.bold}>1336</Text>(한국도박문제예방치유원)에서 무료로 상담할 수 있어요.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: FomoColors.ink },
  scroll: { alignItems: "center", paddingHorizontal: Spacing.s24, paddingTop: Spacing.s8, paddingBottom: Spacing.s40 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: Spacing.s16 },
  logo: { color: FomoColors.whiteout, fontSize: 16, fontWeight: "700" },
  sub: { color: FomoColors.muted, fontSize: 12 },
  block: { width: "100%", marginVertical: Spacing.s16 },
  faceLabel: { color: FomoColors.muted, fontSize: 12, marginBottom: Spacing.s8 },
  indexBox: { alignItems: "center", marginTop: Spacing.s12 },
  score: { fontSize: 40, fontWeight: "800", lineHeight: 44 },
  indexMeta: { color: FomoColors.muted, fontSize: 12, marginTop: 6 },
  line: { color: FomoColors.whiteout, fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: Spacing.s12, maxWidth: 300 },
  disclaimer: { color: FomoColors.muted, fontSize: 11, lineHeight: 20, textAlign: "center", marginTop: Spacing.s24 },
  bold: { color: FomoColors.whiteout },
});
