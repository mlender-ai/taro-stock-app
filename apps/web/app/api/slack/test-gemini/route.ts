import { NextRequest, NextResponse } from "next/server";

// 임시 진단 엔드포인트 — GitHub Models 연결 검증용
export async function GET(req: NextRequest) {
  const pw = req.nextUrl.searchParams.get("pw");
  if (pw !== "taro-diag-2026") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const GITHUB_PAT = process.env.GITHUB_PAT;
  if (!GITHUB_PAT) {
    return NextResponse.json({ error: "GITHUB_PAT not set" }, { status: 500 });
  }

  try {
    const res = await fetch("https://models.github.ai/inference/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_PAT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
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
    return NextResponse.json({ ok: true, reply, model: "openai/gpt-4o via GitHub Models" });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}
