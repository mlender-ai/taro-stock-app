import Constants from "expo-constants";

// 우선순위: app config extra(apiBaseUrl) → EXPO_PUBLIC_FOMO_API_URL → 빈값(미연동).
// Phase 1에서는 호출 없음 — Phase 3에서 /api/fomo/* 연동.
const configured = (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined)?.trim();
export const API_BASE =
  (configured && configured.length > 0 ? configured : undefined) ??
  process.env.EXPO_PUBLIC_FOMO_API_URL ??
  "";

interface ApiError {
  error: string;
  code: string;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  if (!API_BASE) {
    throw new Error("API_BASE 미설정 — Phase 3에서 연동 예정");
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as Partial<ApiError>;
    throw new Error(body.error ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}
