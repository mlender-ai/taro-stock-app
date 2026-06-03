// #318 QA: 뉴스 데이터 정합성 검증
// 시나리오: 날짜 정렬, 필수 필드 결측 처리, 중복 제거
import { describe, it, expect } from "vitest";

// === 테스트 대상 로직 (route.ts 에서 추출한 순수 함수) ===

interface NewsItem {
  title: string;
  description: string;
  summary: string;
  link: string;
  publishedAt: string;
  source: string;
  category: string;
}

function safePublishedAt(pubDate: string): string {
  if (!pubDate) return new Date(0).toISOString();
  const d = new Date(pubDate);
  return Number.isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();
}

function parseYahooRss(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const seen = new Set<string>();
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]!;
    const title =
      block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ??
      block.match(/<title>(.*?)<\/title>/)?.[1] ??
      "";
    const link = block.match(/<link>(.*?)<\/link>/)?.[1] ?? "";
    const description =
      block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ??
      block.match(/<description>(.*?)<\/description>/)?.[1] ??
      "";
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? "";
    const source =
      block.match(/<source[^>]*>(.*?)<\/source>/)?.[1] ?? "Yahoo Finance";

    const cleanTitle = title.trim();
    const cleanLink = link.trim();
    if (!cleanTitle || !cleanLink) continue;
    if (seen.has(cleanLink)) continue;
    seen.add(cleanLink);

    items.push({
      title: cleanTitle,
      description: description.replace(/<[^>]*>/g, "").trim().slice(0, 200),
      summary: description.trim().slice(0, 200),
      link: cleanLink,
      publishedAt: safePublishedAt(pubDate),
      source: source.trim() || "Yahoo Finance",
      category: "시장",
    });
  }
  return items;
}

// 날짜 내림차순 정렬 (최신 순)
function sortByNewest(items: NewsItem[]): NewsItem[] {
  return [...items].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

// === 테스트 ===

describe("뉴스 데이터 정합성", () => {
  // Scenario 1: 최신 순 정렬
  describe("시나리오 1 — 날짜 내림차순 정렬", () => {
    it("publishedAt 기준 최신 뉴스가 최상단에 위치한다", () => {
      const items: NewsItem[] = [
        { title: "구식 뉴스", description: "", summary: "", link: "https://a.com/old", publishedAt: "2026-05-01T00:00:00Z", source: "test", category: "시장" },
        { title: "최신 뉴스", description: "", summary: "", link: "https://a.com/new", publishedAt: "2026-06-03T10:00:00Z", source: "test", category: "시장" },
        { title: "중간 뉴스", description: "", summary: "", link: "https://a.com/mid", publishedAt: "2026-05-20T00:00:00Z", source: "test", category: "시장" },
      ];

      const sorted = sortByNewest(items);

      expect(sorted[0]!.title).toBe("최신 뉴스");
      expect(sorted[1]!.title).toBe("중간 뉴스");
      expect(sorted[2]!.title).toBe("구식 뉴스");
    });

    it("RSS XML이 날짜 역순으로 오더라도 정렬 후 최신 순이 된다", () => {
      const xml = `
        <rss><channel>
          <item>
            <title>오래된 뉴스</title>
            <link>https://a.com/1</link>
            <pubDate>Mon, 01 May 2026 00:00:00 GMT</pubDate>
          </item>
          <item>
            <title>신규 뉴스</title>
            <link>https://a.com/2</link>
            <pubDate>Tue, 03 Jun 2026 09:00:00 GMT</pubDate>
          </item>
        </channel></rss>
      `;
      const parsed = parseYahooRss(xml);
      const sorted = sortByNewest(parsed);

      expect(sorted[0]!.title).toBe("신규 뉴스");
    });
  });

  // Scenario 2: 필수 필드 결측 처리
  describe("시나리오 2 — 필수 필드 결측 뉴스 제외", () => {
    it("title이 없는 항목은 파싱 결과에서 제외된다", () => {
      const xml = `
        <rss><channel>
          <item>
            <title></title>
            <link>https://a.com/no-title</link>
            <pubDate>Tue, 03 Jun 2026 09:00:00 GMT</pubDate>
          </item>
          <item>
            <title>정상 뉴스</title>
            <link>https://a.com/valid</link>
            <pubDate>Tue, 03 Jun 2026 09:00:00 GMT</pubDate>
          </item>
        </channel></rss>
      `;
      const items = parseYahooRss(xml);

      expect(items.length).toBe(1);
      expect(items[0]!.title).toBe("정상 뉴스");
    });

    it("link가 없는 항목은 파싱 결과에서 제외된다", () => {
      const xml = `
        <rss><channel>
          <item>
            <title>링크 없는 뉴스</title>
            <link></link>
            <pubDate>Tue, 03 Jun 2026 09:00:00 GMT</pubDate>
          </item>
          <item>
            <title>링크 있는 뉴스</title>
            <link>https://a.com/has-link</link>
            <pubDate>Tue, 03 Jun 2026 09:00:00 GMT</pubDate>
          </item>
        </channel></rss>
      `;
      const items = parseYahooRss(xml);

      expect(items.length).toBe(1);
      expect(items[0]!.title).toBe("링크 있는 뉴스");
    });

    it("잘못된 pubDate는 에러 없이 안전하게 처리된다", () => {
      const badDates = ["", "not-a-date", "0000-99-99"];
      for (const d of badDates) {
        expect(() => safePublishedAt(d)).not.toThrow();
        const result = safePublishedAt(d);
        expect(typeof result).toBe("string");
        expect(result.endsWith("Z")).toBe(true);
      }
    });
  });

  // Scenario 3: 중복 제거
  describe("시나리오 3 — 동일 link 중복 기사 제거", () => {
    it("같은 링크의 뉴스가 여러 번 등장해도 한 번만 포함된다", () => {
      const xml = `
        <rss><channel>
          <item>
            <title>첫 번째 중복</title>
            <link>https://a.com/dup</link>
            <pubDate>Tue, 03 Jun 2026 09:00:00 GMT</pubDate>
          </item>
          <item>
            <title>두 번째 중복 (같은 링크)</title>
            <link>https://a.com/dup</link>
            <pubDate>Tue, 03 Jun 2026 09:30:00 GMT</pubDate>
          </item>
          <item>
            <title>유니크 뉴스</title>
            <link>https://a.com/unique</link>
            <pubDate>Tue, 03 Jun 2026 10:00:00 GMT</pubDate>
          </item>
        </channel></rss>
      `;
      const items = parseYahooRss(xml);

      expect(items.length).toBe(2);
      expect(items.map((i) => i.link)).toEqual(["https://a.com/dup", "https://a.com/unique"]);
    });
  });

  // 경계값 테스트
  describe("경계값 처리", () => {
    it("뉴스가 없는 빈 RSS는 빈 배열을 반환한다", () => {
      const xml = `<rss><channel></channel></rss>`;
      expect(parseYahooRss(xml)).toEqual([]);
    });

    it("description의 HTML 태그는 제거된다", () => {
      const xml = `
        <rss><channel>
          <item>
            <title>테스트</title>
            <link>https://a.com/1</link>
            <description><![CDATA[<p>본문 <b>내용</b></p>]]></description>
            <pubDate>Tue, 03 Jun 2026 09:00:00 GMT</pubDate>
          </item>
        </channel></rss>
      `;
      const items = parseYahooRss(xml);
      expect(items[0]!.description).toBe("본문 내용");
    });
  });
});
