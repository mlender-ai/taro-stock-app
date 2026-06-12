import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, PanResponder, Pressable, Dimensions } from "react-native";
import type { DeckCard } from "@fomo/core";
import { NewsCardBody } from "./cards/NewsCardBody";
import { ChartCardBody } from "./cards/ChartCardBody";
import { recordSwipe } from "../lib/swipeHistory";
import { FomoColors, Spacing, Radius } from "../constants/fomoTheme";

/**
 * 스와이프 카드 덱 — 한 화면 1장. 오른쪽=FOMO, 왼쪽=아니다. docs/PIVOT_FEED_FIRST.md.
 * 웹 SwipeDeck의 네이티브 미러. PanResponder + Animated(reanimated 금지). 버튼 병행.
 * 판단은 저장 안 함(swipeHistory seam만).
 */
const W = Dimensions.get("window").width;
const THRESHOLD = 90;

function CardBody({ card }: { card: DeckCard }) {
  return card.kind === "news" ? (
    <NewsCardBody article={card.article} />
  ) : (
    <ChartCardBody chart={card.chart} />
  );
}

export function SwipeDeck({ deck }: { deck: DeckCard[] | null }) {
  const [idx, setIdx] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;
  const idxRef = useRef(0);
  const deckRef = useRef<DeckCard[] | null>(deck);
  const flinging = useRef(false);
  idxRef.current = idx;
  deckRef.current = deck;

  const fling = (dir: "left" | "right") => {
    if (flinging.current) return;
    flinging.current = true;
    Animated.timing(position, {
      toValue: { x: dir === "right" ? W * 1.4 : -W * 1.4, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      const card = deckRef.current?.[idxRef.current];
      if (card) recordSwipe(card, dir === "right" ? "fomo" : "skip", Date.now());
      position.setValue({ x: 0, y: 0 });
      flinging.current = false;
      setIdx((i) => i + 1);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: Animated.event([null, { dx: position.x, dy: position.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, g) => {
        if (g.dx > THRESHOLD) fling("right");
        else if (g.dx < -THRESHOLD) fling("left");
        else Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      },
    })
  ).current;

  // deck이 새로 들어오면 처음부터.
  useEffect(() => {
    setIdx(0);
    position.setValue({ x: 0, y: 0 });
  }, [deck, position]);

  if (deck === null) {
    return <Text style={styles.dim}>불러오는 중…</Text>;
  }
  if (deck.length === 0) {
    return <Text style={styles.dim}>지금은 가져올 소식이 조용해.{"\n"}내일 다시 들러도 돼.</Text>;
  }
  if (idx >= deck.length) {
    return (
      <View style={styles.end}>
        <Text style={styles.endText}>오늘 소식은 여기까지야.{"\n"}너만 늦은 거 아니야. 내일 또 보자.</Text>
        <Pressable onPress={() => setIdx(0)} style={styles.restart}>
          <Text style={styles.restartText}>처음부터 다시</Text>
        </Pressable>
      </View>
    );
  }

  const rotate = position.x.interpolate({
    inputRange: [-W, 0, W],
    outputRange: ["-12deg", "0deg", "12deg"],
  });
  const fomoOpacity = position.x.interpolate({
    inputRange: [0, THRESHOLD],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const skipOpacity = position.x.interpolate({
    inputRange: [-THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const next = deck[idx + 1];

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>
        오른쪽으로 넘기면 <Text style={{ color: "#FF5A36" }}>FOMO</Text>, 왼쪽은 아니야
      </Text>

      <View style={styles.stack}>
        {next && (
          <View style={[styles.card, styles.behind]} pointerEvents="none">
            <CardBody card={next} />
          </View>
        )}

        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.card,
            { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] },
          ]}
        >
          <Animated.View style={[styles.overlay, styles.overlayRight, { opacity: fomoOpacity }]}>
            <Text style={styles.overlayRightText}>FOMO ↗</Text>
          </Animated.View>
          <Animated.View style={[styles.overlay, styles.overlayLeft, { opacity: skipOpacity }]}>
            <Text style={styles.overlayLeftText}>← 아니야</Text>
          </Animated.View>
          <CardBody card={deck[idx]!} />
        </Animated.View>
      </View>

      <View style={styles.buttons}>
        <Pressable onPress={() => fling("left")} style={styles.skipBtn} accessibilityLabel="아니다">
          <Text style={styles.skipText}>✕</Text>
        </Pressable>
        <Pressable onPress={() => fling("right")} style={styles.fomoBtn} accessibilityLabel="FOMO">
          <Text style={styles.fomoText}>FOMO ↗</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  dim: { color: FomoColors.muted, textAlign: "center", marginTop: 40, fontSize: 14, lineHeight: 22 },
  hint: { color: FomoColors.muted, textAlign: "center", fontSize: 12, marginBottom: Spacing.s12 },
  stack: { height: 480, width: "100%" },
  card: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 480,
    borderWidth: 1,
    borderColor: FomoColors.hairline,
    backgroundColor: FomoColors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.s24,
    paddingVertical: Spacing.s24,
    overflow: "hidden",
  },
  behind: { transform: [{ translateY: 10 }, { scale: 0.96 }], opacity: 0.5 },
  overlay: { position: "absolute", top: 16, borderWidth: 2, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, zIndex: 5 },
  overlayRight: { right: 16, borderColor: "#FF5A36" },
  overlayRightText: { color: "#FF5A36", fontSize: 14, fontWeight: "700" },
  overlayLeft: { left: 16, borderColor: "#64748B" },
  overlayLeftText: { color: "#64748B", fontSize: 14, fontWeight: "700" },
  buttons: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.s16, marginTop: Spacing.s24 },
  skipBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: FomoColors.hairline,
    backgroundColor: FomoColors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  skipText: { color: FomoColors.muted, fontSize: 20 },
  fomoBtn: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FF5A36",
    alignItems: "center",
    justifyContent: "center",
  },
  fomoText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  end: { alignItems: "center", marginTop: 48, gap: Spacing.s16 },
  endText: { color: FomoColors.whiteout, fontSize: 14, lineHeight: 22, textAlign: "center" },
  restart: { borderWidth: 1, borderColor: FomoColors.hairline, borderRadius: Radius.pill, paddingHorizontal: 16, paddingVertical: 8 },
  restartText: { color: FomoColors.muted, fontSize: 12 },
});
