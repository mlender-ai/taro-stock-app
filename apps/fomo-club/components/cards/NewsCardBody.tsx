import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import { scoreToColor, scoreToEmoji, scoreToFace, type ScoredArticle } from "@fomo/core";
import { FomoFace } from "../FomoFace";
import { FomoColors, Spacing, Radius } from "../../constants/fomoTheme";

function relativeTime(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const mins = Math.floor((Date.now() - t) / 60_000);
  if (mins < 0) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

/** 뉴스 카드 본문 — 포모 코멘트(말풍선) + 제목 + 원문(요약) + 출처·점수. 웹 미러. */
export function NewsCardBody({ article }: { article: ScoredArticle }) {
  const color = scoreToColor(article.fomoScore);
  const when = relativeTime(article.publishedAt);

  return (
    <View style={styles.root}>
      <View style={styles.topRow}>
        <FomoFace face={scoreToFace(article.fomoScore)} size={44} glow={color} />
        <View style={styles.bubbleCol}>
          <Text style={styles.name}>포모</Text>
          {!!article.comment && (
            <View style={styles.bubble}>
              <Text style={styles.bubbleText}>{article.comment}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.badgeRow}>
        <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
          <Text style={[styles.badgeText, { color }]}>
            {scoreToEmoji(article.fomoScore)} {article.fomoScore}
          </Text>
        </View>
        {!!article.category && <Text style={styles.category}>{article.category}</Text>}
      </View>

      <Text style={styles.title}>{article.title}</Text>
      {!!article.summary && (
        <Text style={styles.summary} numberOfLines={6}>
          {article.summary}
        </Text>
      )}

      <View style={styles.footer}>
        <Text style={styles.source}>
          {article.source}
          {when ? ` · ${when}` : ""}
        </Text>
        <Pressable
          onPress={() => Linking.openURL(article.url).catch(() => {})}
          style={styles.linkBtn}
        >
          <Text style={styles.linkText}>원문 보기</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topRow: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.s8 },
  bubbleCol: { flex: 1 },
  name: { color: FomoColors.muted, fontSize: 11 },
  bubble: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: FomoColors.hairline,
    backgroundColor: FomoColors.elevated,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: Spacing.s12,
    paddingVertical: Spacing.s8,
  },
  bubbleText: { color: FomoColors.whiteout, fontSize: 14, lineHeight: 20 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: Spacing.s8, marginTop: Spacing.s16 },
  badge: { borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  category: { color: FomoColors.muted, fontSize: 11 },
  title: { color: FomoColors.whiteout, fontSize: 18, fontWeight: "700", lineHeight: 26, marginTop: Spacing.s8 },
  summary: { color: FomoColors.muted, fontSize: 14, lineHeight: 22, marginTop: Spacing.s8, flex: 1 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: FomoColors.hairline,
    paddingTop: Spacing.s12,
    marginTop: Spacing.s12,
  },
  source: { color: FomoColors.muted, fontSize: 11, flex: 1 },
  linkBtn: { borderWidth: 1, borderColor: FomoColors.hairline, borderRadius: Radius.pill, paddingHorizontal: 12, paddingVertical: 4 },
  linkText: { color: FomoColors.muted, fontSize: 11 },
});
