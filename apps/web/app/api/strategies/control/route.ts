import type { NextRequest } from "next/server";

import { proxyGet } from "../../_utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.toString();
  return proxyGet(request, search ? `/strategies/control?${search}` : "/strategies/control");
}
