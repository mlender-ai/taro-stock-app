import { NextRequest, NextResponse } from "next/server";

// 임시 진단 엔드포인트 — Groq API 연결 검증용
export async function GET(req: NextRequest) {
  const pw = req.nextUrl.searchParams.get("pw");
  if (pw !== "taro-diag-2026") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY not set — get free key at console.groq.com" }, { status: 500 });
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: "Respond with exactly: OK" }],
        max_tokens: 10,
      }),
    });

    const body = await res.text();
    if (!res.ok) {
      return NextResponse.json({ ok: false, status: res.status, body }, { status: 200 });
    }

    const data = JSON.parse(body);
    const reply = data.choices?.[0]?.message?.content?.trim() ?? "(empty)";
    return NextResponse.json({ ok: true, reply, model: "llama-3.3-70b-versatile via Groq" });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}
