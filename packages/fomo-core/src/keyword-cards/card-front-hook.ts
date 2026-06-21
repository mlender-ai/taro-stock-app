// PHASE0_CARD_FRONT_HOOK — 카드 앞면 후킹(순수부).
//
// 모든 종목 카드가 똑같은 "이 종목, 오늘 어떤 흐름인지 한번 볼까요?"(후킹 0) 대신,
// 그날 그 종목의 *가장 센 객관 신호 한 줄 + 쉬운 번역 한 줄*로 교체한다.
// 점수·등급·판정 없이 **사실(주목도)만**. 같은 입력=같은 출력(결정적 — 캐시·새로고침 안정).
//
// 신호 우선순위(§3, 위에서부터 데이터 있는 첫 신호):
//   1) 가격 이벤트(등락 ≥±3% OR 52주 신고가 부근)  2) 거래량(평소 ≥1.8배)
//   3) 수급(외인/기관 ≥3일 연속)  4) 뉴스/공시(발굴 근거)  5) (없음) 잠잠 + 회사 한 줄
//
// 비용방어(§5): 앞면 신호는 baseline 데이터로 **규칙 기반**(LLM 0, 싸게 항상). LLM 번역은 깊이 페이지 몫.

import { isCommentSafe } from "./comment";
import type { StockBasics } from "../stock-basics";

/** 카드 앞면 후킹에 쓰는 신호 묶음 — 데이터 되는 것만 채운다(없으면 그 우선순위는 스킵). */
export interface CardFrontSignals {
  /** 등락률 %(부호 포함, 장 기준). 우선순위 1. */
  changePct?: number;
  /** 52주 신고가 부근/돌파. 우선순위 1 보강. */
  near52WeekHigh?: boolean;
  /** 평소 대비 거래량 배수. 우선순위 2(데이터 되면). */
  volumeRatio?: number;
  /** 외국인 연속 순매수(+)/순매도(−) 일수. 우선순위 3(데이터 되면). */
  foreignNetStreak?: number;
  /** 그날 그 종목이 묶인 근거(#560 발굴). 우선순위 4. */
  reason?: string;
  /** 회사 정체성 한 줄 — 잠잠 fallback 보조(있으면). */
  identity?: string;
  /** 시점 라벨 — 예 "6/21". 없으면 "오늘". */
  asOf?: string;
}

/** 어느 신호가 채택됐는지(배지·테스트용). */
export type CardFrontSource = "price" | "volume" | "supply" | "news" | "quiet";

export interface CardFrontHook {
  /** 2행 — 가장 센 객관 신호 1줄(숫자·시점 포함). */
  headline: string;
  /** 3행 — 쉬운 번역(사실 묘사, 판정 아님). 없으면 빈 문자열. */
  translation: string;
  /** 4행 — 반대 방향의 사실(있을 때만, 억지 금지). */
  balance?: string;
  /** 채택된 신호 종류. */
  source: CardFrontSource;
}

// ── 임계값(§3, "가짜 흥분" 금지) ─────────────────────────────────────────────
export const FRONT_PRICE_PCT_MIN = 3; // 등락 ≥ ±3%
export const FRONT_VOLUME_RATIO_MIN = 1.8; // 거래량 평소 대비 ≥ 1.8배
export const FRONT_SUPPLY_STREAK_MIN = 3; // 수급 ≥ 3일 연속

// 판정·추천·예측 어휘는 isCommentSafe 로 거르고, 점수/등급류만 추가로 막는다(§5).
const FRONT_JUDGMENT =
  /점수|등급|[SAB]\s?급|최우수|유망|강력\s?매수|적극\s?매수|꼭\s?사|놓치면|지금\s?사/;

/** 후킹 텍스트가 가드를 통과하는가(투자조언·예측·점수·등급 없음). */
export function isFrontHookSafe(text: string): boolean {
  // 순매수/순매도는 수급 '사실'(행동 지시 아님) — 가드의 매수/매도 부분일치에서 제외하고 검사.
  const neutral = text.replace(/순매수|순매도/g, "수급");
  return isCommentSafe(neutral) && !FRONT_JUDGMENT.test(neutral);
}

/** 등락률 → "+6.2%" / "-4.1%" / "0.0%". */
function fmtPct(p: number): string {
  const sign = p > 0 ? "+" : p < 0 ? "-" : "";
  return `${sign}${Math.abs(p).toFixed(1)}%`;
}

function whenLabel(asOf?: string): string {
  return asOf && asOf.trim() ? `${asOf.trim()} 기준` : "오늘";
}

function priceHook(sig: CardFrontSignals): CardFrontHook | null {
  const pct = typeof sig.changePct === "number" && Number.isFinite(sig.changePct) ? sig.changePct : undefined;
  const strong = pct !== undefined && Math.abs(pct) >= FRONT_PRICE_PCT_MIN;
  if (!strong && !sig.near52WeekHigh) return null;
  const when = whenLabel(sig.asOf);
  let headline: string;
  if (sig.near52WeekHigh && strong) headline = `${when} ${fmtPct(pct!)} · 52주 신고가 부근`;
  else if (sig.near52WeekHigh) headline = `${when} 52주 신고가 부근`;
  else headline = `${when} ${fmtPct(pct!)}`;

  const up = (pct ?? 0) > 0 || (!!sig.near52WeekHigh && (pct ?? 0) >= 0);
  const translation = sig.near52WeekHigh
    ? "최근 1년 중 가장 높은 가격대에 시선이 모이는 중이에요."
    : up
      ? "오늘 가격이 위쪽으로 크게 움직였어요."
      : "오늘 가격이 아래쪽으로 크게 움직였어요.";

  // 균형(§4 4행): 가격은 올랐는데 외국인 수급은 반대면 한 줄로 알린다(억지 금지 — 데이터 있을 때만).
  let balance: string | undefined;
  const streak = sig.foreignNetStreak;
  if (up && typeof streak === "number" && streak <= -FRONT_SUPPLY_STREAK_MIN)
    balance = "다만 외국인 수급은 반대로 빠지는 중이에요.";
  else if (!up && typeof streak === "number" && streak >= FRONT_SUPPLY_STREAK_MIN)
    balance = "다만 외국인은 오히려 사 모으는 중이에요.";

  return balance ? { headline, translation, balance, source: "price" } : { headline, translation, source: "price" };
}

