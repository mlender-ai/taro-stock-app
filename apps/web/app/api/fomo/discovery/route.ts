import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { withCors, kstDate, cacheVersion } from "../../../../lib/fomo";
import { buildDiscoveryResponse, type DiscoveryResponse } from "../../../../lib/discovery-supply";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const REVALIDATE_S = 600;

export function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET() {
  try {
    const load = unstable_cache(
      async () => buildDiscoveryResponse(),
      ["fomo-discovery", cacheVersion(), kstDate()],
      { revalidate: REVALIDATE_S }
    );
    return withCors(
      NextResponse.json(await load(), {
        headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400" },
      })
    );
  } catch (err) {
    console.warn("[fomo/discovery] failed", (err as Error)?.message);
    return withCors(
      NextResponse.json(
        {
          asOf: kstDate(),
          stocks: [],
          fronts: {},
          confidence: "L",
          source: "데이터 없음",
        } satisfies DiscoveryResponse,
        { headers: { "Cache-Control": "no-store" } }
      )
    );
  }
}
