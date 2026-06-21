import { describe, expect, it } from "vitest";
import {
  buildCardFrontHook,
  isFrontHookSafe,
  signalsFromBasics,
  FRONT_PRICE_PCT_MIN,
  FRONT_VOLUME_RATIO_MIN,
  FRONT_SUPPLY_STREAK_MIN,
  type CardFrontSignals,
  type StockBasics,
} from "../src";

describe("buildCardFrontHook — 카드 앞면 후킹(PHASE0 §3·§5)", () => {
  it("우선순위: 가격 > 거래량 > 수급 > 뉴스 > 잠잠 (모두 있으면 가격)", () => {
    const all: CardFrontSignals = {
      changePct: 6.2,
      volumeRatio: 3,
      foreignNetStreak: 5,
      reason: "원전 수주 기대로 묶임",
    };
    expect(buildCardFrontHook(all).source).toBe("price");
    expect(buildCardFrontHook({ volumeRatio: 3, foreignNetStreak: 5, reason: "x 묶임" }).source).toBe("volume");
    expect(buildCardFrontHook({ foreignNetStreak: 5, reason: "x 묶임" }).source).toBe("supply");
    expect(buildCardFrontHook({ reason: "원전 수주 기대로 묶임" }).source).toBe("news");
    expect(buildCardFrontHook({}).source).toBe("quiet");
  });

  it("가격 — ±3% 이상이면 헤드라인에 부호·숫자·시점", () => {
    const up = buildCardFrontHook({ changePct: 6.23, asOf: "6/21" });
    expect(up.source).toBe("price");
    expect(up.headline).toBe("6/21 기준 +6.2%");
    expect(up.translation).toContain("위쪽");

    const down = buildCardFrontHook({ changePct: -4.1, asOf: "6/21" });
    expect(down.headline).toBe("6/21 기준 -4.1%");
    expect(down.translation).toContain("아래쪽");

    const noDate = buildCardFrontHook({ changePct: 5 });
    expect(noDate.headline).toBe("오늘 +5.0%");
  });

  it("가격 — 컷(±3%) 미달이면 가격 스킵 → 다음 우선순위(잠잠)", () => {
    const small = buildCardFrontHook({ changePct: FRONT_PRICE_PCT_MIN - 0.5 });
    expect(small.source).toBe("quiet");
  });

  it("가격 — 52주 신고가 부근은 컷과 무관하게 채택, 강한 등락과 결합", () => {
    expect(buildCardFrontHook({ changePct: 0.4, near52WeekHigh: true }).headline).toContain("52주 신고가");
    const both = buildCardFrontHook({ changePct: 7, near52WeekHigh: true, asOf: "6/21" });
    expect(both.headline).toBe("6/21 기준 +7.0% · 52주 신고가 부근");
  });

  it("거래량 — 1.8배 이상만 채택, 미만은 스킵", () => {
    expect(buildCardFrontHook({ volumeRatio: 2.4 }).headline).toBe("거래량 평소 2.4배");
    expect(buildCardFrontHook({ volumeRatio: FRONT_VOLUME_RATIO_MIN - 0.1 }).source).toBe("quiet");
  });

  it("수급 — 3일 연속 이상만, 부호로 순매수/순매도", () => {
    expect(buildCardFrontHook({ foreignNetStreak: 5 }).headline).toBe("외국인 5일째 순매수");
    expect(buildCardFrontHook({ foreignNetStreak: -4 }).headline).toBe("외국인 4일째 순매도");
    expect(buildCardFrontHook({ foreignNetStreak: FRONT_SUPPLY_STREAK_MIN - 1 }).source).toBe("quiet");
  });

  it("균형(4행) — 가격은 올랐는데 외국인은 빠지면 반대 사실 한 줄(억지 금지)", () => {
    const conflict = buildCardFrontHook({ changePct: 6, foreignNetStreak: -5 });
    expect(conflict.source).toBe("price");
    expect(conflict.balance).toContain("외국인");
    // 충돌 없으면 balance 없음
    expect(buildCardFrontHook({ changePct: 6, foreignNetStreak: 5 }).balance).toBeUndefined();
    expect(buildCardFrontHook({ changePct: 6 }).balance).toBeUndefined();
  });

  it("뉴스 — 근거를 헤드라인으로, 단 판정/추천 섞이면 잠잠으로 폴백(환각·판정 금지)", () => {
    expect(buildCardFrontHook({ reason: "원전 수주 기대로 묶임" }).headline).toBe("원전 수주 기대로 묶임");
    // 근거에 금칙(추천/예측)이 들어오면 채택 안 함
    expect(buildCardFrontHook({ reason: "지금 매수 추천! 급등할 종목" }).source).toBe("quiet");
  });

  it("잠잠 — 신호 없으면 '오늘은 잠잠' + 회사 한 줄(있으면), 없으면 기본 문구", () => {
    const withId = buildCardFrontHook({ identity: "모바일 메모리 설계 팹리스" });
    expect(withId.source).toBe("quiet");
    expect(withId.headline).toBe("오늘은 잠잠해요");
    expect(withId.translation).toBe("모바일 메모리 설계 팹리스");
    expect(buildCardFrontHook({}).translation).toContain("조용한");
  });

  it("결정적 — 같은 입력은 같은 출력(캐시·새로고침 안정)", () => {
    const sig: CardFrontSignals = { changePct: 4.4, asOf: "6/21" };
    expect(buildCardFrontHook(sig)).toEqual(buildCardFrontHook(sig));
  });

  it("금칙어 가드 — 어떤 채택 결과에도 점수·등급·추천·예측 어휘가 없다", () => {
    const samples: CardFrontSignals[] = [
      { changePct: 9.1, asOf: "6/21" },
      { changePct: -7, foreignNetStreak: -6 },
      { volumeRatio: 5 },
      { foreignNetStreak: 8 },
      { reason: "AI 데이터센터 수주로 묶임" },
      { identity: "원전 기자재 전문" },
      {},
    ];
    for (const s of samples) {
      const h = buildCardFrontHook(s);
      const joined = `${h.headline} ${h.translation} ${h.balance ?? ""}`;
      // isFrontHookSafe 가 진짜 가드(순매수/순매도는 수급 사실로 허용) — 행동 지시·예측·점수·등급은 차단.
      expect(isFrontHookSafe(joined), `금칙어: ${joined}`).toBe(true);
      expect(joined).not.toMatch(/점수|등급|추천|유망|급등할|폭등/);
    }
  });
});

