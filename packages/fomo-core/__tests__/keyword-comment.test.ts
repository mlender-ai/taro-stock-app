import { describe, expect, it } from "vitest";
import {
  buildKeywordCard,
  buildKeywordCards,
  overallConfidence,
  CALM_MARKERS,
  communityEngagementByTheme,
  mergeCommunityEngagement,
  extractKeywords,
  scoreKeywords,
  josa,
  hasBatchim,
  type KeywordSourceItem,
  type ScoredKeyword,
  type CommunitySourceSignal,
} from "../src";

const NOW = Date.parse("2026-06-13T12:00:00Z");

const SAMPLE: KeywordSourceItem[] = [
  { title: "엔비디아 신고가 급등, HBM 수요 폭발", publishedAt: "2026-06-13T11:00:00Z", source: "한국경제" },
  { title: "삼성전자 반도체 랠리 지속", publishedAt: "2026-06-13T11:00:00Z", source: "매일경제" },
  { title: "비트코인 다시 상승, 코인판 들썩", publishedAt: "2026-06-13T11:00:00Z", source: "블록미디어" },
  { title: "연준 FOMC 앞두고 금리 관망", publishedAt: "2026-06-13T11:00:00Z", source: "연합뉴스" },
];

function scoreSample(): ScoredKeyword[] {
  return scoreKeywords(extractKeywords(SAMPLE), { nowMs: NOW });
}

/** 코멘트 가드(§2): 예측·투자조언·전문용어·거래부추김 금칙어. */
const FORBIDDEN = /사라|팔아라|매수|매도|목표가|오를 것|내릴 것|상승할|하락할|지금 안 사면|PER|밸류에이션|추천/;

describe("buildKeywordCards (룰 폴백 코멘트)", () => {
  it("모든 카드 코멘트에 균형추(진정) 마커가 최소 1개", () => {
    const cards = buildKeywordCards(scoreSample());
    expect(cards.length).toBeGreaterThan(0);
    for (const c of cards) {
      const hasCalm = CALM_MARKERS.some((m) => c.comment.includes(m) || c.depth.remember.includes(m));
      expect(hasCalm, `카드 ${c.keyword} 균형추 누락`).toBe(true);
    }
  });

  it("모든 카드(코멘트+depth)에 금칙어가 없다", () => {
    const cards = buildKeywordCards(scoreSample());
    for (const c of cards) {
      const blob = `${c.comment} ${c.depth.why} ${c.depth.remember}`;
      expect(FORBIDDEN.test(blob), `카드 ${c.keyword} 금칙어`).toBe(false);
    }
  });

  it("점수 전 구간(0~100)에서도 균형추 유지 + 금칙어 0", () => {
    const base = scoreSample()[0]!;
    for (const score of [5, 30, 50, 70, 95]) {
      const card = buildKeywordCards([{ ...base, fomoScore: score }])[0]!;
      const blob = `${card.comment} ${card.depth.remember}`;
      expect(CALM_MARKERS.some((m) => blob.includes(m))).toBe(true);
      expect(FORBIDDEN.test(`${card.comment} ${card.depth.why} ${card.depth.remember}`)).toBe(false);
    }
  });

  it("관련 종목/이모지가 카드로 전달된다", () => {
    const cards = buildKeywordCards(scoreSample());
    const semi = cards.find((c) => c.keyword === "반도체")!;
    expect(semi.related).toContain("삼성전자");
    expect(semi.emoji).toBe("🔥");
  });
});

describe("josa (조사 받침 처리)", () => {
  it("받침 유무로 은/는 선택", () => {
    expect(josa("코인", "은는")).toBe("은"); // ㄴ 받침
    expect(josa("반도체", "은는")).toBe("는"); // 모음
    expect(josa("금리", "은는")).toBe("는");
    expect(josa("2차전지", "은는")).toBe("는");
  });
  it("영문 약어 예외맵 — AI는 받침 없음", () => {
    expect(hasBatchim("AI")).toBe(false);
    expect(josa("AI", "은는")).toBe("는");
  });
  it("이/가·을/를도 받침 따라", () => {
    expect(josa("코인", "이가")).toBe("이");
    expect(josa("반도체", "이가")).toBe("가");
    expect(josa("코인", "을를")).toBe("을");
  });
  it("카드 코멘트에 '코인는' 같은 오류가 없다", () => {
    const cards = buildKeywordCards(scoreSample());
    for (const c of cards) {
      expect(c.comment.includes("코인는")).toBe(false);
      // 일반화: 받침 있는 키워드 뒤 '는', 없는 키워드 뒤 '은'이 붙는 오류 차단
      expect(c.comment.includes(`${c.keyword}는`) && hasBatchim(c.keyword)).toBe(false);
    }
  });
});