function volumeHook(sig: CardFrontSignals): CardFrontHook | null {
  const r = sig.volumeRatio;
  if (typeof r !== "number" || !Number.isFinite(r) || r < FRONT_VOLUME_RATIO_MIN) return null;
  return {
    headline: `거래량 평소 ${r.toFixed(1)}배`,
    translation: "평소보다 훨씬 많은 거래가 오갔어요.",
    source: "volume",
  };
}

function supplyHook(sig: CardFrontSignals): CardFrontHook | null {
  const s = sig.foreignNetStreak;
  if (typeof s !== "number" || !Number.isFinite(s) || Math.abs(s) < FRONT_SUPPLY_STREAK_MIN) return null;
  const buy = s > 0;
  return {
    headline: `외국인 ${Math.abs(s)}일째 ${buy ? "순매수" : "순매도"}`,
    translation: buy
      ? "외국인 자금이 며칠째 꾸준히 들어오는 흐름이에요."
      : "외국인 자금이 며칠째 빠져나가는 흐름이에요.",
    source: "supply",
  };
}

function newsHook(sig: CardFrontSignals): CardFrontHook | null {
  const r = sig.reason?.trim();
  if (!r) return null;
  if (!isFrontHookSafe(r)) return null; // 근거에 판정/추천이 섞이면 채택 안 함 → 잠잠으로
  return { headline: r, translation: "", source: "news" };
}

function quietHook(sig: CardFrontSignals): CardFrontHook {
  const id = sig.identity?.trim();
  return {
    headline: "오늘은 잠잠해요",
    translation: id || "큰 움직임 없이 조용한 하루예요.",
    source: "quiet",
  };
}

/**
 * 카드 앞면 후킹 — 우선순위(가격>거래량>수급>뉴스>잠잠)대로 데이터 있는 첫 신호 채택.
 * 순수·결정적. 채택된 줄이 가드(판정·추천·예측 금지)를 못 넘으면 잠잠으로 안전 폴백.
 */
export function buildCardFrontHook(sig: CardFrontSignals = {}): CardFrontHook {
  const hook = priceHook(sig) || volumeHook(sig) || supplyHook(sig) || newsHook(sig) || quietHook(sig);
  const joined = `${hook.headline} ${hook.translation} ${hook.balance ?? ""}`;
  if (!isFrontHookSafe(joined)) return quietHook(sig);
  return hook;
}

// ── baseline(stock-basics) → 신호 도출 (규칙 기반, 외부소스·LLM 0) ─────────────
const numOf = (s: string | undefined): number | null => {
  if (!s) return null;
  const c = s.replace(/[^\d.-]/g, "");
  if (!/\d/.test(c)) return null;
  const n = Number(c);
  return Number.isFinite(n) ? n : null;
};

/** 회사 개요 첫 구절만(잠잠 fallback 의 "회사 한 줄") — "동사는/당사는" 보일러플레이트 제거 후 너무 길면 자른다. */
function firstClause(summary: string): string | undefined {
  const head = summary
    .trim()
    .replace(/^(동사는|당사는|당사|동사)\s*/, "")
    .split(/[.\n·]/)[0]
    ?.trim();
  if (!head) return undefined;
  return head.length > 42 ? `${head.slice(0, 40)}…` : head;
}

/**
 * stock-basics(네이버 baseline) → 카드 앞면 신호. 가격 이벤트(우선순위 1)와 잠잠 보조(정체성)만 채운다.
 * 거래량·수급은 baseline 에 없어 미도출(P1) — 엔진 시그니처는 이미 열려 있다.
 */
export function signalsFromBasics(b: StockBasics): CardFrontSignals {
  const out: CardFrontSignals = {};
  if (b.changeText) {
    // 네이버 등락 비율은 부호 포함 — 예 "8,500 (-2.34%)" / "2,000 (0.55%)". 부호를 그대로 쓴다.
    const m = b.changeText.match(/\(\s*([+-]?[\d.]+)\s*%\s*\)/);
    const raw = m?.[1];
    if (raw) {
      let pct = Number(raw);
      // 비율에 부호가 없으면(드묾) changeDir 로 보정.
      if (Number.isFinite(pct)) {
        if (pct > 0 && b.changeDir === "down" && !/^[+-]/.test(raw)) pct = -pct;
        out.changePct = pct;
      }
    }
  }
  const high = b.metrics.find((m) => m.label === "최근 1년 최고가")?.value;
  const cur = b.priceText;
  if (high && cur) {
    const h = numOf(high);
    const c = numOf(cur);
    if (h && c && h > 0) out.near52WeekHigh = c >= h * 0.98; // 신고가의 98% 이상이면 "부근"
  }
  if (b.summary) {
    const id = firstClause(b.summary);
    if (id) out.identity = id;
  }
  return out;
}
