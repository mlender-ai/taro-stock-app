import { describe, it, expect } from "vitest";
import {
  parseKickoffTasks,
  renderIssueBody,
  renderIssueTitle,
  renderPlan,
  AXES,
} from "../kickoff-tasks";

describe("parseKickoffTasks", () => {
  const good = JSON.stringify([
    { seq: 1, axis: "PL", title: "포모 홈 와이어 정의", rationale: "심장", dependsOn: [], acceptance: "와이어 확정" },
    { seq: 2, axis: "UX", title: "감정 선택→반응 전환", rationale: "love mark", dependsOn: [1], acceptance: "전환 동작" },
    { seq: 3, axis: "BA", title: "감정 집계 API", rationale: "데이터", dependsOn: [1], acceptance: "API 200" },
  ]);

  it("정상 JSON 을 seq 순 정렬 파싱", () => {
    const t = parseKickoffTasks(good);
    expect(t.map((x) => x.seq)).toEqual([1, 2, 3]);
    expect(t[1]!.axis).toBe("UX");
    expect(t[1]!.dependsOn).toEqual([1]);
  });
  it("코드펜스/잡텍스트로 둘러싸여도 배열 추출", () => {
    const wrapped = "```json\n" + good + "\n``` 끝!";
    expect(parseKickoffTasks(wrapped)).toHaveLength(3);
  });
  it("axis 화이트리스트 밖/제목 없음은 제외", () => {
    const raw = JSON.stringify([
      { seq: 1, axis: "PL", title: "ok" },
      { seq: 2, axis: "MARKETING", title: "직군밖" },
      { seq: 3, axis: "UX", title: "" },
    ]);
    const t = parseKickoffTasks(raw);
    expect(t).toHaveLength(1);
    expect(t[0]!.title).toBe("ok");
  });
  it("미존재/자기참조 의존성 제거", () => {
    const raw = JSON.stringify([
      { seq: 1, axis: "PL", title: "a", dependsOn: [1, 99] },
      { seq: 2, axis: "TD", title: "b", dependsOn: [1] },
    ]);
    const t = parseKickoffTasks(raw);
    expect(t[0]!.dependsOn).toEqual([]); // 자기(1)·미존재(99) 제거
    expect(t[1]!.dependsOn).toEqual([1]);
  });
  it("seq 누락 시 자동 채번", () => {
    const raw = JSON.stringify([{ axis: "PL", title: "a" }, { axis: "UX", title: "b" }]);
    expect(parseKickoffTasks(raw).map((x) => x.seq)).toEqual([1, 2]);
  });
  it("빈/불량 입력은 빈 배열", () => {
    expect(parseKickoffTasks("")).toEqual([]);
    expect(parseKickoffTasks("not json")).toEqual([]);
    expect(parseKickoffTasks("{}")).toEqual([]);
  });
  it("AXES 는 4축", () => {
    expect([...AXES]).toEqual(["PL", "TD", "BA", "UX"]);
  });
});

describe("render", () => {
  const task = { seq: 2, axis: "UX" as const, title: "전환", rationale: "love mark", dependsOn: [1], acceptance: "동작" };
  it("이슈 제목 = [P1 · UX] 전환", () => {
    expect(renderIssueTitle(task, "P1")).toBe("[P1 · UX] 전환");
  });
  it("본문에 담당축·선행·완료판정 포함", () => {
    const b = renderIssueBody(task, "P1", "단 하나의 순간");
    expect(b).toContain("담당 축: UX");
    expect(b).toContain("선행: #1(seq)");
    expect(b).toContain("동작");
    expect(b).toContain("project:P1");
  });
  it("renderPlan 요약", () => {
    const plan = renderPlan(parseKickoffTasks(JSON.stringify([
      { seq: 1, axis: "PL", title: "a" },
      { seq: 2, axis: "BA", title: "b", dependsOn: [1] },
    ])), "P1");
    expect(plan).toContain("1. [PL] a");
    expect(plan).toContain("2. [BA] b (선행 1)");
  });
});
