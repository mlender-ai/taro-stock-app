import type { NextRequest } from "next/server";

import { proxyPatch } from "../../_utils";

export async function PATCH(request: NextRequest) {
  return proxyPatch(request, "/exchange/settings");
}
