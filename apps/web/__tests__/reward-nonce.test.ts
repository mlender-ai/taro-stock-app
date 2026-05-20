import { describe, it, expect, vi } from "vitest";
import { issueNonce, verifyNonce, signNonce } from "@/lib/tarot/rewardNonce";

describe("rewardNonce", () => {
  it("issued nonce verifies successfully", () => {
    const { nonce, token, expiresAt } = issueNonce("user-1");
    expect(verifyNonce(nonce, "user-1", token, expiresAt)).toBe(true);
  });

  it("rejects wrong userId", () => {
    const { nonce, token, expiresAt } = issueNonce("user-1");
    expect(verifyNonce(nonce, "user-2", token, expiresAt)).toBe(false);
  });

  it("rejects tampered token", () => {
    const { nonce, expiresAt } = issueNonce("user-1");
    expect(verifyNonce(nonce, "user-1", "deadbeef".repeat(8), expiresAt)).toBe(false);
  });

  it("rejects expired nonce", () => {
    const nonce = "test-nonce";
    const expiresAt = Date.now() - 1000; // already expired
    const token = signNonce(nonce, "user-1", expiresAt);
    expect(verifyNonce(nonce, "user-1", token, expiresAt)).toBe(false);
  });

  it("rejects future expiresAt with different token", () => {
    const { nonce, token, expiresAt } = issueNonce("user-1");
    // Attacker tries to extend TTL by changing expiresAt
    expect(verifyNonce(nonce, "user-1", token, expiresAt + 1000)).toBe(false);
  });

  it("each issued nonce is unique", () => {
    const a = issueNonce("user-1");
    const b = issueNonce("user-1");
    expect(a.nonce).not.toBe(b.nonce);
    expect(a.token).not.toBe(b.token);
  });
});
