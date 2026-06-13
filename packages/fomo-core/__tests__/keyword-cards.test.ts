import { describe, expect, it } from "vitest";
import { MOCK_KEYWORD_CARDS } from "../src";

const BANNED =
  /가이던스|EPS|어닝|펀더멘탈|매수|매도|롱\b|숏\b|사세요|파세요|사라\b|팔아라|오를 거|오를거|급등 예상|확실히 오/;
const BALANCE = /조심|급할 거|안 급|천천히|휩쓸|늦춰|무서워할|아쉬워/;

function allText(): string {
  return MOCK_KEYWORD_CARDS.map(
    (c) => `${c.comment} ${c.depth.why} ${c.depth.remember}`
  ).join("\n");
}

describe("MOCK_KEYWORD_CARDS", () => {
  it("5~7개, 필수 필드 채워짐", () => {
    expect(MOCK_KEYWORD_CARDS.length).toBeGreaterThanOrEqual(5);
    expect(MOCK_KEYWORD_CARDS.length).toBeLessThanOrEqual(7);
    for (const c of MOCK_KEYWORD_CARDS) {
      expect(c.keyword).toBeTruthy();
      expect(c.emoji).toBeTruthy();
      expect(c.fomoScore).toBeGreaterThanOrEqual(0);
      expect(c.fomoScore).toBeLessThanOrEqual(100);
      expect(c.comment.length).toBeGreaterThan(10);
      expect(c.related.length).toBeGreaterThan(0);
      expect(c.depth.why.length).toBeGreaterThan(10);
      expect(c.depth.remember.length).toBeGreaterThan(10);
    }
  });

  it("id 중복 없음 + 점수 높은 순 정렬", () => {
    const ids = MOCK_KEYWORD_CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const scores = MOCK_KEYWORD_CARDS.map((c) => c.fomoScore);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it("전문용어/거래부추김/예측 단정 0건 (§0)", () => {
    expect(allText()).not.toMatch(BANNED);
  });

  it("모든 카드에 포모 균형추가 담겨 있다 (포모 완화)", () => {
    for (const c of MOCK_KEYWORD_CARDS) {
      expect(`${c.comment} ${c.depth.remember}`).toMatch(BALANCE);
    }
  });
});
