import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "../ui/Text";
import { Colors } from "../../constants/theme";

export type TickerTab = "chart" | "info";

interface Props {
  activeTab: TickerTab;
  onTabChange: (tab: TickerTab) => void;
}

const TABS: { key: TickerTab; label: string }[] = [
  { key: "chart", label: "차트" },
  { key: "info", label: "종목정보" },
];

export function TabBar({ activeTab, onTabChange }: Props) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text
              variant="body-sm"
              color={isActive ? Colors.whiteout : Colors.midGrayText}
              style={isActive ? styles.labelActive : styles.labelInactive}
            >
              {tab.label}
            </Text>
            {/* 활성 탭 인디케이터 — 토스증권 패턴: 선택 상태를 하단 바로 명확히 표시 */}
            {isActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.carbonBorder,
    backgroundColor: Colors.ebonyCanvas,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: Colors.taroEssence,
  },
  labelActive: {
    fontWeight: "700",
    fontSize: 15,
  },
  labelInactive: {
    fontWeight: "400",
    fontSize: 15,
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    left: "20%",
    right: "20%",
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.taroEssence,
  },
});