describe("코멘트 변주 (밴드 중복 해소)", () => {
  it("결정적 — 같은 입력은 항상 같은 코멘트(캐시 정합)", () => {
    const k = scoreSample()[0]!;
    expect(buildKeywordCard(k).comment).toBe(buildKeywordCard(k).comment);
  });
  it("같은 밴드라도 키워드가 다르면 코멘트가 동일하지 않다", () => {
    const base = scoreSample()[0]!;
    // 같은 점수(밴드)지만 다른 키워드 → 변주 풀 + 키워드명으로 달라진다
    const a = buildKeywordCard({ ...base, keyword: "코인", emoji: "₿", fomoScore: 30, mentions: 11 });
    const b = buildKeywordCard({ ...base, keyword: "금리", emoji: "💵", fomoScore: 30, mentions: 7 });
    expect(a.comment).not.toBe(b.comment);
  });
  it("코멘트에 mention 수가 반영된다", () => {
    const base = scoreSample()[0]!;
    const card = buildKeywordCard({ ...base, keyword: "AI", fomoScore: 66, mentions: 23 });
    expect(card.comment.includes("23")).toBe(true);
  });
});

describe("overallConfidence (정직성)", () => {
  it("키워드 0건 → fallback", () => {
    expect(overallConfidence([])).toBe("fallback");
  });
  it("Phase 2 라이브(전부 low) → low", () => {
    expect(overallConfidence(scoreSample())).toBe("low");
  });
});

describe("communityEngagementByTheme / merge (§4.3 커뮤니티 귀속)", () => {
  const signals: CommunitySourceSignal[] = [
    { source: "naver/005930", postCount: 40, totalUpvotes: 40, totalComments: 0, bullishRatio: 0.6, fetchedAt: "" }, // 삼성전자 → 반도체
    { source: "reddit/cryptocurrency", postCount: 25, totalUpvotes: 200, totalComments: 80, bullishRatio: 0.7, fetchedAt: "" }, // → 코인
    { source: "naver/035720", postCount: 30, totalUpvotes: 30, totalComments: 0, bullishRatio: 0.5, fetchedAt: "" }, // 카카오 → 매핑 없음
  ];

  it("소스 라벨 → 테마 매핑(옵션 F: 글 수 기준), 매핑 없는 소스는 제외", () => {
    const map = communityEngagementByTheme(signals);
    // 옵션 F: engagement = postCount(글 수). reddit upvote(200+80) 안 씀 → 단위 통일.
    expect(map.get("반도체")?.engagement).toBe(40); // postCount 40
    expect(map.get("코인")?.engagement).toBe(25); // postCount 25 (업보트 무시)
    expect(map.has("2차전지")).toBe(false);
    // 카카오(매핑 없음)는 어떤 테마에도 안 들어간다
    expect([...map.keys()]).toEqual(expect.arrayContaining(["반도체", "코인"]));
    expect(map.size).toBe(2);
  });

  it("뉴스로 확인된 테마에만 참여도 가산(커뮤니티-단독 테마 신설 안 함)", () => {
    const extracted = extractKeywords(SAMPLE); // 반도체·코인·금리·AI (뉴스 근거)
    const merged = mergeCommunityEngagement(extracted, signals);
    const semi = merged.find((k) => k.keyword === "반도체")!;
    const coin = merged.find((k) => k.keyword === "코인")!;
    expect(semi.engagement).toBe(40); // 뉴스 0 + 커뮤니티 글수 40
    expect(coin.engagement).toBe(25); // 옵션 F: 글수 25 (업보트 아님)
    // 커뮤니티 시그널이 새 테마를 만들지 않는다(키 수 동일)
    expect(merged.length).toBe(extracted.length);
  });

  it("빈 시그널 → 추출 그대로(에러 없음)", () => {
    const extracted = extractKeywords(SAMPLE);
    expect(mergeCommunityEngagement(extracted, [])).toEqual(extracted);
  });
});
