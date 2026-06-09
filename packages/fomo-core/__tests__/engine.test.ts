/**
 * FOMO Index 엔진 테스트.
 *
 * @author 안티그래비티
 * - 기존 폴백/방향성 테스트 유지
 * - 1-A: communityHeat Reddit 확장 테스트 추가
 * - 1-B: HeatMeta confidence 검증 테스트 추가
 */
import { describe, it, expect } from "vitest";
import {
  marketHeat,
  communityHeat,
  emotionHeat,
  whaleHeat,
  computeFomoIndex,
  buildSummary,
} from "../src/index";

// ─────────────────────────────────────────────────────────────────────────────
// 기존 테스트 (regression)
// ─────────────────────────────────────────────────────────────────────────────

describe("각 Heat — 폴백 (데이터 미비 시 안전한 기본값)", () => {
  it("market/community/emotion은 미비 시 중립 15, whale은 0", () => {
    expect(marketHeat().score).toBe(15);
    expect(communityHeat().score).toBe(15);
    expect(emotionHeat().score).toBe(15);
    expect(whaleHeat().score).toBe(0);
  });

  it("max 경계를 넘지 않는다", () => {
    expect(marketHeat({ volumeChangePct: 999, turnoverChangePct: 999 }).score).toBeLessThanOrEqual(30);
    expect(whaleHeat([{ weight: 50 }]).score).toBe(10);
  });
});

describe("emotionHeat — 감정 방향성", () => {
  it("FOMO/탐욕↑ → 15 초과", () => {
    expect(emotionHeat({ fomo: 8, greed: 2 }).score).toBeGreaterThan(15);
  });
  it("공포/후회↑ → 15 미만", () => {
    expect(emotionHeat({ fear: 7, regret: 3 }).score).toBeLessThan(15);
  });
  it("순수 확신은 중립 근처(분모 희석)", () => {
    expect(emotionHeat({ conviction: 10 }).score).toBe(15);
  });
});

describe("computeFomoIndex — 합산 + 상태", () => {
  it("전 입력 미비 시 중립 스냅샷 (15+15+15+0=45, 관심)", () => {
    const idx = computeFomoIndex({}, "2026-06-05");
    expect(idx.score).toBe(45);
    expect(idx.state).toBe("관심");
    expect(idx.components).toHaveLength(4);
    expect(idx.date).toBe("2026-06-05");
  });

  it("과열 입력 → 광기 구간", () => {
    const idx = computeFomoIndex(
      {
        market: { volumeChangePct: 200, turnoverChangePct: 200, searchChangePct: 200, etfInflowPct: 200 },
        community: { mentionChangePct: 200, bullishRatio: 1 },
        emotion: { fomo: 10, greed: 10 },
        whale: [{ weight: 10 }],
      },
      "2026-06-05"
    );
    expect(idx.score).toBeGreaterThanOrEqual(81);
    expect(idx.state).toBe("광기");
  });
});

