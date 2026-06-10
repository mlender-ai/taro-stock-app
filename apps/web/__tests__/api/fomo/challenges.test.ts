import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// prisma 모킹 (DB 경계만 모킹 — 라우트+lib/fomo+@fomo/core 로직은 실제 실행)
vi.mock("../../../lib/prisma", () => ({
  prisma: {
    dailyChallenge: { findUnique: vi.fn(), upsert: vi.fn() },
    pointTransaction: { findUnique: vi.fn(), create: vi.fn() },
  },
}));
vi.mock("../../../lib/logger", () => ({
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));
vi.mock("@/lib/tarot/jwt", () => ({
  extractBearerToken: () => null,
  verifyToken: () => null,
}));

import { GET, POST } from "@/app/api/fomo/challenges/route";
import { prisma } from "../../../lib/prisma";

const mockChallengeFind = vi.mocked(prisma.dailyChallenge.findUnique);
const mockChallengeUpsert = vi.mocked(prisma.dailyChallenge.upsert);
const mockTxFind = vi.mocked(prisma.pointTransaction.findUnique);
const mockTxCreate = vi.mocked(prisma.pointTransaction.create);

beforeEach(() => {
  vi.clearAllMocks();
});

function getReq(qs: string) {
  return new NextRequest(`http://localhost/api/fomo/challenges${qs}`);
}
function postReq(body: unknown) {
  return new NextRequest("http://localhost/api/fomo/challenges", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ─── 1. 상태 조회(GET) ──────────────────────────────────────────────────────
describe("GET /api/fomo/challenges", () => {
  it("sessionId 없으면 400 MISSING_SESSION", async () => {
    const res = await GET(getReq(""));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("MISSING_SESSION");
  });

  it("레코드 없으면 pending 폴백(에러 노출 금지)", async () => {
    mockChallengeFind.mockResolvedValueOnce(null as never);
    const res = await GET(getReq("?sessionId=s1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("pending");
    expect(body.completedAt).toBeNull();
  });

  it("저장된 완료 상태를 그대로 반환", async () => {
    const completedAt = new Date("2026-06-10T01:00:00Z");
    mockChallengeFind.mockResolvedValueOnce({ status: "completed", completedAt } as never);
    const res = await GET(getReq("?sessionId=s1"));
    const body = await res.json();
    expect(body.status).toBe("completed");
    expect(body.completedAt).toBe(completedAt.toISOString());
  });

  it("DB 장애 시 500 CHALLENGE_ERROR", async () => {
    mockChallengeFind.mockRejectedValueOnce(new Error("db down"));
    const res = await GET(getReq("?sessionId=s1"));
    expect(res.status).toBe(500);
    expect((await res.json()).code).toBe("CHALLENGE_ERROR");
  });
});

// ─── 2. 상태 저장(POST) + 포인트 적립 ──────────────────────────────────────
describe("POST /api/fomo/challenges", () => {
  it("sessionId 없으면 400", async () => {
    const res = await POST(postReq({ status: "completed" }));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("MISSING_SESSION");
  });

  it("잘못된 status는 400 BAD_STATUS", async () => {
    const res = await POST(postReq({ sessionId: "s1", status: "done" }));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("BAD_STATUS");
  });

  it("최초 완료 → 상태 저장 + 챌린지 완료 10점 적립", async () => {
    mockChallengeFind.mockResolvedValueOnce(null as never); // 기존 상태 없음
    mockChallengeUpsert.mockResolvedValueOnce({ status: "completed", completedAt: new Date() } as never);
    mockTxFind.mockResolvedValueOnce(null as never); // 미적립
    mockTxCreate.mockResolvedValueOnce({} as never);

    const res = await POST(postReq({ sessionId: "s1", status: "completed" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe("completed");
    expect(body.awarded).toBe(10);

    // 포인트 트랜잭션이 challenge_complete +10 으로 생성됨
    expect(mockTxCreate).toHaveBeenCalledTimes(1);
    expect(mockTxCreate.mock.calls[0]?.[0].data).toMatchObject({
      action: "challenge_complete",
      amount: 10,
    });
  });

  it("이미 완료된 챌린지 재완료 → 중복 적립 없음(멱등)", async () => {
    mockChallengeFind.mockResolvedValueOnce({ status: "completed" } as never); // 이미 완료
    mockChallengeUpsert.mockResolvedValueOnce({ status: "completed", completedAt: new Date() } as never);

    const res = await POST(postReq({ sessionId: "s1", status: "completed" }));
    const body = await res.json();
    expect(body.awarded).toBe(0);
    expect(mockTxCreate).not.toHaveBeenCalled();
  });
});
