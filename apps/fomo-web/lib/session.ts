// 무가입 익명 세션. 첫 방문 시 localStorage에 sessionId 발급/복원.
// docs/FOMO_CLUB.md 정직한 숫자 원칙 — 가입 없이 감정 선택이 곧 데이터.
const KEY = "fomo_session_id";

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(KEY, id);
  }
  return id;
}
