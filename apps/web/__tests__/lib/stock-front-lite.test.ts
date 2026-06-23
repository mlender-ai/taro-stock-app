import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/supply-demand-store", () => ({
  readSupplyDemandHistory: vi.fn().mockResolvedValue([]),
}));

import { assembleStockFront } from "../../lib/stock-front";

const dailyText = `
[
["날짜","시가","고가","저가","종가","거래량"],
["20260616", 990, 1060, 980, 1000, 9000],
["20260617", 1000, 1100, 990, 1010, 10000],
["20260618", 1010, 1120, 1000, 1040, 12000],
["20260619", 1040, 1150, 1030, 1090, 18000],
["20260622", 1090, 1160, 1080, 1110, 22000],
["20260623", 1110, 1200, 1100, 1180, 26000]
]
`;

describe("assembleStockFront lite", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("siseJson.naver")) {
          return new Response(dailyText, { status: 200 });
        }
        return new Response("{}", { status: 500 });
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("카드 경량 경로에서도 라인차트용 sparkline을 반환한다", async () => {
    const front = await assembleStockFront("삼성전자", undefined, {}, { lite: true });

    expect(front.sparkline).toEqual([1000, 1010, 1040, 1090, 1110, 1180]);
    expect(front.taFact).toBeUndefined();
    expect(front.fomo.inputs.volume).toBeDefined();
    expect(front.fomo.inputs.price).toBeDefined();
  });
});
