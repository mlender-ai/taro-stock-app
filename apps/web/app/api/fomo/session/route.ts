import { NextRequest, NextResponse } from "next/server";
import { corsJson, withCors } from "../../../../lib/fomo";
import { signSessionId } from "../../../../lib/sessionHmac";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

/**
 * POST /api/fomo/session — 익명 세션 HMAC 서명 발급.
 * 클라이언트가 sessionId를 직접 생성한 뒤, 이 엔드포인트에서 서명을 발급받아 저장한다.
 * 이후 투표 요청 시 서명을 함께 전송하면 서버가 위변조 여부를 검증한다.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { sessionId?: string };
    const sessionId = body.sessionId?.trim();

    if (!sessionId || sessionId.length < 8 || sessionId.length > 128) {
      return corsJson({ error: "유효하지 않은 sessionId", code: "INVALID_SESSION" }, { status: 400 });
    }

    const signature = signSessionId(sessionId);
    return corsJson({ sessionId, signature });
  } catch (err) {
    console.warn("[fomo/session] 서명 발급 오류", err);
    return corsJson({ error: "서명 발급 실패", code: "SIGN_ERROR" }, { status: 500 });
  }
}
