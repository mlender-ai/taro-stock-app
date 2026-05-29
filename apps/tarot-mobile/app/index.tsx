import React from "react";
import { ScrollView, StyleSheet, View, Text } from "react-native";
import { Colors, Typography } from "../constants/theme";
import StockInsights from "../components/StockInsights";

const MOCK_DATA = {
  ticker: "AAPL",
  marketCondition: "bullish" as const,
  drawnCards: [
    { card: { id: "the-fool", orientation: "upright" }, slot: "past" },
    { card: { id: "the-magician", orientation: "reversed" }, slot: "present" },
    { card: { id: "the-high-priestess", orientation: "upright" }, slot: "future" },
  ],
};

const HomeScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>주요 종목</Text>
        {/* Other components for stock data */}
      </View>
      <StockInsights
        ticker={MOCK_DATA.ticker}
        marketCondition={MOCK_DATA.marketCondition}
        drawnCards={MOCK_DATA.drawnCards}
      />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>뉴스 및 업데이트</Text>
        {/* Other components for news */}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: Typography.size.heading,
    fontWeight: "bold",
    marginBottom: 16,
  },
});

export default HomeScreen;
