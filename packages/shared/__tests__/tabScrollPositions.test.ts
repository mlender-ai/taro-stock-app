import { describe, it, expect } from "vitest";
import { planTabSwitch, shouldShowCompactHeader } from "../src/tabScrollPositions";

describe("planTabSwitch", () => {
  it("현재 탭의 스크롤 위치를 저장하고 새 탭의 저장된 위치로 이동", () => {
    const positions = { chart: 0, info: 0 };
    const plan = planTabSwitch("chart", "info", positions, 150);
    expect(plan.positionsAfter.chart).toBe(150);
    expect(plan.positionsAfter.info).toBe(0);
    expect(plan.targetY).toBe(0);
  });

  it("이전에 저장된 위치가 있으면 그 위치로 복원", () => {
    const positions = { chart: 0, info: 300 };
    const plan = planTabSwitch("chart", "info", positions, 50);
    expect(plan.positionsAfter.chart).toBe(50);
    expect(plan.positionsAfter.info).toBe(300);
    expect(plan.targetY).toBe(300);
  });

  it("같은 탭으로 전환 — 현재 위치 저장 후 동일 위치로", () => {
    const positions = { chart: 100, info: 0 };
    const plan = planTabSwitch("chart", "chart", positions, 200);
    // 마지막 set이 우선이므로 결과적으로 200
    expect(plan.positionsAfter.chart).toBe(200);
    expect(plan.targetY).toBe(200);
  });

  it("원본 positions 객체를 변형하지 않음 (불변)", () => {
    const positions = { chart: 0, info: 0 };
    planTabSwitch("chart", "info", positions, 100);
    expect(positions.chart).toBe(0);
    expect(positions.info).toBe(0);
  });

  it("3개 탭에서 한 탭만 갱신", () => {
    type T = "a" | "b" | "c";
    const positions: Record<T, number> = { a: 10, b: 20, c: 30 };
    const plan = planTabSwitch<T>("b", "c", positions, 99);
    expect(plan.positionsAfter.a).toBe(10);
    expect(plan.positionsAfter.b).toBe(99);
    expect(plan.positionsAfter.c).toBe(30);
    expect(plan.targetY).toBe(30);
  });
});

describe("shouldShowCompactHeader", () => {
  it("임계값 미만 → false", () => {
    expect(shouldShowCompactHeader(50, 140)).toBe(false);
  });

  it("임계값 정확히 일치 → true", () => {
    expect(shouldShowCompactHeader(140, 140)).toBe(true);
  });

  it("임계값 초과 → true", () => {
    expect(shouldShowCompactHeader(200, 140)).toBe(true);
  });

  it("음수 스크롤(bounce) → false", () => {
    expect(shouldShowCompactHeader(-20, 140)).toBe(false);
  });
});
