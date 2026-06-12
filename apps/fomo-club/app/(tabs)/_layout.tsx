import { Tabs } from "expo-router";
import { FomoColors } from "../../constants/fomoTheme";

/** 하단 탭 — 오늘 / 피드 (웹과 동일 2탭). docs/PIVOT_FEED_FIRST.md. */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: FomoColors.ink },
        tabBarStyle: {
          backgroundColor: FomoColors.ink,
          borderTopColor: "#1E1E1E",
        },
        tabBarActiveTintColor: FomoColors.whiteout,
        tabBarInactiveTintColor: "#555",
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="today" options={{ title: "오늘", tabBarIcon: () => null }} />
      <Tabs.Screen name="feed" options={{ title: "피드", tabBarIcon: () => null }} />
    </Tabs>
  );
}
