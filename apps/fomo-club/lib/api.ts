import Constants from "expo-constants";

// FOMO API 베이스. app.json extra.apiBaseUrl → EXPO_PUBLIC_FOMO_API_URL → 배포 prod.
const configured = (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined)?.trim();
export const API_BASE = (
  (configured && configured.length > 0 ? configured : undefined) ??
  process.env.EXPO_PUBLIC_FOMO_API_URL ??
  "https://taro-stock-web.vercel.app"
).replace(/\/$/, "");

// 익명 세션 ID — MVP: 앱 실행 단위 랜덤. (후속: expo-secure-store로 영속화)
let _sessionId: string | null = null;
export function getSessionId(): string {
  if (!_sessionId) {
    _sessionId = `m_${Date.now()}_${Math.floor(Math.random() * 1e9).toString(36)}`;
  }
  return _sessionId;
}

export interface FomoIndexResponse {
  date: string;
  score: number;
  state: string;
  components: { market: number; community: number; emotion: number; whale: number };
  aiSummary: string;
  prevDayDelta: number;
  avg30Delta: number;
  live: boolean;
}

export interface TallyResponse {
  date: string;
  total: number;
  counts: Record<string, number>;
  ratios: Record<string, number>;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} ${res.status}`);
  return res.json() as Promise<T>;
}

export const fetchIndex = () => get<FomoIndexResponse>("/api/fomo/index");
export const fetchToday = () => get<TallyResponse>("/api/fomo/emotions/today");

export async function postVote(emotion: string): Promise<TallyResponse & { mine: string }> {
  const res = await fetch(`${API_BASE}/api/fomo/emotions/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: getSessionId(), emotion, source: "mobile" }),
  });
  if (!res.ok) throw new Error(`vote ${res.status}`);
  return res.json();
}
