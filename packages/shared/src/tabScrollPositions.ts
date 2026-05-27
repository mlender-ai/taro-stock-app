// 탭 전환 시 스크롤 위치 보존 로직 — 컴포넌트와 분리해 회귀 봉쇄.

export interface TabSwitchPlan<T extends string> {
  positionsAfter: Record<T, number>;
  targetY: number;
}

/**
 * 현재 탭에서 다른 탭으로 전환할 때 어떤 스크롤 위치로 복원할지 계산.
 * - 현재 탭의 스크롤 위치를 저장
 * - 새 탭의 저장된 위치를 반환 (없으면 0)
 */
export function planTabSwitch<T extends string>(
  prevTab: T,
  nextTab: T,
  positions: Record<T, number>,
  currentScrollY: number
): TabSwitchPlan<T> {
  const positionsAfter = { ...positions, [prevTab]: currentScrollY };
  const targetY = positionsAfter[nextTab] ?? 0;
  return { positionsAfter, targetY };
}

/**
 * 압축 헤더를 노출해야 하는지 판단. 임계값을 초과하면 true.
 */
export function shouldShowCompactHeader(scrollY: number, threshold: number): boolean {
  return scrollY >= threshold;
}
