import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// 공시 데이터 정합성 테스트 (QA 이슈 #265)
// 검증 항목:
//   1. symbol 누락 → 400
//   2. ANNOUNCEMENTS_API_URL 미설정 → items=[] (크래시 없음)
//   3. 외부 API 실패 → items=[] (크래시 없음)
//   4. 결측 title 항목 → 제외
//   5. 중복 id 항목 → 한 번만 표시
//   6. 비정상 날짜 → 크래시 없이 유효한 ISO 날짜로 폴백
//   7. 날짜 역순 정렬 → 최신순 반환

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { GET } from "@/app/api/market/announcements/route";
import { NextRequest } from "next/server";

function makeRequest(url: string): NextRequest {
  return new NextRequest(url);
}

function makeItem(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "id-1",
    title: "2026년 1분기 실적 발표",
    date: "2026-05-01T09:00:00.000Z",
    category: "실적",
    source: "DART",
    ...overrides,
  };
}

beforeEach(() => {
  mockFetch.mockReset();
  // 각 테스트는 독립적으로 환경변수 설정
  vi.stubEnv("ANNOUNCEMENTS_API_URL", "https://api.example.com/announcements");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("GET /api/market/announcements", () => {
  it("symbol 누락 → 400", async () => {
    const res = await GET(makeRequest("http://localhost/api/market/announcements"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("ANNOUNCEMENTS_API_URL 미설정 → items=[] (크래시 없음)", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("ANNOUNCEMENTS_API_URL", "");

    const res = await GET(makeRequest("http://localhost/api/market/announcements?symbol=NO_URL_TEST"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toEqual([]);
  });

  it("외부 API 500 응답 → items=[] (크래시 없음)", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const res = await GET(makeRequest("http://localhost/api/market/announcements?symbol=API500_TEST"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toEqual([]);
  });

  it("외부 API 네트워크 오류 → items=[] (크래시 없음)", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const res = await GET(makeRequest("http://localhost/api/market/announcements?symbol=NETERR_TEST"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toEqual([]);
  });

  it("시나리오 1: title 결측 항목 → 제외 (화면 깨짐 없음)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          { id: "bad", date: "2026-05-01T00:00:00Z" }, // title 없음
          makeItem({ id: "good", title: "정상 공시" }),
        ],
      }),
    });

    const res = await GET(makeRequest("http://localhost/api/market/announcements?symbol=NOTITLE_TEST"));
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].title).toBe("정상 공시");
  });

  it("시나리오 2: 중복 id 항목 → 한 번만 표시", async () => {
    const dup = makeItem({ id: "dup-id", title: "중복 공시" });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [dup, dup, dup] }),
    });

    const res = await GET(makeRequest("http://localhost/api/market/announcements?symbol=DUPID_TEST"));
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].id).toBe("dup-id");
  });

  it("시나리오 3: 비정상 날짜 → 크래시 없이 유효한 ISO 날짜로 폴백", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [makeItem({ id: "bad-date", date: "완전-잘못된-날짜" })],
      }),
    });

    const res = await GET(makeRequest("http://localhost/api/market/announcements?symbol=BADDATE_TEST"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(Number.isNaN(new Date(body.items[0].date).getTime())).toBe(false);
  });

  it("시나리오 3: 날짜 역순 정렬 — 최신 공시가 첫 번째", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          makeItem({ id: "old", title: "오래된 공시", date: "2026-01-01T00:00:00Z" }),
          makeItem({ id: "new", title: "최신 공시",   date: "2026-05-31T00:00:00Z" }),
          makeItem({ id: "mid", title: "중간 공시",   date: "2026-03-15T00:00:00Z" }),
        ],
      }),
    });

    const res = await GET(makeRequest("http://localhost/api/market/announcements?symbol=SORT_TEST"));
    const body = await res.json();
    expect(body.items[0].id).toBe("new");
    expect(body.items[1].id).toBe("mid");
    expect(body.items[2].id).toBe("old");
  });

  it("category/source 결측 시 기본값 적용", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{ id: "no-cat", title: "카테고리 없는 공시", date: "2026-05-01T00:00:00Z" }],
      }),
    });

    // 캐시 충돌 방지 — 이 테스트에서만 쓰는 symbol
    const res = await GET(makeRequest("http://localhost/api/market/announcements?symbol=NOCAT_TEST"));
    const body = await res.json();
    expect(body.items[0].category).toBe("공시");
    expect(body.items[0].source).toBe("DART");
  });

  it("정상 응답 — 필수 필드(id/title/date/category/source) 모두 존재", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          makeItem({
            id: "ann-001",
            title: "2026년 1분기 실적 공시",
            date: "2026-05-15T09:00:00.000Z",
            category: "실적",
            source: "DART",
          }),
        ],
      }),
    });

    // 캐시 충돌 방지 — 이 테스트에서만 쓰는 symbol
    const res = await GET(makeRequest("http://localhost/api/market/announcements?symbol=FULLFIELD_TEST"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    const item = body.items[0];
    expect(item.id).toBe("ann-001");
    expect(item.title).toBe("2026년 1분기 실적 공시");
    expect(item.date).toMatch(/^2026-05-15/);
    expect(item.category).toBe("실적");
    expect(item.source).toBe("DART");
  });
});
