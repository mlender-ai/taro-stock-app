import { backendApiFetch } from "../../../../lib/backend-api";
import { NextRequest, NextResponse } from "next/server";
import { authorizeLegacyOperation } from "../../_utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = authorizeLegacyOperation(request);
  if (denied) return denied;

  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? "60");
  const limit = Number.isInteger(requestedLimit)
    ? Math.min(200, Math.max(1, requestedLimit))
    : 60;

  try {
    const data = await backendApiFetch(`/paper/logs?limit=${limit}`);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Upstream unavailable" },
      { status: 502 }
    );
  }
}
