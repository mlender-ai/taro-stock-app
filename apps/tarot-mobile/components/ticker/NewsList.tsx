import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { Text } from "../ui/Text";
import { Colors, Spacing, Radius } from "../../constants/theme";
import { apiFetch } from "../../lib/api";

interface NewsItem {
  title: string;
  description: string;
  link: string;
  publishedAt: string;
  source: string;
}

interface Props {
  symbol: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export function NewsList({ symbol }: Props) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch<{ items: NewsItem[] }>(`/api/tarot/news?symbol=${encodeURIComponent(symbol)}&limit=8`)
      .then((data) => setNews(data.items))
      .catch(() => setNews([]))
      .finally(() => setLoading(false));
  }, [symbol]);

  if (loading) return null;
  if (news.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text variant="caption" color={Colors.midGrayText} style={styles.sectionLabel}>
        관련 뉴스
      </Text>

      <View style={styles.card}>
        {news.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.newsItem, i < news.length - 1 && styles.newsItemBorder]}
            onPress={() => Linking.openURL(item.link).catch(() => {})}
            activeOpacity={0.7}
          >
            <Text variant="body-sm" color={Colors.whiteout} numberOfLines={2} style={styles.newsTitle}>
              {item.title}
            </Text>
            <View style={styles.newsMeta}>
              <Text variant="caption" color={Colors.midGrayText}>{item.source}</Text>
              <Text variant="caption" color={Colors.ironOutline}>{timeAgo(item.publishedAt)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.s24,
  },
  sectionLabel: {
    marginBottom: Spacing.s8,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.graphiteBase,
    borderRadius: Radius.cards,
    borderWidth: 1,
    borderColor: Colors.carbonBorder,
    overflow: "hidden",
  },
  newsItem: {
    padding: 16,
    gap: 8,
  },
  newsItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.carbonBorder,
  },
  newsTitle: {
    lineHeight: 20,
    fontWeight: "500",
  },
  newsMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
