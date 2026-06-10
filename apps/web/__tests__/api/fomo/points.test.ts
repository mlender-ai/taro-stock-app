import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("../../../lib/prisma", () => ({
  prisma: {
    pointTransaction: { findMany: vi.fn() },
  },
}));
vi.mock("../../../lib/logger", () => ({
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

import { GET } from "@/app/api/fomo/points/route";
import { prisma } from "../../../lib/prisma";

const mockFindMany = vi.mocked(prisma.pointTransaction.findMany);

beforeEach(() => {
  vi.clearAllMocks();
});

function getReq(qs: string) {
  return new NextRequest(`http://localhost/api/fomo/points${qs}`);
}

describe("GET /api/fomo/points", () => {
  it("sessionId 없으면 400 MISSING_SESSION", async () => {
    const res = await GET(getReq(""));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("MISSING_SESSION");
  });

  it("적립 내역 합산 — 감정 투표 5 + 챌린지 완료 10 = 15", async () => {
    mockFindMany.mockResolvedValueOnce([
      { action: "emotion_vote", amount: 5, refDate: "2026-06-10", createdAt: new Date() },
      { action: "challenge_complete", amount: 10, refDate: "2026-06-10", createdAt: new Date() },
    ] as never);

    const res = await GET(getReq("?sessionId=s1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sessionId).toBe("s1");
    expect(body.total).toBe(15);
    expect(body.transactions).toHaveLength(2);
  });

  it("적립 없으면 total 0, 빈 로그(정직한 폴백)", async () => {
    mockFindMany.mockResolvedValueOnce([] as never);
    const res = await GET(getReq("?sessionId=s1"));
    const body = await res.json();
    expect(body.total).toBe(0);
    expect(body.transactions).toEqual([]);
  });

  it("오염된 amount는 총점에서 제외(무결성)", async () => {
    mockFindMany.mockResolvedValueOnce([
      { action: "emotion_vote", amount: 5, refDate: "2026-06-10", createdAt: new Date() },
      { action: "challenge_complete", amount: 99999, refDate: "2026-06-10", createdAt: new Date() }, // 위조
    ] as never);
    const res = await GET(getReq("?sessionId=s1"));
    const body = await res.json();
    expect(body.total).toBe(5); // 위조 tx 제외
  });

  it("DB 장애 시 500 POINTS_ERROR", async () => {
    mockFindMany.mockRejectedValueOnce(new Error("db down"));
    const res = await GET(getReq("?sessionId=s1"));
    expect(res.status).toBe(500);
    expect((await res.json()).code).toBe("POINTS_ERROR");
  });
});
