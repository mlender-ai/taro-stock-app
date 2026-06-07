"use client";

/**
 * 고래/시장 신호 티커 — 전체 텍스트가 가로로 흐른다(줄임표 없이 정보 다 담김).
 * DESIGN_FOMO: surface 1줄, 픽셀 메타, 절제된 모션. prefers-reduced-motion 시 정지.
 */
export function RollingBanner({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  const joined = items.join("       ·       ");
  return (
    <div className="w-full overflow-hidden rounded-xl border border-hairline bg-surface px-4 py-2.5">
      <div className="fomo-ticker font-pixel text-xs text-muted" aria-label={joined}>
        <span className="pr-12">{joined}</span>
        <span className="pr-12" aria-hidden>{joined}</span>
      </div>
    </div>
  );
}
