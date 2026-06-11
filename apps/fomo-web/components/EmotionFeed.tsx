"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FEED_EMOTIONS,
  FEED_EMOTION_LABELS,
  FEED_EMOTION_COLORS,
  MOCK_FEED_CARDS,
  type EmotionCard,
  type FeedEmotion,
} from "@fomo/core";

/**
 * 피드 탭 — 감정 카테고리. docs/PIVOT_FEED_FIRST.md Phase 2.
 *
 * - 탭에 들어가는 행위 자체가 그 감정 선택 (별도 입력/투표 없음).
 * - 무한 스크롤, 릴스/숏츠처럼 슥 보다가 나감. 좋아요/댓글/투표 없음 (액션 제로).
 * - 정보가 주인공이 아니라 감정이 주인공 — 수치/출처는 근거로 작게.
 * - 데이터: 지금은 mock 풀 순환. Phase 3에서 감정 치환 엔진이 공급.
 */
const PAGE_SIZE = 6;

export function EmotionFeed({
  cards = MOCK_FEED_CARDS,
}: {
  cards?: Record<FeedEmotion, EmotionCard[]>;
}) {
  const [emotion, setEmotion] = useState<FeedEmotion>("fomo");
  const [count, setCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const pool = cards[emotion] ?? [];

  // 무한 스크롤 — mock 단계에서는 풀을 순환시켜 "끝없이 흐르는" 형태를 만든다.
  const visible = useMemo(() => {
    const out: { key: string; card: EmotionCard }[] = [];
    for (let i = 0; i < Math.min(count, pool.length * 8) && pool.length > 0; i++) {
      const card = pool[i % pool.length]!;
      out.push({ key: `${card.id}-${Math.floor(i / pool.length)}`, card });
    }
    return out;
  }, [pool, count]);

  // 탭 전환 = 감정 선택. 카운트와 스크롤을 처음으로.
  const switchEmotion = (e: FeedEmotion) => {
    setEmotion(e);
    setCount(PAGE_SIZE);
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          setCount((c) => c + PAGE_SIZE);
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [emotion]);

  return (
    <div className="w-full">
      {/* 상단 감정 탭 — 가로 스크롤 세그먼트. 각 탭 색 = 감정 색. */}
      <div
        className="scrollbar-none sticky top-0 z-40 -mx-6 flex gap-2 overflow-x-auto bg-black px-6 py-2"
        role="tablist"
        aria-label="감정 카테고리"
      >
        {FEED_EMOTIONS.map((e) => {
          const active = e === emotion;
          const color = FEED_EMOTION_COLORS[e];
          return (
            <button
              key={e}
              role="tab"
              aria-selected={active}
              onClick={() => switchEmotion(e)}
              className="shrink-0 rounded-full border px-3.5 py-1.5 font-pixel text-xs transition-colors"
              style={
                active
                  ? { borderColor: color, color, backgroundColor: `${color}1A` }
                  : { borderColor: "#1E1E1E", color: "#555" }
              }
            >
              {FEED_EMOTION_LABELS[e]}
            </button>
          );
        })}
      </div>

      {/* 카드 피드 — 감정 치환 한 줄(메인) + 근거(작게) + 감정 색 포인트 */}
      <div className="mt-3 flex flex-col gap-2.5">
        {visible.map(({ key, card }) => (
          <FeedCard key={key} card={card} />
        ))}
        {pool.length === 0 && (
          <p className="mt-10 text-center text-sm text-muted">
            오늘은 이 감정의 신호가 조용해. 내일 다시 들러도 돼.
          </p>
        )}
      </div>

      {/* 무한 스크롤 센티널 */}
      <div ref={sentinelRef} aria-hidden className="h-8" />
    </div>
  );
}

function FeedCard({ card }: { card: EmotionCard }) {
  const color = FEED_EMOTION_COLORS[card.emotion];
  return (
    <article
      className="rounded-xl border border-hairline bg-surface px-4 py-3.5"
      style={{ borderLeft: `2px solid ${color}` }}
    >
      <p className="text-sm leading-6 text-whiteout">{card.headline}</p>
      {card.evidence && (
        <p className="mt-1.5 text-[11px] leading-4 text-muted">
          {card.evidence.label}
          {card.evidence.value ? ` · ${card.evidence.value}` : ""}
        </p>
      )}
    </article>
  );
}
