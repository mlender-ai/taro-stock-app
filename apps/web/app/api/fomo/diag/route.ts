import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// 임시 진단 라우트 — Vercel 런타임의 DATABASE_URL 상태 + 배포 최신성 확인(비밀 비노출). 확인 후 제거.
const BUILD_MARKER = "diag-redeploy-2";

export async function GET() {
  const raw = process.env.DATABASE_URL ?? "";
  const info: Record<string, unknown> = {
    buildMarker: BUILD_MARKER,
    hasEnv: raw.length > 0,
    length: raw.length,
    startsWithPostgres: raw.startsWith("postgresql://") || raw.startsWith("postgres://"),
    hasBrackets: /[\[\]]/.test(raw),
    hasWhitespace: /\s/.test(raw),
  };
  try {
    if (raw) {
      const u = new URL(raw);
      info.scheme = u.protocol;
      info.username = u.username;
      info.passwordLength = (u.password || "").length;
      info.host = u.hostname;
      info.port = u.port;
      info.db = u.pathname;
    }
  } catch (e) {
    info.parseError = e instanceof Error ? e.message : String(e);
  }
  return NextResponse.json(info, { headers: { "Cache-Control": "no-store" } });
}
