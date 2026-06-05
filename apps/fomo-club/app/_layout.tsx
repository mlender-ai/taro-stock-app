import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { FomoColors } from "../constants/fomoTheme";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: FomoColors.ink },
          animation: "fade",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="login/index" options={{ presentation: "modal" }} />
      </Stack>
    </>
  );
}
