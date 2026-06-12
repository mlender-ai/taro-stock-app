import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { scoreToFace } from "@fomo/core";
import { FomoFace } from "../components/FomoFace";
import { FomoColors, Spacing, Radius } from "../constants/fomoTheme";

/**
 * 첫 진입 = 로그인 화면. docs/PIVOT_FEED_FIRST.md.
 * 가입 없이 둘러보기 가능(익명 세션). 카카오 실연동은 후속(EAS 빌드+카카오 앱키 필요).
 */
export default function Login() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.logo}>FOMO CLUB</Text>
        <FomoFace face={scoreToFace(55)} size={120} glow={FomoColors.emotion.conviction} />
        <Text style={styles.tagline}>놓친 것 같은 밤, 너만 그런 거 아니야.</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.kakao}
          onPress={() =>
            Alert.alert("카카오 로그인", "곧 추가될 예정이에요. 지금은 둘러보기로 시작할 수 있어요.")
          }
        >
          <Text style={styles.kakaoText}>카카오로 시작하기</Text>
        </Pressable>
        <Pressable style={styles.browse} onPress={() => router.replace("/today")}>
          <Text style={styles.browseText}>가입 없이 둘러보기</Text>
        </Pressable>
        <Text style={styles.note}>로그인은 선택이에요. 기록을 저장하려면 나중에 가입할 수 있어요.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: FomoColors.ink, paddingHorizontal: Spacing.s24 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.s24 },
  logo: { color: FomoColors.whiteout, fontSize: 22, fontWeight: "700", letterSpacing: 1 },
  tagline: { color: FomoColors.muted, fontSize: 14, textAlign: "center", lineHeight: 22 },
  actions: { paddingBottom: Spacing.s40, gap: Spacing.s12 },
  kakao: {
    backgroundColor: "#FEE500",
    borderRadius: Radius.md,
    paddingVertical: Spacing.s16,
    alignItems: "center",
  },
  kakaoText: { color: "#191600", fontSize: 15, fontWeight: "700" },
  browse: {
    borderWidth: 1,
    borderColor: FomoColors.hairline,
    borderRadius: Radius.md,
    paddingVertical: Spacing.s16,
    alignItems: "center",
  },
  browseText: { color: FomoColors.whiteout, fontSize: 15, fontWeight: "600" },
  note: { color: FomoColors.muted, fontSize: 12, textAlign: "center", marginTop: Spacing.s8 },
});
