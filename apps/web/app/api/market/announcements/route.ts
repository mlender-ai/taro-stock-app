import { NextRequest, NextResponse } from "next/server";

// 캐시 TTL: 15분 — 공시는 실시간 업데이트보다 정합성이 중요함
const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = new Map<string, { items: Announcement[]; expiresAt: number }>();

export interface Announcement {
  id: string;
  title: string;
  date: string;          // ISO 8601
  category: string;
  source: string;
  url?: string | undefined;
  description?: string | undefined;
}

interface RawAnnouncement {
  id?: unknown;
  title?: unknown;
  date?: unknown;
  category?: unknown;
  source?: unknown;
  url?: unknown;
  description?: unknown;
}

function safeDate(raw: unknown): string {
  if (typeof raw !== "string" && typeof raw !== "number") {
    return new Date().toISOString();
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function normalizeAnnouncement(raw: RawAnnouncement, fallbackId: number): Announcement | null {
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!title) return null;

  return {
    id:          typeof raw.id === "string" ? raw.id : String(fallbackId),
    title,
    date:        safeDate(raw.date),
    category:    typeof raw.category === "string" && raw.category ? raw.category : "공시",
    source:      typeof raw.source === "string" && raw.source ? raw.source : "DART",
    url:         typeof raw.url === "string" ? raw.url : undefined,
    description: typeof raw.description === "string" ? raw.description : undefined,
  };
}

function deduplicateById(items: Announcement[]): Announcement[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function sortByDateDesc(items: Announcement[]): Announcement[] {
  return [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  const cacheKey = symbol.toUpperCase();
  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) {
    return NextResponse.json({ items: hit.items });
  }

  // 외부 공시 소스가 없을 경우 빈 배열 반환 (크래시 없음)
  const ANNOUNCEMENTS_URL = process.env.ANNOUNCEMENTS_API_URL;
  if (!ANNOUNCEMENTS_URL) {
    return NextResponse.json({ items: [] });
  }

  try {
    const res = await fetch(`${ANNOUNCEMENTS_URL}?symbol=${encodeURIComponent(symbol)}`, {
      headers: { "User-Agent": "TarotStockBot/1.0" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.warn(JSON.stringify({ metric: "announcements_fetch_fail", symbol, status: res.status }));
      return NextResponse.json({ items: [] });
    }

    const json = await res.json();
    const rawItems: RawAnnouncement[] = Array.isArray(json.items) ? json.items : [];

    const normalized = rawItems
      .map((raw, i) => normalizeAnnouncement(raw, i))
      .filter((item): item is Announcement => item !== null);

    const items = sortByDateDesc(deduplicateById(normalized));

    cache.set(cacheKey, { items, expiresAt: Date.now() + CACHE_TTL_MS });
    return NextResponse.json({ items });
  } catch (err) {
    console.warn(JSON.stringify({ metric: "announcements_error", symbol, error: err instanceof Error ? err.message : String(err) }));
    return NextResponse.json({ items: [] });
  }
}
