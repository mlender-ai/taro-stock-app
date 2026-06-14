/**
 * /api/fomo/emotions/today 엔드포인트 폴백·정합성 테스트.
 * 이슈 #425 (Backend): 감정 투표 데이터 미비 시 안전한 폴백 반환 검증.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../lib/prisma", () => ({
  prisma: {
    emotionVote: { groupBy: vi.fn() },
  },
}));

import { GET } from "@/app/api/fomo/emotions/today/route";
import { prisma } from "../../../lib/prisma";

const mockGroupBy = vi.mocked(prisma.emotionVote.groupBy);

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── 1. 정상 투표 데이터 ────────────────────────────────────────────────────────
describe("투표 데이터 있을 때", () => {
  it("counts·ratios·total 정확히 반환, fallback=false", async () => {
    mockGroupBy.mockResolvedValueOnce([
      { emotion: "fomo",  _count: { _all: 6 } },
      { emotion: "fear",  _count: { _all: 4 } },
    ] as never);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.total).toBe(10);
    expect(body.counts.fomo).toBe(6);
    expect(body.counts.fear).toBe(4);
    expect(body.ratios.fomo).toBe(60);
    expect(body.ratios.fear).toBe(40);
    expect(body.fallback).toBe(false);
  });
});

// ─── 2. 투표 없음 — 안전한 폴백 ────────────────────────────────────────────────
describe("투표 데이터 없을 때 (정직한 숫자 폴백)", () => {
  it("total=0, 모든 counts=0, fallback=true 반환 — 빈 값 노출 금지", async () => {
    mockGroupBy.mockResolvedValueOnce([] as never);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.total).toBe(0);
    expect(body.fallback).toBe(true);
    // 정직한 숫자: 모든 감정은 0으로 명시적 반환 (undefined/null 금지)
    for (const v of Object.values(body.counts)) {
      expect(v).toBe(0);
    }
    for (const v of Object.values(body.ratios)) {
      expect(v).toBe(0);
    }
  });
});

// ─── 3. DB 장애 시 500 ─────────────────────────────────────────────────────────
describe("DB 장애", () => {
  it("groupBy 실패 → 500 + TALLY_ERROR", async () => {
    mockGroupBy.mockRejectedValueOnce(new Error("DB timeout"));

    const res = await GET();
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.code).toBe("TALLY_ERROR");
  });
});

// ─── 4. CORS 헤더 ──────────────────────────────────────────────────────────────
describe("CORS", () => {
  it("Access-Control-Allow-Origin: * 포함", async () => {
    mockGroupBy.mockResolvedValueOnce([] as never);

    const res = await GET();
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});
