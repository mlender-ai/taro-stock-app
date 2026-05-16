import { create } from "zustand";
import { apiFetch } from "./api";

interface OnboardingState {
  hasAgreed: boolean;
  currentVersion: string | null;
  latestVersion: string;
  needsUpdate: boolean;
  loading: boolean;
  showOnboarding: boolean;

  checkDisclaimer: (userId: string) => Promise<void>;
  agreeDisclaimer: (userId: string, version: string) => Promise<void>;
  setShowOnboarding: (show: boolean) => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasAgreed: false,
  currentVersion: null,
  latestVersion: "V1",
  needsUpdate: false,
  loading: true,
  showOnboarding: false,

  checkDisclaimer: async (userId) => {
    set({ loading: true });
    try {
      const data = await apiFetch<{
        hasAgreed: boolean;
        version: string | null;
        latestVersion: string;
        needsUpdate: boolean;
      }>(`/api/tarot/disclaimer?userId=${userId}`);

      set({
        hasAgreed: data.hasAgreed,
        currentVersion: data.version,
        latestVersion: data.latestVersion,
        needsUpdate: data.needsUpdate,
        showOnboarding: !data.hasAgreed || data.needsUpdate,
        loading: false,
      });
    } catch {
      // 조회 실패 시 온보딩 표시
      set({ showOnboarding: true, loading: false });
    }
  },

  agreeDisclaimer: async (userId, version) => {
    try {
      await apiFetch("/api/tarot/disclaimer", {
        method: "POST",
        body: JSON.stringify({ userId, version }),
      });
      set({
        hasAgreed: true,
        currentVersion: version,
        needsUpdate: false,
        showOnboarding: false,
      });
    } catch {
      // 실패해도 로컬에서는 진행 허용
      set({ showOnboarding: false });
    }
  },

  setShowOnboarding: (show) => set({ showOnboarding: show }),
}));
