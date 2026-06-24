import { describe, expect, it } from "vitest";
import {
  discoveryWhy,
  eligibleUniverse,
  rankDiscoveryCandidates,
  type DiscoveryCandidate,
} from "../src";

const asOf = "2026-06-24";

function candidate(ticker: string, strength: number, kind: "price_move" | "news_mention" = "price_move"): DiscoveryCandidate {
  return {
    ticker,
    market: "KOSPI",
    events: [
      {
        kind,
        firstSeen: true,
        strength,
        source: kind === "news_mention" ? "뉴스" : "네이버 시세",
        asOf,
        confidence: "H",
        ...(kind === "news_mention" ? { label: "신규 공급계약 공시" } : {}),
      },
    ],
    asOf,
  };
}

describe("WO-05 discovery supply engine", () => {
  it("filters permanent risk flags and the dead liquidity tail only", () => {
    const result = eligibleUniverse([
      { ticker: "정상A", avgTradingValue20d: 100 },
      { ticker: "정상B", avgTradingValue20d: 90 },
      { ticker: "죽은거래", avgTradingValue20d: 3 },
      { ticker: "관리종목", avgTradingValue20d: 120, riskFlags: ["관리종목"] },
      { ticker: "단기과열", avgTradingValue20d: 120, riskFlags: ["단기과열"] },
    ]);

    expect(result.map((s) => s.ticker)).toEqual(["정상A", "정상B"]);
  });

  it("keeps only candidates with at least one event and ranks public material above weak shape-only cards", () => {
    const ranked = rankDiscoveryCandidates([
      { ticker: "조용", market: "KOSPI", events: [], asOf },
      candidate("가격만", 0.9, "price_move"),
      candidate("뉴스", 0.55, "news_mention"),
    ]);

    expect(ranked.map((c) => c.ticker)).toEqual(["뉴스", "가격만"]);
  });

  it("applies seen decay but keeps watched stocks exempt", () => {
    const rows = [candidate("최근봄", 0.9, "news_mention"), candidate("처음봄", 0.8, "news_mention")];

    expect(rankDiscoveryCandidates(rows, { seen: [{ ticker: "최근봄", daysAgo: 0 }] })[0]?.ticker).toBe("처음봄");
    expect(rankDiscoveryCandidates(rows, { seen: [{ ticker: "최근봄", daysAgo: 0 }], watched: ["최근봄"] })[0]?.ticker).toBe("최근봄");
  });

  it("labels weak price-only material honestly instead of inventing a catalyst", () => {
    expect(discoveryWhy(candidate("가격만", 0.8))).toContain("뚜렷한 공개 재료는 확인 안 됨");
    expect(discoveryWhy(candidate("뉴스", 0.6, "news_mention"))).toContain("신규 공급계약 공시");
  });
});
