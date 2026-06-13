"use client";

import { useRef, useState } from "react";
import { MOCK_KEYWORD_CARDS, scoreToColor, scoreToEmoji, type KeywordCard } from "@fomo/core";
import { recordInterest } from "@/lib/keywordInterest";

/**
 * 키워드 카드 피드 — 메인 그 자체(틴더형). KEYWORD_CARD_FEED_DEV_SPEC v3.
 * 위/아래 스와이프(네이티브 스크롤 스냅)로 다음 카드, 탭하면 뎁스. 거래 버튼 없음.
 * 좌우 스와이프 = (향후) 관심/덜관심 — 지금은 UI만(seam에 기록, 로직 없음).
 * 정렬: 포모 점수 높은 순. 데이터는 mock.
 */
const SWIPE_THRESHOLD = 80;

export function KeywordCardFeed({
  cards = MOCK_KEYWORD_CARDS,
}: {
  cards?: readonly KeywordCard[];
}) {
  const [selected, setSelected] = useState<KeywordCard | null>(null);

  return (
    <div className="w-full">
      <div className="scrollbar-none h-[calc(100vh-132px)] snap-y snap-mandatory overflow-y-auto">
        {cards.map((card, i) => (
          <KeywordSlide
            key={card.id}
            card={card}
            index={i}
            total={cards.length}
            onOpen={() => setSelected(card)}
          />
        ))}
        {/* 끝 카드 — 부담 없는 데일리 + 면책 */}
        <div className="flex h-[calc(100vh-132px)] snap-center flex-col items-center justify-center gap-3 px-8 text-center">
          <p className="text-sm leading-6 text-whiteout">
            오늘 사람들 시선은 여기까지였어.
            <br />
            내일은 또 어디로 쏠릴지 같이 보자.
          </p>
          <p className="text-[11px] leading-5 text-muted">
            FOMO Index는 감정 체감 지표예요. 투자 조언이 아니에요.
            <br />
            도박문제로 힘들 땐 <span className="text-whiteout">1336</span>(한국도박문제예방치유원)에서 무료 상담.
          </p>
        </div>
      </div>

      {selected && <DepthPage card={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function KeywordSlide({
  card,
  index,
  total,
  onOpen,
}: {
  card: KeywordCard;
  index: number;
  total: number;
  onOpen: () => void;
}) {
  const color = scoreToColor(card.fomoScore);
  const [dx, setDx] = useState(0);
  const dragging = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const horizontal = useRef(false);
  const moved = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    horizontal.current = false;
    moved.current = false;
    start.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const ddx = e.clientX - start.current.x;
    const ddy = e.clientY - start.current.y;
    // 가로 우세 제스처만 가로채고, 세로는 네이티브 스크롤(touch-action: pan-y)에 맡긴다.
    if (!horizontal.current && Math.abs(ddx) > Math.abs(ddy) && Math.abs(ddx) > 8) {
      horizontal.current = true;
      (e.target as Element).setPointerCapture?.(e.pointerId);
    }
    if (horizontal.current) {
      moved.current = true;
      setDx(ddx);
    }
  };
  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (horizontal.current && Math.abs(dx) > SWIPE_THRESHOLD) {
      recordInterest(card.id, dx > 0 ? "more" : "less", Date.now());
    }
    setDx(0);
  };

  return (
    <div className="flex h-[calc(100vh-132px)] snap-center flex-col justify-center">
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={() => {
          if (!moved.current) onOpen();
        }}
        className="relative flex min-h-[62vh] w-full flex-col cursor-pointer touch-pan-y overflow-hidden rounded-2xl border border-hairline bg-surface px-6 py-8"
        style={{
          borderLeft: `2px solid ${color}`,
          transform: `translateX(${dx}px) rotate(${dx * 0.03}deg)`,
          transition: dragging.current ? "none" : "transform 280ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* 좌우 관심 오버레이 (향후 개인화 — 지금은 표시만) */}
        <span
          className="pointer-events-none absolute right-4 top-4 rounded-lg border-2 px-2 py-0.5 font-pixel text-xs"
          style={{ color, borderColor: color, opacity: Math.max(0, Math.min(1, dx / SWIPE_THRESHOLD)) }}
        >
          관심 →
        </span>
        <span
          className="pointer-events-none absolute left-4 top-4 rounded-lg border-2 px-2 py-0.5 font-pixel text-xs"
          style={{ color: "#64748B", borderColor: "#64748B", opacity: Math.max(0, Math.min(1, -dx / SWIPE_THRESHOLD)) }}
        >
          ← 덜 관심
        </span>

        {/* 키워드 + 이모지 */}
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-whiteout">{card.keyword}</span>
          <span className="text-xl" aria-hidden>{card.emoji}</span>
        </div>

        {/* 포모 점수 */}
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-pixel text-5xl leading-none" style={{ color }}>
            {card.fomoScore}
          </span>
          <span className="font-pixel text-sm text-muted">
            {scoreToEmoji(card.fomoScore)} 포모 점수
          </span>
        </div>

        {/* 포모 한마디 (전부) */}
        <p className="mt-7 text-lg leading-8 text-whiteout">{card.comment}</p>

        {/* 더보기 + 진행 (거래 버튼 없음) — 하단 고정 */}
        <div className="mt-auto flex items-center justify-between pt-8">
          <span className="font-pixel text-[11px] text-muted">더보기 →</span>
          <span className="font-pixel text-[11px] text-muted">{index + 1} / {total}</span>
        </div>
      </div>
      <p className="mt-3 text-center font-pixel text-[10px] text-hairline">↓ 밀어서 다음 키워드</p>
    </div>
  );
}

function DepthPage({ card, onClose }: { card: KeywordCard; onClose: () => void }) {
  const color = scoreToColor(card.fomoScore);
  return (
    <div className="fixed inset-0 z-[60] bg-black">
      <div className="mx-auto flex h-full max-w-md flex-col">
        <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-lg font-bold text-whiteout">{card.keyword}</span>
            <span aria-hidden>{card.emoji}</span>
            <span className="font-pixel text-sm" style={{ color }}>
              포모 {card.fomoScore}
            </span>
          </div>
          <button onClick={onClose} className="font-pixel text-sm text-muted hover:text-whiteout">
            닫기
          </button>
        </div>

        <div className="scrollbar-none flex-1 overflow-y-auto px-6 py-6">
          <p className="text-sm leading-6 text-whiteout">{card.comment}</p>

          <section className="mt-7">
            <p className="font-pixel text-sm text-whiteout">{card.depth.whyTitle}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{card.depth.why}</p>
          </section>

          <section className="mt-6">
            <p className="font-pixel text-sm text-whiteout">{card.depth.rememberTitle}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{card.depth.remember}</p>
          </section>

          {/* 관련 종목/테마 미니 — 시세 나열 아님 */}
          <section className="mt-6">
            <p className="text-xs text-muted">다들 이런 것들 봤어</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {card.related.map((r) => (
                <span
                  key={r}
                  className="rounded-full border border-hairline bg-surface px-3 py-1 text-xs text-whiteout"
                >
                  {r}
                </span>
              ))}
            </div>
          </section>

          {/* 향후 유료 자리 — 표시만 */}
          <div className="mt-8 rounded-xl border border-dashed border-hairline px-4 py-4">
            <p className="font-pixel text-[11px] text-muted">곧 추가될 거야</p>
            <p className="mt-1.5 text-sm leading-6 text-muted">
              이 테마 더 깊이 보기 · 관심 종목 모아보기
            </p>
          </div>

          <p className="mt-8 text-center text-[11px] leading-5 text-muted">
            지난 흐름을 친구처럼 풀어준 거예요. 투자 조언이 아니에요.
          </p>
        </div>
      </div>
    </div>
  );
}
