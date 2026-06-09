"use client";

/**
 * FOMO Club 스켈레톤 로딩 컴포넌트.
 * 데이터가 준비되기 전 빈 화면 노출을 막아 정직한 숫자 원칙 유지(#409).
 * 디자인: 검정 배경 + 어두운 shimmer — DESIGN_FOMO.md 색 체계 준수.
 */

interface SkeletonBlockProps {
  width?: string;
  height?: string;
  className?: string;
  rounded?: "sm" | "md" | "full";
}

function SkeletonBlock({
  width = "100%",
  height = "1rem",
  className = "",
  rounded = "md",
}: SkeletonBlockProps) {
  const roundClass = rounded === "full" ? "rounded-full" : rounded === "sm" ? "rounded" : "rounded-xl";
  return (
    <div
      className={`animate-pulse bg-elevated ${roundClass} ${className}`}
      style={{ width, height }}
      aria-hidden
    />
  );
}

/** 홈 화면 FOMO Index 영역 스켈레톤 */
export function FomoIndexSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* 마스코트 자리 */}
      <SkeletonBlock width="84px" height="84px" rounded="full" />
      {/* Index 수치 */}
      <SkeletonBlock width="64px" height="40px" rounded="md" className="mt-1" />
      {/* 상태 텍스트 */}
      <SkeletonBlock width="120px" height="12px" rounded="sm" />
      {/* 포모 멘트 */}
      <SkeletonBlock width="200px" height="12px" rounded="sm" className="mt-2" />
      <SkeletonBlock width="160px" height="12px" rounded="sm" />
    </div>
  );
}

/** 집계(감정 투표 바) 스켈레톤 */
export function TallySkeleton() {
  return (
    <div className="mt-7 flex w-full flex-col gap-2">
      <SkeletonBlock width="140px" height="12px" rounded="sm" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <SkeletonBlock width="40px" height="12px" rounded="sm" />
          <SkeletonBlock height="8px" rounded="full" className="flex-1" />
          <SkeletonBlock width="36px" height="12px" rounded="sm" />
        </div>
      ))}
    </div>
  );
}
