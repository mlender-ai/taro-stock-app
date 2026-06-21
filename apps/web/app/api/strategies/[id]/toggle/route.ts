import type { NextRequest } from "next/server";

import { proxyPatch } from "../../../_utils";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return proxyPatch(request, `/strategies/${params.id}/toggle`, {});
}
