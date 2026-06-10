import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.SESSION_HMAC_SECRET ?? "dev-hmac-secret-change-in-prod";

/**
 * sessionId → HMAC-SHA256 서명 생성.
 * 클라이언트가 session/create 엔드포인트에서 발급받아 저장한다.
 */
export function signSessionId(sessionId: string): string {
  return createHmac("sha256", SECRET).update(sessionId).digest("hex");
}

/**
 * 서명 검증. timing-safe 비교로 타이밍 공격 방지.
 * 서명 불일치 시 false를 반환하며, 호출부에서 로깅과 처리를 담당한다.
 */
export function verifySessionSig(sessionId: string, sig: string): boolean {
  if (!sig) return false;
  const expected = signSessionId(sessionId);
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(sig, "hex"));
  } catch {
    // 길이 불일치 등 버퍼 오류 — 위변조로 간주
    return false;
  }
}
