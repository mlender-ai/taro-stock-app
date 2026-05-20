import * as crypto from "crypto";

const NONCE_SECRET =
  process.env.REWARD_NONCE_SECRET || "dev-reward-nonce-secret-change-in-prod";

export const NONCE_TTL_MS = 10 * 60 * 1000; // 10분

export function issueNonce(userId: string): {
  nonce: string;
  token: string;
  expiresAt: number;
} {
  const nonce = crypto.randomUUID();
  const expiresAt = Date.now() + NONCE_TTL_MS;
  const token = signNonce(nonce, userId, expiresAt);
  return { nonce, token, expiresAt };
}

export function signNonce(
  nonce: string,
  userId: string,
  expiresAt: number
): string {
  return crypto
    .createHmac("sha256", NONCE_SECRET)
    .update(`${nonce}:${userId}:${expiresAt}`)
    .digest("hex");
}

export function verifyNonce(
  nonce: string,
  userId: string,
  token: string,
  expiresAt: number
): boolean {
  if (Date.now() > expiresAt) return false;
  const expected = signNonce(nonce, userId, expiresAt);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(token, "hex")
    );
  } catch {
    return false;
  }
}
