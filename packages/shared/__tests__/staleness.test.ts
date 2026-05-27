import { describe, it, expect } from "vitest";
import { classifyFreshness, isFresh } from "../src/staleness";

describe("staleness", () => {
  const now = Date.parse("2026-05-27T12:00:00.000Z");
  const freshTtl = 60_000; // 1 min
  const staleTtl = 5 * 60_000; // 5 min

  it("dataAt 없으면 expired", () => {
    expect(classifyFreshness(null, now, freshTtl, staleTtl)).toBe("expired");
    expect(classifyFreshness(undefined, now, freshTtl, staleTtl)).toBe("expired");
  });

  it("dataAt 가 잘못된 형식이면 expired", () => {
    expect(classifyFreshness("not-a-date", now, freshTtl, staleTtl)).toBe("expired");
  });

  it("freshTtl 이내면 fresh", () => {
    const t = new Date(now - 30_000).toISOString(); // 30초 전
    expect(classifyFreshness(t, now, freshTtl, staleTtl)).toBe("fresh");
    expect(isFresh(t, now, freshTtl)).toBe(true);
  });

  it("freshTtl 초과 + staleTtl 이내면 stale", () => {
    const t = new Date(now - 120_000).toISOString(); // 2분 전
    expect(classifyFreshness(t, now, freshTtl, staleTtl)).toBe("stale");
    expect(isFresh(t, now, freshTtl)).toBe(false);
  });

  it("staleTtl 초과면 expired", () => {
    const t = new Date(now - 6 * 60_000).toISOString(); // 6분 전
    expect(classifyFreshness(t, now, freshTtl, staleTtl)).toBe("expired");
  });

  it("미래 시간(서버 시계 앞섬) 은 fresh로 간주", () => {
    const t = new Date(now + 10_000).toISOString(); // 10초 후
    expect(classifyFreshness(t, now, freshTtl, staleTtl)).toBe("fresh");
  });

  it("freshTtl 경계값 정확 매치", () => {
    const t = new Date(now - freshTtl).toISOString(); // 정확히 60초 전
    expect(classifyFreshness(t, now, freshTtl, staleTtl)).toBe("fresh");
  });

  it("staleTtl 경계값 정확 매치", () => {
    const t = new Date(now - staleTtl).toISOString(); // 정확히 5분 전
    expect(classifyFreshness(t, now, freshTtl, staleTtl)).toBe("stale");
  });
});
