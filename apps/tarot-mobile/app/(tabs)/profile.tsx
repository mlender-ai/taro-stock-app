import { useEffect, useState, useCallback } from "react";
import {
  SafeAreaView, View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { Colors } from "../../constants/colors";
import { useUserStore } from "../../lib/store";
import { apiFetch } from "../../lib/api";
import { useRewardedAd } from "../../lib/ads/useRewardedAd";
import { getOfferings, purchaseAndVerify, initRevenueCat, type CreditPackage } from "../../lib/iap/purchases";

export default function ProfileScreen() {
  const { userId, credits, isLoggedIn, setCredits } = useUserStore();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [purchasing, setPurchasing] = useState(false);

  const refreshCredits = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const data = await apiFetch<{ credits: number }>("/api/tarot/credits");
      setCredits(data.credits);
    } catch {}
  }, [isLoggedIn, setCredits]);

  const { status: adStatus, errorMessage, load: loadAd, show: showAd, resetStatus } = useRewardedAd();

  useEffect(() => {
    if (!isLoggedIn) return;
    initRevenueCat(userId ?? undefined);
    refreshCredits();
    getOfferings().then(setPackages).catch(() => {});
  }, [isLoggedIn, userId, refreshCredits]);

  const handlePurchase = async (pkg: CreditPackage) => {
    if (purchasing) return;
    setPurchasing(true);
    try {
      const result = await purchaseAndVerify(pkg);
      Alert.alert("구매 완료!", `+${result.purchased} 크레딧 (잔액: ${result.credits})`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "구매 중 오류";
      if (!msg.includes("cancel")) Alert.alert("구매 실패", msg);
    } finally {
      setPurchasing(false);
    }
  };

  const handleWatchAd = () => {
    if (adStatus === "idle" || adStatus === "error") {
      loadAd();
    } else if (adStatus === "ready") {
      showAd();
    }
  };

  // 리워드 지급 완료 시 알림
  useEffect(() => {
    if (adStatus === "earned") {
      Alert.alert("크레딧 지급!", "+1 크레딧이 추가됐습니다");
      resetStatus();
    }
  }, [adStatus, resetStatus]);

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.placeholder}>로그인하면 프로필이 표시됩니다</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>크레딧</Text>
        <Text style={styles.balance}>{credits} 크레딧</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={refreshCredits}>
          <Text style={styles.refreshText}>새로고침</Text>
        </TouchableOpacity>
      </View>

      {/* 리워드 광고 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>광고 시청 (+1 크레딧)</Text>
        {(adStatus === "idle" || adStatus === "error") && (
          <TouchableOpacity style={styles.btn} onPress={handleWatchAd}>
            <Text style={styles.btnText}>
              {adStatus === "error" ? (errorMessage ?? "다시 시도") : "광고 불러오기"}
            </Text>
          </TouchableOpacity>
        )}
        {adStatus === "loading" && <ActivityIndicator color={Colors.accent} />}
        {adStatus === "ready" && (
          <TouchableOpacity style={[styles.btn, styles.btnGold]} onPress={showAd}>
            <Text style={styles.btnText}>광고 시청하기</Text>
          </TouchableOpacity>
        )}
        {adStatus === "showing" && <ActivityIndicator color={Colors.accent} />}
      </View>

      {/* IAP 크레딧 구매 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>크레딧 구매</Text>
        {packages.length === 0 && (
          <Text style={styles.muted}>상품을 불러오는 중...</Text>
        )}
        {packages.map((pkg) => (
          <TouchableOpacity
            key={pkg.identifier}
            style={styles.btn}
            onPress={() => handlePurchase(pkg)}
            disabled={purchasing}
          >
            <Text style={styles.btnText}>
              {pkg.credits} 크레딧 — {pkg.localizedPrice}
            </Text>
          </TouchableOpacity>
        ))}
        {purchasing && <ActivityIndicator color={Colors.accent} style={{ marginTop: 8 }} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.bg },
  center:        { flex: 1, alignItems: "center", justifyContent: "center" },
  placeholder:   { fontSize: 14, color: Colors.muted },
  section:       { paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sectionTitle:  { fontSize: 12, color: Colors.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 },
  balance:       { fontSize: 36, fontWeight: "700", color: Colors.gold, marginBottom: 8 },
  refreshBtn:    { alignSelf: "flex-start" },
  refreshText:   { fontSize: 13, color: Colors.accent },
  btn:           { backgroundColor: Colors.card, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 10, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  btnGold:       { borderColor: Colors.gold },
  btnText:       { fontSize: 15, color: Colors.text, fontWeight: "500" },
  muted:         { fontSize: 13, color: Colors.muted },
});
