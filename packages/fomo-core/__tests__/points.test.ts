import { describe, it, expect } from "vitest";
import {
  POINT_RULES,
  POINT_ACTIONS,
  isPointAction,
  pointsForAction,
  isValidTx,
  totalPoints,
  isChallengeStatus,
  pendingChallenge,
  shouldAwardOnComplete,
  type PointTx,
} from "../src/points";

// ─── 1. 적립 규칙 ───────────────────────────────────────────────────────────
describe("POINT_RULES / pointsForAction", () => {
  it("감정 투표 5점, 챌린지 완료 10점", () => {
    expect(POINT_RULES.emotion_vote).toBe(5);
    expect(POINT_RULES.challenge_complete).toBe(10);
  });

  it("pointsForAction이 규칙값을 그대로 반환", () => {
    expect(pointsForAction("emotion_vote")).toBe(5);
    expect(pointsForAction("challenge_complete")).toBe(10);
  });

  it("POINT_ACTIONS는 규칙 키와 일치", () => {
    expect([...POINT_ACTIONS].sort()).toEqual(Object.keys(POINT_RULES).sort());
  });
});

describe("isPointAction", () => {
  it("알려진 행동만 true", () => {
    expect(isPointAction("emotion_vote")).toBe(true);
    expect(isPointAction("challenge_complete")).toBe(true);
  });
  it("알 수 없는 값은 false", () => {
    expect(isPointAction("foo")).toBe(false);
    expect(isPointAction(5)).toBe(false);
    expect(isPointAction(null)).toBe(false);
  });
});

// ─── 2. 트랜잭션 무결성 ─────────────────────────────────────────────────────
describe("isValidTx (데이터 무결성)", () => {
  it("규칙과 일치하는 tx는 유효", () => {
    expect(isValidTx({ action: "emotion_vote", amount: 5 })).toBe(true);
    expect(isValidTx({ action: "challenge_complete", amount: 10 })).toBe(true);
  });
  it("amount가 규칙과 다르면 무효(오염 차단)", () => {
    expect(isValidTx({ action: "emotion_vote", amount: 9999 })).toBe(false);
    expect(isValidTx({ action: "challenge_complete", amount: 5 })).toBe(false);
  });
  it("알 수 없는 action은 무효", () => {
    expect(isValidTx({ action: "hack", amount: 5 })).toBe(false);
  });
  it("음수 amount는 무효", () => {
    expect(isValidTx({ action: "emotion_vote", amount: -5 })).toBe(false);
  });
});

// ─── 3. 총점 합산 ───────────────────────────────────────────────────────────
describe("totalPoints (적립 총점)", () => {
  it("유효 tx 합산", () => {
    const txs: PointTx[] = [
      { action: "emotion_vote", amount: 5 },
      { action: "challenge_complete", amount: 10 },
      { action: "emotion_vote", amount: 5 },
    ];
    expect(totalPoints(txs)).toBe(20);
  });

  it("빈 로그는 0 (정직한 폴백)", () => {
    expect(totalPoints([])).toBe(0);
  });

  it("무결성 위반 tx는 총점에서 제외(부풀림 방지)", () => {
    const txs: PointTx[] = [
      { action: "emotion_vote", amount: 5 }, // 유효 → +5
      { action: "challenge_complete", amount: 99999 }, // 위조 amount → 제외
      { action: "hack", amount: 100 }, // 알 수 없는 action → 제외
    ];
    expect(totalPoints(txs)).toBe(5);
  });
});

// ─── 4. 챌린지 상태 ─────────────────────────────────────────────────────────
describe("챌린지 상태", () => {
  it("isChallengeStatus는 pending|completed만 허용", () => {
    expect(isChallengeStatus("pending")).toBe(true);
    expect(isChallengeStatus("completed")).toBe(true);
    expect(isChallengeStatus("done")).toBe(false);
  });

  it("pendingChallenge는 안전 폴백 상태 반환", () => {
    expect(pendingChallenge("2026-06-10")).toEqual({ date: "2026-06-10", status: "pending" });
  });

  it("shouldAwardOnComplete: 미완료에서만 적립 허용(멱등)", () => {
    expect(shouldAwardOnComplete(null)).toBe(true);
    expect(shouldAwardOnComplete("pending")).toBe(true);
    expect(shouldAwardOnComplete("completed")).toBe(false); // 이미 완료 → 중복 적립 금지
  });
});
