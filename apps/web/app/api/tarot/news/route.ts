import { NextRequest, NextResponse } from "next/server";

const YAHOO_RSS_URL = "https://feeds.finance.yahoo.com/rss/2.0/headline";
const USER_AGENT = "Mozilla/5.0 (compatible; TarotStockBot/1.0)";

const CACHE_TTL_MS = 10 * 60 * 1000; // 10분 캐시
const cache = new Map<string, { data: NewsItem[]; expiresAt: number }>();

interface NewsItem {
  title: string;
  description: string;
  link: string;
  publishedAt: string;
  source: string;
}

function parseYahooRss(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]!;
    const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
      ?? block.match(/<title>(.*?)<\/title>/)?.[1]
      ?? "";
    const link = block.match(/<link>(.*?)<\/link>/)?.[1] ?? "";
    const description = block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1]
      ?? block.match(/<description>(.*?)<\/description>/)?.[1]
      ?? "";
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? "";
    const source = block.match(/<source[^>]*>(.*?)<\/source>/)?.[1]
      ?? block.match(/<source[^>]*url="([^"]*)".*?<\/source>/)?.[1]
      ?? "Yahoo Finance";

    if (title && link) {
      items.push({
        title: title.trim(),
        description: description.replace(/<[^>]*>/g, "").trim().slice(0, 200),
        link: link.trim(),
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        source: source.trim() || "Yahoo Finance",
      });
    }
  }
  return items;
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "10"), 20);

  const now = Date.now();
  const hit = cache.get(symbol);
  if (hit && hit.expiresAt > now) {
    return NextResponse.json({ items: hit.data.slice(0, limit) });
  }

  try {
    const url = new URL(YAHOO_RSS_URL);
    url.searchParams.set("s", symbol);
    url.searchParams.set("region", "US");
    url.searchParams.set("lang", "en-US");

    const res = await fetch(url.toString(), {
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      return NextResponse.json({ items: [] });
    }

    const xml = await res.text();
    const items = parseYahooRss(xml);

    cache.set(symbol, { data: items, expiresAt: now + CACHE_TTL_MS });
    return NextResponse.json({ items: items.slice(0, limit) });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
