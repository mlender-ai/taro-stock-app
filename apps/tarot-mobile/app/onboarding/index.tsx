import { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import { Colors } from "../../constants/colors";
import { useUserStore } from "../../lib/store";
import { useOnboardingStore } from "../../lib/onboardingStore";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    icon: "✦",
    title: "타로 증권에 오신 것을\n환영합니다",
    desc: "시장의 흐름을 타로 카드로 해석합니다.\n숫자 너머의 직관적 통찰을 경험하세요.",
  },
  {
    icon: "◈",
    title: "종목을 선택하고\n카드를 뽑으세요",
    desc: "관심 종목을 검색한 후\n1장 또는 3장 스프레드로 카드를 뽑을 수 있습니다.",
  },
  {
    icon: "⊡",
    title: "AI가 시장과 카드를\n연결합니다",
    desc: "시장 데이터와 타로 카드의 상징을 결합하여\n신비로운 해석을 생성합니다.",
  },
];

const DISCLAIMER_TEXT = `
이 서비스는 엔터테인먼트 목적의 타로 해석 서비스이며, 투자 조언이 아닙니다.

• 본 앱에서 제공하는 타로 해석은 증권 시장 데이터를 타로 카드의 상징으로 재해석한 것으로, 투자 결정의 근거로 사용할 수 없습니다.

• 모든 투자 결정은 본인의 판단과 책임 하에 이루어져야 합니다.

• 과거 데이터와 타로 해석은 미래 수익을 보장하지 않습니다.

• 본 서비스는 투자 자문업에 해당하지 않으며, 금융투자업에 관한 법률에 따른 투자권유를 하지 않습니다.
`.trim();

export default function OnboardingScreen() {
  const userId = useUserStore((s) => s.userId);
  const { agreeDisclaimer, latestVersion } = useOnboardingStore();
  const [currentPage, setCurrentPage] = useState(0);
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 페이지 전환 시 fade in
  const onMomentumScrollEnd = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentPage(page);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const goNext = () => {
    if (currentPage < SLIDES.length) {
      scrollRef.current?.scrollTo({ x: (currentPage + 1) * width, animated: true });
      setCurrentPage(currentPage + 1);
    }
  };

  const handleAgree = () => {
    if (userId) {
      agreeDisclaimer(userId, latestVersion);
    } else {
      // 비로그인 상태에서는 로컬만 처리
      useOnboardingStore.getState().setShowOnboarding(false);
    }
  };

  const isLastSlide = currentPage === SLIDES.length;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
      >
        {/* 소개 슬라이드들 */}
        {SLIDES.map((slide, i) => (
          <View key={i} style={styles.slide}>
            <View style={styles.slideContent}>
              <Text style={styles.slideIcon}>{slide.icon}</Text>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideDesc}>{slide.desc}</Text>
            </View>
          </View>
        ))}

        {/* 면책 고지 슬라이드 */}
        <View style={styles.slide}>
          <View style={styles.disclaimerSlide}>
            <Text style={styles.disclaimerTitle}>면책 고지</Text>
            <ScrollView
              style={styles.disclaimerScroll}
              nestedScrollEnabled
            >
              <Text style={styles.disclaimerText}>{DISCLAIMER_TEXT}</Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setDisclaimerChecked(!disclaimerChecked)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  disclaimerChecked && styles.checkboxChecked,
                ]}
              >
                {disclaimerChecked && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                위 내용을 모두 읽고 이해했습니다
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 하단 네비게이션 */}
      <View style={styles.footer}>
        {/* 도트 인디케이터 */}
        <View style={styles.dots}>
          {[...SLIDES, { title: "disclaimer" }].map((_, i) => (
            <View
              key={i}
              style={[styles.dot, currentPage === i && styles.dotActive]}
            />
          ))}
        </View>

        {/* 버튼 */}
        {isLastSlide ? (
          <TouchableOpacity
            style={[
              styles.agreeBtn,
              !disclaimerChecked && styles.agreeBtnDisabled,
            ]}
            onPress={handleAgree}
            disabled={!disclaimerChecked}
            activeOpacity={0.8}
          >
            <Text style={styles.agreeBtnText}>동의하고 시작하기</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={goNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextBtnText}>다음</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  // Slides
  slide: { width, flex: 1 },
  slideContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  slideIcon: {
    fontSize: 56,
    color: Colors.gold,
    marginBottom: 24,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.text,
    textAlign: "center",
    lineHeight: 36,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  slideDesc: {
    fontSize: 15,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 24,
  },

  // Disclaimer
  disclaimerSlide: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  disclaimerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  disclaimerScroll: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 16,
  },
  disclaimerText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 22,
    opacity: 0.85,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  checkmark: { fontSize: 13, color: "#fff", fontWeight: "700" },
  checkboxLabel: { fontSize: 14, color: Colors.text },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 20,
    alignItems: "center",
  },
  dots: { flexDirection: "row", gap: 6 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: { backgroundColor: Colors.accent, width: 20 },

  nextBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  nextBtnText: { fontSize: 15, fontWeight: "600", color: Colors.text },

  agreeBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: "center",
  },
  agreeBtnDisabled: { opacity: 0.4 },
  agreeBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
