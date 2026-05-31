import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { verifySlackRequest } from "@/lib/slack/verify";
import { postMessage, getThreadHistory } from "@/lib/slack/client";
import { dispatchCommand, KNOWN_COMMANDS } from "@/lib/slack/commands";
import {
  getOpenPRs,
  getCEOBriefIssues,
  getWorkflowRuns,
} from "@/lib/slack/github";

interface SlackEvent {
  type: string;
  challenge?: string;
  event?: {
    type: string;
    text?: string;
    user?: string;
    channel?: string;
    thread_ts?: string;
    ts?: string;
    bot_id?: string;
  };
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const timestamp = req.headers.get("x-slack-request-timestamp") || "";
  const signature = req.headers.get("x-slack-signature") || "";

  const data: SlackEvent = JSON.parse(body);

  if (data.type === "url_verification") {
    return NextResponse.json({ challenge: data.challenge });
  }

  if (!verifySlackRequest(timestamp, body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = data.event;
  if (!event || event.bot_id) {
    return NextResponse.json({ ok: true });
  }

  if (event.type === "app_mention" && event.text && event.channel) {
    const channel = event.channel;
    const replyTs = event.thread_ts || event.ts;
    const rootThreadTs = event.thread_ts || event.ts;

    const text = event.text.replace(/<@[A-Z0-9]+>/g, "").trim();
    const [first, ...rest] = text.split(/\s+/);
    const cmdName = (first || "help").toLowerCase();
    const args = rest.join(" ");

    if (KNOWN_COMMANDS.has(cmdName)) {
      waitUntil(handleMentionAsync(cmdName, args, event.user || "", channel, replyTs));
    } else {
      waitUntil(
        handleAgentChat(text, event.user || "", channel, replyTs, rootThreadTs, event.ts || "")
      );
    }
  }

  return NextResponse.json({ ok: true });
}

async function handleMentionAsync(
  command: string,
  args: string,
  userId: string,
  channel: string,
  threadTs?: string
) {
  try {
    await postMessage(channel, `⏳ 처리 중...`, threadTs);
    const text = await dispatchCommand(command, args, userId, channel);
    await postMessage(channel, text, threadTs);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await postMessage(channel, `❌ 오류: ${msg}`, threadTs).catch(() => {});
  }
}

// ── Agent Chat — OpenAI-compatible, 스레드 멀티턴 대화 ───────────────
// AI_API_URL / AI_API_KEY / AI_MODEL 환경변수로 모델 교체 가능
// 추천: Gemini (무료) → aistudio.google.com 에서 API 키 발급
//   AI_API_URL = https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
//   AI_API_KEY = <Gemini API key>
//   AI_MODEL   = gemini-1.5-flash
async function handleAgentChat(
  currentText: string,
  _userId: string,
  channel: string,
  replyThreadTs: string | undefined,
  rootThreadTs: string,
  currentMsgTs: string
) {
  const AI_API_URL = process.env.AI_API_URL;
  const AI_API_KEY = process.env.AI_API_KEY;
  const AI_MODEL = process.env.AI_MODEL || "gemini-1.5-flash";

  if (!AI_API_URL || !AI_API_KEY) {
    await postMessage(
      channel,
      "❌ `AI_API_URL` / `AI_API_KEY` 환경변수가 설정되지 않았습니다.
Vercel → Settings → Environment Variables에서 추가해주세요.",
      replyThreadTs
    );
    return;
  }

  try {
    await postMessage(channel, `🤔 생각 중...`, replyThreadTs);

    // 스레드 히스토리 + 프로젝트 컨텍스트 병렬 조회
    const [threadHistory, prs, briefs, runs] = await Promise.allSettled([
      getThreadHistory(channel, rootThreadTs),
      getOpenPRs(5),
      getCEOBriefIssues(3),
      getWorkflowRuns("auto-implement.yml", 5),
    ]);

    // 스레드 히스토리 → conversation messages 변환
    const historyMessages: { role: "user" | "assistant"; content: string }[] = [];
    if (threadHistory.status === "fulfilled") {
      for (const msg of threadHistory.value) {
        if (!msg.text || msg.ts === currentMsgTs) continue;
        const cleaned = msg.text.replace(/<@[A-Z0-9]+>/g, "").trim();
        if (!cleaned) continue;
        historyMessages.push({
          role: msg.bot_id ? "assistant" : "user",
          content: cleaned,
        });
      }
    }

    // 프로젝트 컨텍스트 구성
    const prList =
      prs.status === "fulfilled"
        ? (prs.value as { number: number; title: string }[])
            .map((p) => `- #${p.number}: ${p.title}`)
            .join("
")
        : "(조회 실패)";

    const briefList =
      briefs.status === "fulfilled"
        ? (briefs.value as { number: number; title: string }[])
            .map((b) => `- #${b.number}: ${b.title}`)
            .join("
")
        : "(조회 실패)";

    const runList =
      runs.status === "fulfilled"
        ? (
            (
              runs.value as {
                workflow_runs: { conclusion: string; created_at: string; head_branch: string }[];
              }
            ).workflow_runs || []
          )
            .map((r) => `- ${r.conclusion || "running"} (${r.head_branch}) — ${r.created_at}`)
            .join("
")
        : "(조회 실패)";

    const systemPrompt = `당신은 Trading Taro 프로젝트의 Hermes 에이전트입니다.
CEO가 Slack 스레드에서 나누는 대화를 이어받아 한국어로 간결하게 답합니다.
이전 대화 맥락을 반드시 기억하고 연속성 있게 응답하세요.

현재 프로젝트 상태:
## 오픈 PR
${prList || "(없음)"}

## 최근 CEO Brief
${briefList || "(없음)"}

## 최근 auto-implement 실행
${runList || "(없음)"}

규칙:
- 이전 대화를 참고해 맥락 있는 답변
- 3-5문장 이내로 간결하게
- Slack mrkdwn 포맷 사용 (*볼드*, _이탤릭_, \`코드\`)
- 확실하지 않은 것은 솔직하게 모른다고 답변`;

    const messages = [
      ...historyMessages,
      { role: "user" as const, content: currentText },
    ];

    const res = await fetch(AI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: 600,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`AI API ${res.status}: ${errText.slice(0, 200)}`);
    }

    const aiData = (await res.json()) as {
      error?: { message: string };
      choices: { message: { content: string } }[];
    };

    if (aiData.error) throw new Error(aiData.error.message);

    const reply = aiData.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error("AI 응답이 비어있습니다");

    await postMessage(channel, reply, replyThreadTs);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await postMessage(
      channel,
      `❌ 답변 생성 실패: ${msg}`,
      replyThreadTs
    ).catch(() => {});
  }
}
