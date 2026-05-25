import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "../ui/Text";
import { Colors, Spacing, Radius } from "../../constants/theme";
import { TickerLogo } from "../TickerLogo";

interface CompanyProfile {
  sector: string;
  industry: string;
  employees: number | null;
  summary: string;
  website: string;
}

interface Props {
  symbol: string;
  name: string;
  exchange: string;
  profile: CompanyProfile;
}

export function CompanyInfo({ symbol, name, exchange, profile }: Props) {
  const [expanded, setExpanded] = useState(false);
  const hasSummary = profile.summary.length > 0;

  return (
    <View style={styles.container}>
      <Text variant="caption" color={Colors.midGrayText} style={styles.sectionLabel}>
        회사 정보
      </Text>

      <View style={styles.card}>
        {/* Header */}
        <View style={styles.companyHeader}>
          <TickerLogo ticker={symbol} size={56} />
          <View style={styles.headerMeta}>
            <Text variant="subheading" color={Colors.whiteout} style={styles.companyName}>
              {name}
            </Text>
            <Text variant="caption" color={Colors.midGrayText}>
              {exchange}
            </Text>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.badgeRow}>
          {profile.sector ? (
            <View style={styles.badge}>
              <Text variant="caption" color={Colors.taroEssence}>{profile.sector}</Text>
            </View>
          ) : null}
          {profile.industry ? (
            <View style={styles.badge}>
              <Text variant="caption" color={Colors.silverHighlight}>{profile.industry}</Text>
            </View>
          ) : null}
          {profile.employees ? (
            <View style={styles.badge}>
              <Text variant="caption" color={Colors.silverHighlight}>
                직원 {profile.employees.toLocaleString()}명
              </Text>
            </View>
          ) : null}
        </View>

        {/* Summary */}
        {hasSummary && (
          <View style={styles.summarySection}>
            <Text
              variant="body-sm"
              color={Colors.midGrayText}
              style={styles.summaryText}
              numberOfLines={expanded ? undefined : 3}
            >
              {profile.summary}
            </Text>
            {profile.summary.length > 150 && (
              <TouchableOpacity onPress={() => setExpanded((p) => !p)} style={styles.expandBtn}>
                <Text variant="caption" color={Colors.taroEssence}>
                  {expanded ? "접기" : "더보기"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
    padding: Spacing.s24,
    borderWidth: 1,
    borderColor: Colors.carbonBorder,
    gap: 16,
  },
  companyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  headerMeta: {
    flex: 1,
    gap: 2,
  },
  companyName: {
    fontWeight: "700",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    backgroundColor: Colors.ebonyCanvas,
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.carbonBorder,
  },
  summarySection: {
    gap: 4,
  },
  summaryText: {
    lineHeight: 20,
  },
  expandBtn: {
    alignSelf: "flex-start",
    paddingVertical: 2,
  },
});
