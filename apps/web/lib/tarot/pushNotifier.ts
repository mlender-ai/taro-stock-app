import { prisma } from "./prisma";
import { fetchMarketSnapshot } from "./market";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: "default";
  channelId?: string;
}

interface ExpoPushReceipt {
  status: "ok" | "error";
  message?: string;
}

async function sendExpoPush(messages: ExpoPushMessage[]): Promise<ExpoPushReceipt[]> {
  const token = process.env["EXPO_PUSH_ACCESS_TOKEN"];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(messages),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) throw new Error(`Expo push error: ${res.status}`);
  const body = (await res.json()) as { data: ExpoPushReceipt[] };
  return body.data;
}

/**
 * 관심 종목 알림 발송
 * - alertEnabled인 즐겨찾기의 종목별 시장 데이터를 조회
 * - 의미 있는 변동(±3% 이상)이 있을 때만 알림 발송
 */
export async function notifyFavoriteChanges(): Promise<{ sent: number; skipped: number; errors: number }> {
  const favorites = await prisma.tarotFavorite.findMany({
    where: { alertEnabled: true },
    include: { user: { select: { id: true, pushToken: true } } },
  });

  // 유저별 + 종목별 그룹핑
  const userFavorites = new Map<string, { pushToken: string; tickers: Array<{ ticker: string; market: "US" | "KR" }> }>();
  for (const fav of favorites) {
    if (!fav.user.pushToken) continue;
    const existing = userFavorites.get(fav.userId);
    const market = (fav.market === "KR" ? "KR" : "US") as "US" | "KR";
    if (existing) {
      existing.tickers.push({ ticker: fav.ticker, market });
    } else {
      userFavorites.set(fav.userId, {
        pushToken: fav.user.pushToken,
        tickers: [{ ticker: fav.ticker, market }],
      });
    }
  }

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  // 종목별 시장 데이터 캐시 (같은 종목 여러 유저에게 반복 조회 방지)
  const snapshotCache = new Map<string, Awaited<ReturnType<typeof fetchMarketSnapshot>> | null>();

  const messages: ExpoPushMessage[] = [];

  for (const [, { pushToken, tickers }] of userFavorites) {
    for (const { ticker, market } of tickers) {
      const cacheKey = `${ticker}:${market}`;
      if (!snapshotCache.has(cacheKey)) {
        try {
          const snapshot = await fetchMarketSnapshot(ticker, market);
          snapshotCache.set(cacheKey, snapshot);
        } catch {
          snapshotCache.set(cacheKey, null);
        }
      }

      const snapshot = snapshotCache.get(cacheKey);
      if (!snapshot) { errors++; continue; }

      // 의미 있는 변동만 알림 (±3% 이상)
      if (Math.abs(snapshot.changePercent) < 3) { skipped++; continue; }

      const direction = snapshot.changePercent > 0 ? "상승" : "하락";
      const emoji = snapshot.changePercent > 0 ? "📈" : "📉";

      messages.push({
        to: pushToken,
        title: `${emoji} ${ticker} ${direction} ${Math.abs(snapshot.changePercent).toFixed(1)}%`,
        body: snapshot.summary,
        data: { ticker, market },
        sound: "default",
        channelId: "default",
      });
    }
  }

  // 배치 발송 (Expo는 100개씩 권장)
  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    try {
      const receipts = await sendExpoPush(batch);
      for (const r of receipts) {
        if (r.status === "ok") sent++;
        else errors++;
      }
    } catch {
      errors += batch.length;
    }
  }

  return { sent, skipped, errors };
}
