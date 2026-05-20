import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { extractBearerToken, verifyToken, AUTH_COOKIE_NAME } from "./jwt";

export function requireAuth(req: NextRequest): { userId: string } | NextResponse {
  // 1순위: Authorization Bearer (모바일 앱)
  let token = extractBearerToken(req.headers.get("authorization"));

  // 2순위: HttpOnly 쿠키 (웹 클라이언트)
  if (!token) {
    token = req.cookies.get(AUTH_COOKIE_NAME)?.value ?? null;
  }

  if (!token) {
    return NextResponse.json({ error: "Unauthorized", code: "NO_TOKEN" }, { status: 401 });
  }
  const userId = verifyToken(token);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized", code: "INVALID_TOKEN" }, { status: 401 });
  }
  return { userId };
}
