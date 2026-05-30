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
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              variant="body-sm"
              color={isActive ? Colors.taroEssence : Colors.ironOutline}
              style={isActive ? styles.labelActive : styles.labelInactive}
            >
              {tab.label}
            </Text>
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
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: Colors.taroEssence,
    backgroundColor: `${Colors.taroEssence}10`,
  },
  labelActive: {
    fontWeight: "700",
    fontSize: 14,
  },
  labelInactive: {
    fontWeight: "400",
    fontSize: 14,
    opacity: 0.55,
  },
});
