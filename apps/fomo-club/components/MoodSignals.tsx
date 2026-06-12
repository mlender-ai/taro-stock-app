import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { moodifyBanner, type BannerItem, type MoodSignal } from "@fomo/core";
import { FomoColors, Spacing, Radius } from "../constants/fomoTheme";

/**
 * 롤링 시그널 — 시장 신호를 분위기로(액션 제로). docs/PIVOT_FEED_FIRST.md. 웹 MoodSignals 미러.
 * 치환 엔진(feed.moods) 우선 + 배너 신호 치환 보충, 같은 문장 중복 제거.
 */
const ROTATE_MS = 4500;

export function MoodSignals({
  items,
  extra = [],
}: {
  items: BannerItem[];
  extra?: MoodSignal[];
}) {
  const signals: MoodSignal[] = useMemo(() => {
    const merged = [...extra, ...moodifyBanner(items, Math.max(0, 3 - extra.length))];
    const seen = new Set<string>();
    return merged.filter((s) => (seen.has(s.text) ? false : (seen.add(s.text), true)));
  }, [items, extra]);

  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (signals.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % signals.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [signals.length]);

  if (signals.length === 0) return null;
  const cur = signals[Math.min(idx, signals.length - 1)]!;

  return (
    <View style={styles.card}>
      <Text style={styles.emoji}>{cur.emoji}</Text>
      <Text style={styles.text}>{cur.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s8,
    borderWidth: 1,
    borderColor: FomoColors.hairline,
    backgroundColor: FomoColors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s12,
    width: "100%",
  },
  emoji: { fontSize: 16 },
  text: { color: FomoColors.whiteout, fontSize: 14, lineHeight: 20, flex: 1 },
});