describe("buildSummary — 투자 조언/단정 표현 없음", () => {
  it("투표 없을 때도 문장 생성", () => {
    const idx = computeFomoIndex({}, "2026-06-05");
    const s = buildSummary(idx, {});
    expect(s.length).toBeGreaterThan(0);
    expect(s).not.toMatch(/매수|매도|반드시|보장|폭락/);
  });
  it("최다 감정을 언급", () => {
    const idx = computeFomoIndex({ emotion: { fear: 5, fomo: 1 } }, "2026-06-05");
    expect(buildSummary(idx, { fear: 5, fomo: 1 })).toContain("공포");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 1-B: HeatMeta confidence 테스트
// ─────────────────────────────────────────────────────────────────────────────

describe("HeatMeta confidence (1-B 폴백 견고화)", () => {
  it("데이터 미비 시 모든 Heat의 confidence가 fallback이다", () => {
    const idx = computeFomoIndex({}, "2026-06-05");
    for (const c of idx.components) {
      expect(c.meta).toBeDefined();
      expect(c.meta!.confidence).toBe("fallback");
    }
  });

  it("market에 1개 소스만 → low confidence", () => {
    const h = marketHeat({ volumeChangePct: 10 });
    expect(h.meta!.confidence).toBe("low");
    expect(h.meta!.sourcesAvailable).toBe(1);
    expect(h.meta!.sourcesTotal).toBe(4);
  });

  it("market에 2개 소스 → medium confidence", () => {
    const h = marketHeat({ volumeChangePct: 10, turnoverChangePct: 20 });
    expect(h.meta!.confidence).toBe("medium");
    expect(h.meta!.sourcesAvailable).toBe(2);
  });

  it("market에 3개 이상 소스 → high confidence", () => {
    const h = marketHeat({ volumeChangePct: 10, turnoverChangePct: 20, searchChangePct: 5 });
    expect(h.meta!.confidence).toBe("high");
    expect(h.meta!.sourcesAvailable).toBe(3);
  });

  it("emotion 투표 50건 이상 → high confidence", () => {
    const h = emotionHeat({ fomo: 20, fear: 15, greed: 10, regret: 5, conviction: 5 });
    expect(h.meta!.confidence).toBe("high");
  });

  it("emotion 투표 10건 → medium confidence", () => {
    const h = emotionHeat({ fomo: 5, fear: 5 });
    expect(h.meta!.confidence).toBe("medium");
  });

  it("emotion 투표 3건 → low confidence", () => {
    const h = emotionHeat({ fomo: 2, fear: 1 });
    expect(h.meta!.confidence).toBe("low");
  });

  it("whale 이벤트 있으면 high, 없으면 fallback", () => {
    expect(whaleHeat([{ weight: 3 }]).meta!.confidence).toBe("high");
    expect(whaleHeat([]).meta!.confidence).toBe("fallback");
    expect(whaleHeat().meta!.confidence).toBe("fallback");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 1-A: communityHeat Reddit 확장 테스트
// ─────────────────────────────────────────────────────────────────────────────

describe("communityHeat — Reddit 소스 확장 (1-A)", () => {
  it("Reddit 시그널만 제공 시 engagement-weighted bullish score 반영", () => {
    const h = communityHeat({
      reddit: [
        {
          subreddit: "wallstreetbets",
          postCount: 25,
          totalUpvotes: 5000,
          totalComments: 1000,
          bullishRatio: 0.8,
          fetchedAt: "2026-06-05T12:00:00Z",
        },
      ],
    });
    // bullishRatio 0.8 × (5000+1000) weight → 0.8 → score ≈ 24
    expect(h.score).toBeGreaterThan(15);
    expect(h.meta!.confidence).toBe("low"); // 1/3 sources
    expect(h.meta!.sourcesAvailable).toBe(1);
  });

  it("Reddit + mention 둘 다 제공 시 평균 반영", () => {
    const h = communityHeat({
      mentionChangePct: 50, // → intensity ≈ 0.67
      reddit: [
        {
          subreddit: "stocks",
          postCount: 10,
          totalUpvotes: 500,
          totalComments: 100,
          bullishRatio: 0.3, // bearish 쪽
          fetchedAt: "2026-06-05T12:00:00Z",
        },
      ],
    });
    // 2/3 sources → medium
    expect(h.meta!.confidence).toBe("medium");
    expect(h.meta!.sourcesAvailable).toBe(2);
  });

  it("모든 소스 제공 시 high confidence", () => {
    const h = communityHeat({
      mentionChangePct: 30,
      bullishRatio: 0.6,
      reddit: [
        {
          subreddit: "investing",
          postCount: 15,
          totalUpvotes: 1000,
          totalComments: 200,
          bullishRatio: 0.5,
          fetchedAt: "2026-06-05T12:00:00Z",
        },
      ],
    });
    expect(h.meta!.confidence).toBe("high");
    expect(h.meta!.sourcesAvailable).toBe(3);
  });

  it("여러 서브레딧의 engagement 가중 평균", () => {
    const h = communityHeat({
      reddit: [
        {
          subreddit: "wallstreetbets",
          postCount: 25,
          totalUpvotes: 10000, // 높은 참여도 → 높은 가중
          totalComments: 2000,
          bullishRatio: 0.9,   // 매우 bullish
          fetchedAt: "2026-06-05T12:00:00Z",
        },
        {
          subreddit: "stocks",
          postCount: 10,
          totalUpvotes: 100,   // 낮은 참여도
          totalComments: 20,
          bullishRatio: 0.1,   // bearish
          fetchedAt: "2026-06-05T12:00:00Z",
        },
      ],
    });
    // WSB의 가중이 훨씬 크므로 bullish 쪽으로 기울어야 한다
    expect(h.score).toBeGreaterThan(20);
  });

  it("Reddit 빈 배열은 소스 미제공과 동일", () => {
    const withEmpty = communityHeat({ reddit: [] });
    const without = communityHeat({});
    expect(withEmpty.score).toBe(without.score);
  });

  it("기존 방식(reddit 없이) 하위호환", () => {
    const h = communityHeat({ mentionChangePct: 0, bullishRatio: 0.5 });
    // mentionChangePct 0 → intensity 0.33, bullishRatio 0.5 → avg 0.415 → score ≈ 12
    expect(h.score).toBeGreaterThan(0);
    expect(h.score).toBeLessThan(20);
    expect(h.meta!.sourcesAvailable).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// #413: FOMO Index 스냅샷 생성 및 데이터 정합성 회귀 테스트
// ─────────────────────────────────────────────────────────────────────────────

describe("FOMO Index 스냅샷 정합성 — 폴백 회귀 테스트 (#413)", () => {
  // 시나리오 1: 모든 데이터 소스 정상 → 스냅샷 정확히 생성
  it("Given 전체 소스 정상 When computeFomoIndex Then 스냅샷 1건 + 컴포넌트 4개 반환", () => {
    const idx = computeFomoIndex(
      {
        market: { volumeChangePct: 30, turnoverChangePct: 20 },
        community: { mentionChangePct: 50, bullishRatio: 0.6 },
        emotion: { fomo: 10, greed: 5, fear: 3 },
        whale: [{ weight: 3, label: "BTC 신고가" }],
      },
      "2026-06-09"
    );
    expect(idx.date).toBe("2026-06-09");
    expect(idx.score).toBeGreaterThan(0);
    expect(idx.score).toBeLessThanOrEqual(100);
    expect(idx.components).toHaveLength(4);
    // 각 컴포넌트 점수가 max를 초과하지 않아야 함
    for (const c of idx.components) {
      expect(c.score).toBeGreaterThanOrEqual(0);
      expect(c.score).toBeLessThanOrEqual(c.max);
    }
  });

  // 시나리오 2: 일부 소스 실패(결측) → 폴백 값으로 대체, 오류 노출 없음
  it("Given 일부 소스 결측 When computeFomoIndex Then 폴백 적용하여 정상 스냅샷 생성", () => {
    // market/whale 미제공 → 폴백(중립)
    const idx = computeFomoIndex(
      { emotion: { fomo: 5, fear: 5 } },
      "2026-06-09"
    );
    expect(idx.score).toBeGreaterThan(0);
    expect(idx.components).toHaveLength(4);
    const market = idx.components.find((c) => c.key === "market")!;
    const whale = idx.components.find((c) => c.key === "whale")!;
    expect(market.meta!.confidence).toBe("fallback");
    expect(whale.meta!.confidence).toBe("fallback");
    // 감정은 실제 데이터 기반이므로 fallback 아님
    const emotion = idx.components.find((c) => c.key === "emotion")!;
    expect(emotion.meta!.confidence).not.toBe("fallback");
  });

  // 시나리오 3: 전체 소스 미제공 → 중립 스냅샷 (15+15+15+0=45)
  it("Given 전체 소스 미제공 When computeFomoIndex Then 중립 스냅샷(score=45, 관심) 반환", () => {
    const idx = computeFomoIndex({}, "2026-06-09");
    expect(idx.score).toBe(45);
    expect(idx.state).toBe("관심");
    for (const c of idx.components) {
      expect(c.meta!.confidence).toBe("fallback");
    }
  });

  // buildSummary — 폴백 데이터로도 요약 문장이 생성됨
  it("폴백 스냅샷에서도 buildSummary가 비어있지 않음", () => {
    const idx = computeFomoIndex({}, "2026-06-09");
    const summary = buildSummary(idx, {});
    expect(summary.length).toBeGreaterThan(0);
    expect(summary).not.toMatch(/undefined|null|NaN/);
  });
});
