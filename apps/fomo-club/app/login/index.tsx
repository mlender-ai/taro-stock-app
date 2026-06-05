import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { FomoColors, Spacing } from "../../constants/fomoTheme";

export default function Login() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>로그인</Text>
        <Link href="/settings" style={styles.link}>닫기</Link>
      </View>
      <Text style={styles.body}>
        로그인은 선택입니다. 가입 없이도 감정 선택과 FOMO Index 확인이 가능합니다.
        {"\n"}소셜 로그인 실연동은 Phase 5에서 추가됩니다.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: FomoColors.ink, paddingHorizontal: Spacing.s24, paddingTop: Spacing.s16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.s32 },
  title: { color: FomoColors.whiteout, fontSize: 18, fontWeight: "600" },
  link: { color: FomoColors.muted, fontSize: 14 },
  body: { color: FomoColors.muted, fontSize: 14, lineHeight: 24 },
});
