/**
 * FOMO Club — 게임화 포인트 + 데일리 챌린지 순수 로직 (P2).
 *
 * DB 의존 없는 순수 함수만 둔다(집계·검증). 영속화는 apps/web API가 담당.
 * 정직한 숫자 원칙: 적립은 규칙(POINT_RULES)으로만 산정하며, 기록된 amount가
 * 규칙과 다르면 신뢰하지 않는다(데이터 무결성).
 */

/** 포인트를 적립시키는 행동. 감정 투표 / 챌린지 완료. */
export type PointAction = "emotion_vote" | "challenge_complete";

/** 행동별 적립 포인트(고정 규칙). 임의 수치 금지 — 이 표가 단일 소스. */
export const POINT_RULES: Record<PointAction, number> = {
  emotion_vote: 5,
  challenge_complete: 10,
};

export const POINT_ACTIONS: readonly PointAction[] = [
  "emotion_vote",
  "challenge_complete",
] as const;

export function isPointAction(v: unknown): v is PointAction {
  return typeof v === "string" && (POINT_ACTIONS as readonly string[]).includes(v);
}

/** 행동에 대한 적립 포인트. 알 수 없는 행동은 0. */
export function pointsForAction(action: PointAction): number {
  return POINT_RULES[action] ?? 0;
}

/** 포인트 트랜잭션 로그 한 건(영속 모델의 부분 형태). */
export interface PointTx {
  action: string;
  amount: number;
}

/**
 * 트랜잭션 한 건의 무결성 검증.
 * - action이 알려진 행동이어야 하고
 * - amount가 규칙값과 정확히 일치해야 한다.
 */
export function isValidTx(tx: PointTx): boolean {
  return isPointAction(tx.action) && tx.amount === POINT_RULES[tx.action];
}

/**
 * 트랜잭션 로그 합산 → 적립 총점.
 * 무결성 위반(알 수 없는 action, 규칙과 다른 amount, 음수)은 0으로 보정한다.
 * 가짜/오염된 수치가 총점을 부풀리지 못하게 한다.
 */
export function totalPoints(txs: readonly PointTx[]): number {
  return txs.reduce((sum, t) => (isValidTx(t) ? sum + POINT_RULES[t.action as PointAction] : sum), 0);
}

/** 데일리 챌린지 진행 상태. */
export type ChallengeStatus = "pending" | "completed";

export const CHALLENGE_STATUSES: readonly ChallengeStatus[] = ["pending", "completed"] as const;

export function isChallengeStatus(v: unknown): v is ChallengeStatus {
  return typeof v === "string" && (CHALLENGE_STATUSES as readonly string[]).includes(v);
}

/** 챌린지 상태 스냅샷(조회 응답용). */
export interface ChallengeState {
  date: string;
  status: ChallengeStatus;
}

/** 미참여(레코드 없음) 세션의 안전 폴백 상태. */
export function pendingChallenge(date: string): ChallengeState {
  return { date, status: "pending" };
}

/** 완료 처리가 새 적립을 유발하는지(이미 완료면 중복 적립 금지 — 멱등). */
export function shouldAwardOnComplete(prev: ChallengeStatus | null | undefined): boolean {
  return prev !== "completed";
}
