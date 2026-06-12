import type { NewsLang, RawArticle } from "./types";

/**
 * Yahoo Finance RSS XML → RawArticle[] (순수 파서, 테스트 보장).
 * docs/PIVOT_FEED_FIRST.md. 타로 news 라우트의 파서와 독립(타로 코드 미접촉 원칙).
 *
 * 한국어 소스(네이버/연합 RSS)를 붙일 때도 같은 RawArticle 로 정규화하면 점수기·피드를 공유한다.
 */

const CATEGORY_KEYWORDS: { re: RegExp; category: string }[] = [
  { re: /\b(earnings|revenue|profit|guidance|eps|quarterly|results)\b/i, category: "실적" },
  { re: /\b(merger|acquisition|deal|buyout|takeover|m&a)\b/i, category: "M&A" },
  { re: /\b(upgrade|downgrade|rating|price target|analyst)\b/i, category: "애널리스트" },
  { re: /\b(dividend|buyback|split|payout)\b/i, category: "주주환원" },
  { re: /\b(lawsuit|sec|investigation|fine|regulation|fda|approval)\b/i, category: "규제/소송" },
  { re: /\b(ai|chip|semiconductor|cloud|software)\b/i, category: "기술" },
  { re: /\b(fed|inflation|rate|economy|gdp|jobs|cpi)\b/i, category: "거시경제" },
];

function inferCategory(title: string, description: string, raw: string): string {
  if (raw) return raw;
  const blob = `${title} ${description}`;
  for (const { re, category } of CATEGORY_KEYWORDS) if (re.test(blob)) return category;
  return "시장";
}

/** pubDate 비정상 → 현재 시각 대신 빈 값 처리는 호출부에서. 여기선 ISO 또는 원문 반환. */
function toIso(pubDate: string): string {
  if (!pubDate) return "";
  const d = new Date(pubDate);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

/** 안정 id — url 기반 슬러그. */
function slugId(url: string): string {
  return `news-${url.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "-").slice(0, 60)}`;
}

/**
 * 범용 RSS 2.0 파서 — 한국 금융 뉴스(한경/매경/연합 등) 정규화용.
 * 표준 <item>(title/link/description/pubDate)만 본다. category 영문 추론 없음(한국어 소스).
 * source(출처명)·lang 은 호출부가 지정. 같은 RawArticle 로 정규화되어 점수기·피드를 공유.
 */
export function parseRssFeed(
  xml: string,
  opts: { source: string; lang: NewsLang; nowIso: string }
): RawArticle[] {
  const { source, lang, nowIso } = opts;
  const items: RawArticle[] = [];
  const seen = new Set<string>();
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]!;
    const title =
      block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ??
      block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ??
      "";
    // link: <link>url</link> 또는 일부 피드의 <link ...>url</link>
    const link =
      block.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/)?.[1] ??
      block.match(/<link[^>]*>([\s\S]*?)<\/link>/)?.[1] ??
      "";
    const description =
      block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ??
      block.match(/<description>([\s\S]*?)<\/description>/)?.[1] ??
      "";
    const pubDate =
      block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ??
      block.match(/<dc:date>([\s\S]*?)<\/dc:date>/)?.[1] ??
      "";

    const cleanTitle = title.replace(/<[^>]*>/g, "").trim();
    const cleanLink = link.trim();
    if (!cleanTitle || !cleanLink) continue;
    if (seen.has(cleanLink)) continue;
    seen.add(cleanLink);

    const cleanDesc = description.replace(/<[^>]*>/g, "").trim().slice(0, 200);
    items.push({
      id: slugId(cleanLink),
      title: cleanTitle,
      url: cleanLink,
      source,
      publishedAt: toIso(pubDate) || nowIso,
      lang,
      ...(cleanDesc ? { summary: cleanDesc } : {}),
    });
  }
  return items;
}

export function parseYahooRss(
  xml: string,
  opts: { symbol?: string; nowIso: string; lang?: NewsLang } = { nowIso: "" }
): RawArticle[] {
  const { symbol, nowIso, lang = "en" } = opts;
  const items: RawArticle[] = [];
  const seen = new Set<string>();
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]!;
    const title =
      block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ??
      block.match(/<title>(.*?)<\/title>/)?.[1] ??
      "";
    const link = block.match(/<link>(.*?)<\/link>/)?.[1] ?? "";
    const description =
      block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ??
      block.match(/<description>([\s\S]*?)<\/description>/)?.[1] ??
      "";
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? "";
    const source =
      block.match(/<source[^>]*>(.*?)<\/source>/)?.[1] ?? "Yahoo Finance";
    const rawCategory =
      block.match(/<category><!\[CDATA\[(.*?)\]\]><\/category>/)?.[1] ??
      block.match(/<category>(.*?)<\/category>/)?.[1] ??
      "";

    const cleanTitle = title.trim();
    const cleanLink = link.trim();
    if (!cleanTitle || !cleanLink) continue; // 필수 결측 제외
    if (seen.has(cleanLink)) continue;
    seen.add(cleanLink);

    const cleanDesc = description.replace(/<[^>]*>/g, "").trim().slice(0, 200);
    items.push({
      id: slugId(cleanLink),
      title: cleanTitle,
      url: cleanLink,
      source: source.trim() || "Yahoo Finance",
      publishedAt: toIso(pubDate) || nowIso,
      category: inferCategory(cleanTitle, cleanDesc, rawCategory.trim()),
      lang,
      ...(cleanDesc ? { summary: cleanDesc } : {}),
      ...(symbol ? { symbol } : {}),
    });
  }
  return items;
}
