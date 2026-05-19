import { NextResponse } from "next/server";
import { verifyToken, extractBearerToken } from "./jwt";

export function requireAuth(request: Request): string | NextResponse {
  const token = extractBearerToken(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json(
      { error: "Authentication required", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }
  const userId = verifyToken(token);
  if (!userId) {
    return NextResponse.json(
      { error: "Invalid or expired token", code: "INVALID_TOKEN" },
      { status: 401 }
    );
  }
  return userId;
}
