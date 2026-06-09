/**
 * 프로젝트 킥오프 분해 — task 세트 파서/검증/렌더 (톱다운 워크플로 P2).
 *
 * project-kickoff.yml 의 "4축 회의"(LLM) 가 활성 프로젝트를 정렬된 task 배열로 분해해
 * JSON 으로 뱉으면, 이 순수 모듈이 검증·정렬·이슈 본문 렌더를 담당한다.
 * 4축: PL(Product Lead) / TD(Tech-Debt) / BA(Backend·Architecture) / UX(Experience).
 *
 * 순수 export 함수 + main() CLI (process.argv[1] 가드).
 *   parse <project_id> <tasks.json>  → 검증·정렬된 task JSON 배열을 stdout (불량 항목 제외)
 *   render <project_id> <task.json>  → 단일 task 의 이슈 본문(마크다운)을 stdout
 */

import { readFileSync } from "node:fs";

export const AXES = ["PL", "TD", "BA", "UX"] as const;
export type Axis = (typeof AXES)[number];

/** 4축 → GitHub 라벨(통합 후 lane 라벨) 매핑. */
export const AXIS_LABEL: Record<Axis, string> = {
  PL: "product-lead",
  TD: "tech-debt",
  BA: "backend",
  UX: "experience",
};

export interface KickoffTask {
  seq: number;
  axis: Axis;
  title: string;
  rationale: string;
  /** 선행 task 의 seq 들 */
  dependsOn: number[];
  /** 완료 판정 기준(검증 가능) */
  acceptance: string;
}

function coerceAxis(v: unknown): Axis | null {
  if (typeof v !== "string") return null;
  const up = v.trim().toUpperCase();
  return (AXES as readonly string[]).includes(up) ? (up as Axis) : null;
}

function coerceDeps(v: unknown): number[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => Number(x)).filter((n) => Number.isInteger(n) && n > 0);
}

/**
 * LLM 원문(JSON 문자열 또는 객체)을 검증된 task 배열로.
 * - 코드펜스/잡텍스트 둘러싸여도 첫 '['~마지막 ']' 추출.
 * - axis 화이트리스트 밖, title 없음 → 제외(조용히 드롭, 부분 성공 허용).
 * - seq 오름차순 정렬, 자기 자신/미존재 의존성 제거.
 */
export function parseKickoffTasks(raw: string): KickoffTask[] {
  let text = (raw || "").trim();
  if (!text) return [];
  if (!text.startsWith("[")) {
    const s = text.indexOf("[");
    const e = text.lastIndexOf("]");
    if (s === -1 || e === -1 || e <= s) return [];
    text = text.slice(s, e + 1);
  }
  let arr: unknown;
  try {
    arr = JSON.parse(text);
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];

  const tasks: KickoffTask[] = [];
  let auto = 1;
  for (const item of arr) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    const axis = coerceAxis(o.axis);
    const title = typeof o.title === "string" ? o.title.trim() : "";
    if (!axis || !title) continue;
    const seq = Number.isInteger(Number(o.seq)) && Number(o.seq) > 0 ? Number(o.seq) : auto;
    tasks.push({
      seq,
      axis,
      title,
      rationale: typeof o.rationale === "string" ? o.rationale.trim() : "",
      dependsOn: coerceDeps(o.dependsOn),
      acceptance: typeof o.acceptance === "string" ? o.acceptance.trim() : "",
    });
    auto = seq + 1;
  }
  tasks.sort((a, b) => a.seq - b.seq);
  // 존재하는 seq 집합 기준으로 의존성 정리(자기참조·미존재 제거)
  const seqs = new Set(tasks.map((t) => t.seq));
  for (const t of tasks) t.dependsOn = t.dependsOn.filter((d) => d !== t.seq && seqs.has(d));
  return tasks;
}

/** 단일 task 의 GitHub 이슈 본문(마크다운). */
export function renderIssueBody(task: KickoffTask, projectId: string, projectTitle: string): string {
  const deps = task.dependsOn.length ? task.dependsOn.map((d) => `#${d}(seq)`).join(", ") : "없음";
  return [
    `> 🗺️ **프로젝트 ${projectId} · ${projectTitle}** 의 분해 task (킥오프 자동 생성).`,
    "",
    `### 담당 축: ${task.axis} (${AXIS_LABEL[task.axis]})`,
    `### 순서(seq): ${task.seq}  ·  선행: ${deps}`,
    "",
    "### 왜 (프로젝트 정합)",
    task.rationale || "(근거 미기재)",
    "",
    "### 완료 판정 (검증 가능)",
    task.acceptance || "(판정 기준 미기재)",
    "",
    "---",
    `_이 이슈는 \`project:${projectId}\` 세트의 일부다. CEO 승인(슬랙 \"개발해\"/수동) 시에만 구현된다._`,
  ].join("\n");
}

/** 이슈 제목. */
export function renderIssueTitle(task: KickoffTask, projectId: string): string {
  return `[${projectId} · ${task.axis}] ${task.title}`;
}

/** 분해 요약(Slack/리포트). */
export function renderPlan(tasks: KickoffTask[], projectId: string): string {
  if (!tasks.length) return `(${projectId} 분해 task 없음)`;
  return tasks
    .map((t) => `${t.seq}. [${t.axis}] ${t.title}${t.dependsOn.length ? ` (선행 ${t.dependsOn.join(",")})` : ""}`)
    .join("\n");
}

// ─────────────────────────────────────────────────────────────
function main(): void {
  const argv = process.argv;
  const cmd = argv[2];
  if (cmd === "parse") {
    const raw = readFileSync(argv[4] ?? "/dev/stdin", "utf8");
    process.stdout.write(JSON.stringify(parseKickoffTasks(raw)));
  } else if (cmd === "render") {
    const pid = argv[3] ?? "P?";
    const task = JSON.parse(readFileSync(argv[4] ?? "/dev/stdin", "utf8")) as KickoffTask;
    process.stdout.write(renderIssueBody(task, pid, ""));
  } else {
    console.error("usage: tsx scripts/kickoff-tasks.ts <parse|render> <project_id> <file.json>");
    process.exit(1);
  }
}

const invokedPath = process.argv[1] ?? "";
if (invokedPath.includes("kickoff-tasks")) {
  main();
}
