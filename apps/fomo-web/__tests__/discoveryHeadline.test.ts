import { describe, expect, it } from "vitest";
import { compactDiscoveryCardHeadline, splitDiscoveryReason } from "../lib/discoveryHeadline";

describe("compactDiscoveryCardHeadline", () => {
  it("turns material detail into one card-front sentence instead of a label plus prose", () => {
    expect(
      compactDiscoveryCardHeadline({
        reason: "뉴스 재료 붙은 종목 — 최근 '해외 수주 2배' 마키나락스...장중 20% 가까이 급등 · 뉴시스. 동종 흐름도 같이 확인돼요.",
        sector: "AI",
        marketCapRank: 236,
      })
    ).toBe("해외 수주에 동종 흐름도 붙었어요");
  });

  it("keeps obscure theme leaders honest in one sentence", () => {
    expect(
      compactDiscoveryCardHeadline({
        reason: "혼자 튄 무명주 — 시총 411위권인데 같은 화장품 종목들 중 오늘 제일 셌어요. 뒤를 받칠 수급·거래·뉴스는 아직 안 보여요.",
        sector: "화장품",
      })
    ).toBe("시총 411위 화장품주가 튀었지만 근거는 얇아요");
  });

  it("does not expose the split reason as a second line contract", () => {
    const parts = splitDiscoveryReason("뉴스 재료 붙은 종목 — 오늘 공급계약 공시 · 한국경제.");

    expect(parts.state).toBe("뉴스 재료 붙은 종목");
    expect(compactDiscoveryCardHeadline({ reason: `${parts.state} — ${parts.detail}` })).toBe("계약에 직접 재료가 붙었어요");
  });
});
