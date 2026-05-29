import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Typography } from "../constants/theme";
import type { DrawnCard, MarketCondition } from "@tarot/core";
import { generateStockInsights } from "../lib/stockInsights";

interface StockInsightsProps {
  ticker: string;
  marketCondition: MarketCondition;
  drawnCards: DrawnCard[];
}

const StockInsights: React.FC<StockInsightsProps> = ({ ticker, marketCondition, drawnCards }) => {
  const insights = generateStockInsights(ticker, drawnCards, marketCondition);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>타로 기반 투자 인사이트</Text>
      {insights.map((insight, index) => (
        <Text key={index} style={styles.insightText}>
          - {insight}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 8,
    borderColor: Colors.border,
    borderWidth: 1,
    marginVertical: 16,
  },
  title: {
    color: Colors.text,
    fontSize: Typography.size.heading,
    fontWeight: "bold",
    marginBottom: 12,
  },
  insightText: {
    color: Colors.text,
    fontSize: Typography.size.body,
    marginBottom: 8,
  },
});

export default StockInsights;
