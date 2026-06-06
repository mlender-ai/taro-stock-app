import { useEffect, useRef, useState, useCallback } from "react";
import {
  Animated,
  Easing,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import {
  EMOTION_TYPES,
  EMOTION_LABELS,
  EMOTION_COLORS,
  scoreToFace,
  type EmotionType,
  type FomoFace as FomoFaceType,
} from "@fomo/core";
import { FomoFace } from "../components/FomoFace";
import { FomoColors, Spacing, Radius } from "../constants/fomoTheme";
import {
  fetchIndex,
  fetchToday,
  postVote,
  type FomoIndexResponse,
  type TallyResponse,
} from "../lib/api";

export default function Home() {
  // 두 단계 상태: 'market'(시장의 포모) → 'mine'(나의 포모). docs/MASCOT.md §5.
  const [index, setIndex] = useState<FomoIndexResponse | null>(null);
  const [tally, setTally] = useState<TallyResponse | null>(null);
  const [mine, setMine] = useState<EmotionType | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  const stage: "market" | "mine" = mine ? "mine" : "market";
  const marketFace: FomoFaceType = index ? scoreToFace(index.score) : "curious";

  useEffect(() => {
    Promise.allSettled([fetchIndex(), fetchToday()]).then(([i, t]) => {
      if (i.status === "fulfilled") setIndex(i.value);
      if (t.status === "fulfilled") setTally(t.value);
      setLoading(false);
    });
  }, []);

  const vote = useCallback(async (e: EmotionType) => {
    setVoting(true);
    setMine(e);
    try {
      const res = await postVote(e);
      setTally(res);
    } catch {
      // 낙관적 — 선택 유지, 집계는 다음 로드에 반영
    } finally {
      setVoting(false);
    }
  }, []);

  // '나의 포모' 멘트가 떠오르듯 페이드+슬라이드인. docs/MASCOT.md "전환 = 애니메이션 + 멘트".
  const mentionFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(mentionFade, {
      toValue: stage === "mine" ? 1 : 0,
      duration: 420,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [stage, mentionFade]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brand}>FOMO Club</Text>
          <Link href="/settings" style={styles.link}>설정</Link>
        </View>

        {/* 주인공: 포모 마스코트 (숫자는 보조) */}
        <Text style={styles.stageLabel}>
          {stage === "market" ? "오늘의 포모 — 시장의 분위기" : "나의 포모"}
        </Text>
        <FomoFace
          face={stage === "market" ? marketFace : "calm"}
          glow={stage === "mine" && mine ? EMOTION_COLORS[mine] : undefined}
        />

        {/* 보조: FOMO Index 숫자 */}
        <View style={styles.indexRow}>
          {loading ? (
            <ActivityIndicator color={FomoColors.muted} />
          ) : index ? (
            <>
              <Text style={styles.indexText}>{index.score} · {index.state}</Text>
              <Text style={styles.muted}>FOMO INDEX{index.live ? " · 실시간 집계" : ""}</Text>
              {!!index.aiSummary && <Text style={styles.summary}>{index.aiSummary}</Text>}
            </>
          ) : (
            <Text style={styles.muted}>FOMO INDEX · 집계 준비 중</Text>
          )}
        </View>

        {/* 2단계 전환 멘트 (페이드+슬라이드) */}
        {stage === "mine" && mine && (
          <Animated.Text
            style={[
              styles.mention,
              {
                opacity: mentionFade,
                transform: [
                  { translateY: mentionFade.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
                ],
              },
            ]}
          >
            다들 어떻든, 너의 「{EMOTION_LABELS[mine]}」도 괜찮아.
          </Animated.Text>
        )}

        {/* 오늘의 감정 투표 */}
        <View style={styles.voteBlock}>
          <Text style={styles.voteTitle}>오늘 당신의 감정은?</Text>
          <Text style={styles.voteHint}>하루 한 번 선택할 수 있어요</Text>

          <View style={styles.chips}>
            {EMOTION_TYPES.map((e) => {
              const selected = mine === e;
              return (
                <Pressable
                  key={e}
                  disabled={voting}
                  onPress={() => vote(e)}
                  style={[
                    styles.chip,
                    {
                      borderColor: selected ? EMOTION_COLORS[e] : FomoColors.hairline,
                      backgroundColor: selected ? EMOTION_COLORS[e] + "22" : FomoColors.surface,
                      opacity: voting ? 0.6 : 1,
                    },
                  ]}
                >
                  <Text style={{ color: selected ? EMOTION_COLORS[e] : FomoColors.whiteout }}>
                    {EMOTION_LABELS[e]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* 집계 결과 — 정직한 숫자 */}
          {tally && (
            <View style={styles.tallyBlock}>
              <Text style={styles.tally}>오늘 {tally.total}명이 감정을 선택했어요</Text>
              {EMOTION_TYPES.map((e) => (
                <View key={e} style={styles.barRow}>
                  <Text style={[styles.barLabel, { color: EMOTION_COLORS[e] }]}>{EMOTION_LABELS[e]}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={{
                        width: `${tally.ratios[e] ?? 0}%`,
                        height: "100%",
                        borderRadius: 999,
                        backgroundColor: EMOTION_COLORS[e],
                      }}
                    />
                  </View>
                  <Text style={styles.barPct}>{tally.ratios[e] ?? 0}%</Text>
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
  safe: { flex: 1, backgroundColor: FomoColors.ink },
  content: { paddingHorizontal: Spacing.s24, paddingTop: Spacing.s16, paddingBottom: 64, alignItems: "center" },
  header: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.s32 },
  brand: { color: FomoColors.whiteout, fontSize: 18, fontWeight: "600" },
  link: { color: FomoColors.muted, fontSize: 14 },
  stageLabel: { color: FomoColors.muted, fontSize: 12, marginBottom: Spacing.s12 },
  indexRow: { alignItems: "center", marginTop: Spacing.s24, minHeight: 28 },
  indexText: { color: FomoColors.whiteout, fontSize: 24, fontWeight: "600" },
  muted: { color: FomoColors.muted, fontSize: 12, marginTop: 4 },
  summary: { color: FomoColors.whiteout, fontSize: 14, textAlign: "center", marginTop: Spacing.s8, maxWidth: 300 },
  mention: { color: FomoColors.whiteout, textAlign: "center", fontSize: 14, marginTop: Spacing.s16, lineHeight: 20 },
  voteBlock: { width: "100%", marginTop: Spacing.s40 },
  voteTitle: { color: FomoColors.whiteout, fontSize: 16, fontWeight: "600", marginBottom: Spacing.s4 },
  voteHint: { color: FomoColors.muted, fontSize: 12, marginBottom: Spacing.s16 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.s8 },
  chip: { paddingHorizontal: Spacing.s16, paddingVertical: Spacing.s12, borderRadius: Radius.md, borderWidth: 1 },
  tallyBlock: { marginTop: Spacing.s24 },
  tally: { color: FomoColors.muted, fontSize: 12, marginBottom: Spacing.s12 },
  barRow: { flexDirection: "row", alignItems: "center", gap: Spacing.s8, marginBottom: 6 },
  barLabel: { width: 44, fontSize: 12 },
  barTrack: { flex: 1, height: 8, borderRadius: 999, backgroundColor: FomoColors.elevated, overflow: "hidden" },
  barPct: { width: 36, textAlign: "right", color: FomoColors.muted, fontSize: 12 },
});
