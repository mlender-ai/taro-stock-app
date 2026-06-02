/**
 * Slack Agent Team — Stage B: 슬랙 자율 회의의 가드레일 코어 (순수 로직).
 *
 * docs/AGENT_TEAM_VISION.md §3(B) 구현. 회의 가드레일은 비용·노이즈 1순위 리스크(§5)라
 * 기능보다 먼저 설계한다: 라운드 제한 · 관련 축만 소집 · 중복 차단 · (금지 게이트는 runner에서
 * scripts/constraints.ts checkViolations 재사용).
 *
 * 순수 함수만 — 추가 LLM 콜·외부 의존 없음. apps/web/__tests__/slack-meeting.test.ts 검증.
 * 실제 발언 생성·슬랙 발화는 scripts/council-meeting.ts 가 이 모듈 + agents.ts 를 써서 수행.
 */

import type { AxisId } from "./agents";

/** 회의 참가 가능한 축 (default/Hermes 는 운영봇 — 회의 참가자 아님). */
export type MeetingAxis = Exclude<AxisId, "default">;

export type TopicCategory =
  | "ui"
  | "product"
  | "backend"
  | "security"
  | "compliance"
  | "general";

/** 라운드 제한 — 무한 수다 금지 (§5). 축당 1발언 + 1반박. */
export const MAX_STATEMENTS_PER_AXIS = 1;
export const MAX_REBUTTALS_PER_AXIS = 1;

/** 안건 종류 → 관련 축만 소집. 모든 안건에 3축 전부 부르지 않는다(노이즈 통제). */
export const PARTICIPANTS: Record<TopicCategory, MeetingAxis[]> = {
  ui: ["pm", "cto"],
  product: ["pm", "cto"],
  backend: ["cto"],
  security: ["security", "cto"],
  compliance: ["security", "pm"],
  general: ["pm", "cto", "security"], // 분류 불가 시에만 전체
};

// 분류 키워드 — security/compliance 를 먼저(안전 우선), 그다음 ui/backend/product.
const COMPLIANCE_RE = /규제|금칙어|약관|개인정보|컴플라이언스|법적|투자\s*조언/i;
const SECURITY_RE = /보안|취약점|security|인증|결제\s*보안|유출|공격|owasp/i;
const UI_RE = /화면|레이아웃|컴포넌트|디자인|ui\b|버튼|색상|타이포|여백|애니메이션/i;
const BACKEND_RE = /api\b|캐싱|쿼리|성능|서버|데이터\s*모델|마이그레이션|엔드포인트/i;
const PRODUCT_RE = /사용자|유저|기능|우선순위|리텐션|온보딩|kpi|가치|로드맵|전환|마케팅/i;

/** 안건 텍스트를 종류로 분류 (결정론적 키워드). */
export function classifyTopic(text: string): TopicCategory {
  if (COMPLIANCE_RE.test(text)) return "compliance";
  if (SECURITY_RE.test(text)) return "security";
  if (UI_RE.test(text)) return "ui";
  if (BACKEND_RE.test(text)) return "backend";
  if (PRODUCT_RE.test(text)) return "product";
  return "general";
}

/** 안건에 소집할 관련 축 목록. */
export function selectParticipants(text: string): MeetingAxis[] {
  return PARTICIPANTS[classifyTopic(text)];
}

/**
 * 문자 bigram 집합. 한국어 조사("배너를" vs "배너")에 강건하도록 단어 토큰이 아니라
 * 공백·문장부호 제거 후 인접 문자쌍으로 비교한다.
 */
function charBigrams(text: string): Set<string> {
  const s = (text || "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  const out = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2));
  return out;
}

/** Jaccard 유사도 (집합 교집합/합집합). */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

/**
 * 중복 안건 차단: 이미 done/killed 된 안건 제목과 유사하면 재회의 금지(§3 B, Phase 1 원장 재사용).
 * 보수적 임계(0.5) — 거짓양성 최소화.
 */
export function isDuplicateAgenda(
  agenda: string,
  priorTitles: string[],
  threshold = 0.5,
): boolean {
  const a = charBigrams(agenda);
  if (a.size === 0) return false;
  for (const t of priorTitles) {
    if (jaccard(a, charBigrams(t)) >= threshold) return true;
  }
  return false;
}

export interface AxisStance {
  axis: MeetingAxis;
  /** 이 축이 안건에 반대(반박)했는가 */
  oppose: boolean;
}

export interface ConsensusResult {
  consensus: boolean;
  /** 합의 실패 → CEO 호출 필요 (Stage D 연결) */
  needsCEO: boolean;
  opposers: MeetingAxis[];
}

/** 합의 판정: 반대한 축이 하나도 없으면 합의, 있으면 CEO 호출. */
export function detectConsensus(stances: AxisStance[]): ConsensusResult {
  const opposers = stances.filter((s) => s.oppose).map((s) => s.axis);
  const consensus = opposers.length === 0;
  return { consensus, needsCEO: !consensus, opposers };
}