describe("signalsFromBasics — baseline(stock-basics) → 신호 도출", () => {
  const base: StockBasics = { name: "테스트", metrics: [] };

  it("등락률 — changeText 의 부호 포함 비율을 그대로(네이버 실제 포맷)", () => {
    expect(signalsFromBasics({ ...base, changeText: "2,000 (0.55%)", changeDir: "up" }).changePct).toBe(0.55);
    expect(signalsFromBasics({ ...base, changeText: "20,500 (-6.50%)", changeDir: "down" }).changePct).toBe(-6.5);
    // 비율에 부호가 없는 드문 경우만 changeDir 로 보정.
    expect(signalsFromBasics({ ...base, changeText: "1,500 (6.20%)", changeDir: "down" }).changePct).toBe(-6.2);
  });

  it("52주 신고가 — 현재가가 최고가의 98% 이상이면 부근", () => {
    const near = signalsFromBasics({
      ...base,
      priceText: "99,000원",
      metrics: [{ label: "최근 1년 최고가", value: "100,000원" }],
    });
    expect(near.near52WeekHigh).toBe(true);
    const far = signalsFromBasics({
      ...base,
      priceText: "80,000원",
      metrics: [{ label: "최근 1년 최고가", value: "100,000원" }],
    });
    expect(far.near52WeekHigh).toBe(false);
  });

  it("정체성 — 회사 개요 첫 구절(잠잠 보조)", () => {
    const s = signalsFromBasics({ ...base, summary: "모바일 메모리 설계 팹리스. 2010년 설립." });
    expect(s.identity).toBe("모바일 메모리 설계 팹리스");
  });

  it("데이터 없으면 빈 신호(환각 금지) → 잠잠으로 귀결", () => {
    expect(buildCardFrontHook(signalsFromBasics(base)).source).toBe("quiet");
  });

  it("도출 신호로 후킹까지 — 강한 등락이면 가격 카드", () => {
    const sig = signalsFromBasics({ ...base, changeText: "5,000 (5.10%)", changeDir: "up" });
    sig.asOf = "6/21";
    expect(buildCardFrontHook(sig).headline).toBe("6/21 기준 +5.1%");
  });
});
