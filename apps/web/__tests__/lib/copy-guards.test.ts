import { describe, expect, it } from "vitest";

import { hasEnglishFragmentHeadline } from "../../lib/copy-guards";

describe("headline latin fragment guard", () => {
  it("blocks English fragments mixed into Korean card headlines", () => {
    expect(hasEnglishFragmentHeadline("its NVIDIA와 제품 협력")).toBe(true);
    expect(hasEnglishFragmentHeadline("Can와 파트너십 체결")).toBe(true);
    expect(hasEnglishFragmentHeadline("SHPH, ILLR, IVF: Why These Stocks Posted Double-Digit Gains")).toBe(true);
  });

  it("allows Koreanized company names and known technical acronyms", () => {
    expect(hasEnglishFragmentHeadline("엔비디아와 제품 협력에 +34%")).toBe(false);
    expect(hasEnglishFragmentHeadline("AI 모델 출시")).toBe(false);
    expect(hasEnglishFragmentHeadline("SEC 8-K 주요 공시 제출")).toBe(false);
  });
});
