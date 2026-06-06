"use client";

import { useEffect, useState, useCallback } from "react";
import {
  EMOTION_TYPES,
  EMOTION_LABELS,
  EMOTION_COLORS,
  scoreToFace,
  type EmotionType,
  type FomoFace as FomoFaceType,
} from "@fomo/core";
import { FomoFace } from "@/components/FomoFace";
import { getSessionId } from "@/lib/session";
import {
  fetchIndex,
  fetchToday,
  fetchPulse,
  postVote,
  type FomoIndexResponse,
  type TallyResponse,
} from "@/lib/fomoApi";

export default function Home() {
  const [index, setIndex] = useState<FomoIndexResponse | null>(null);
  const [tally, setTally] = useState<TallyResponse | null>(null);
  const [pulse, setPulse] = useState<string[]>([]);
  const [mine, setMine] = useState<EmotionType | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    getSessionId();
    Promise.allSettled([fetchIndex(), fetchToday(), fetchPulse()]).then(([i, t, p]) => {
      if (i.status === "fulfilled") setIndex(i.value);
      if (t.status === "fulfilled") setTally(t.value);
      if (p.status === "fulfilled") setPulse(p.value.items);
      setLoading(false);
    });
  }, []);

  const vote = useCallback(async (e: EmotionType) => {
    setVoting(true);
    setMine(e); // 2단계 전환 즉시
    try {
      const res = await postVote(getSessionId(), e);
      setTally(res);
    } catch {
      // 실패해도 선택 상태는 유지(낙관적). 집계는 다음 로드에 반영.
    } finally {
      setVoting(false);
    }
  }, []);

  const stage: "market" | "mine" = mine ? "mine" : "market";
  const marketFace: FomoFaceType = index ? scoreToFace(index.score) : "curious";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center px-6 pb-16 pt-6">
      <div className="mb-6 flex w-full items-center justify-between">
        <span className="text-lg font-semibold text-whiteout">FOMO Club</span>
        <span className="text-sm text-muted">가입 없이 둘러보기</span>
      </div>

      {/* Market Pulse 롤링 배너 */}
      {pulse.length > 0 && (
        <div className="mb-6 w-full overflow-hidden rounded-lg border border-hairline bg-surface px-4 py-2">
          <p className="truncate text-xs text-muted">{pulse[0]}</p>
        </div>
      )}

      {/* 주인공: 포모 마스코트 */}
      <p className="mb-3 text-xs text-muted">
        {stage === "market" ? "오늘의 포모 — 시장의 분위기" : "나의 포모"}
      </p>
      <FomoFace
        face={stage === "market" ? marketFace : "calm"}
        glow={stage === "mine" && mine ? EMOTION_COLORS[mine] : undefined}
      />

      {/* 보조: FOMO Index 숫자 */}
      <div className="mt-5 flex flex-col items-center">
        {loading ? (
          <p className="text-sm text-muted">불러오는 중…</p>
        ) : index ? (
          <>
            <p className="text-2xl font-semibold text-whiteout">
              {index.score} · {index.state}
            </p>
            <p className="mt-1 text-xs text-muted">
              FOMO INDEX{index.prevDayDelta ? ` · 전일 ${index.prevDayDelta > 0 ? "+" : ""}${index.prevDayDelta}` : ""}
              {index.live ? " · 실시간 집계" : ""}
            </p>
            {index.aiSummary && (
              <p className="mt-2 max-w-xs text-center text-sm text-whiteout">{index.aiSummary}</p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted">FOMO INDEX · 집계 준비 중</p>
        )}
      </div>

      {stage === "mine" && mine && (
        <p className="mt-4 text-center text-sm leading-5 text-whiteout">
          다들 어떻든, 너의 「{EMOTION_LABELS[mine]}」도 괜찮아.
        </p>
      )}

      {/* 오늘의 감정 투표 */}
      <section className="mt-10 w-full">
        <h2 className="text-base font-semibold text-whiteout">오늘 당신의 감정은?</h2>
        <p className="mb-4 text-xs text-muted">하루 한 번 선택할 수 있어요</p>

        <div className="flex flex-wrap gap-2">
          {EMOTION_TYPES.map((e) => {
            const selected = mine === e;
            return (
              <button
                key={e}
                disabled={voting}
                onClick={() => vote(e)}
                className="rounded-xl border px-4 py-3 text-sm transition-opacity disabled:opacity-60"
                style={{
                  borderColor: selected ? EMOTION_COLORS[e] : "#2e2e2e",
                  backgroundColor: selected ? EMOTION_COLORS[e] + "22" : "#121212",
                  color: selected ? EMOTION_COLORS[e] : "#fafafa",
                }}
              >
                {EMOTION_LABELS[e]}
              </button>
            );
          })}
        </div>

        {/* 집계 결과 — 정직한 숫자 */}
        {tally && (
          <div className="mt-5">
            <p className="text-xs text-muted">
              {mine ? "같은 감정을 선택한 사람 포함, " : ""}오늘 {tally.total}명이 감정을 선택했어요
            </p>
            <div className="mt-3 flex flex-col gap-1.5">
              {EMOTION_TYPES.map((e) => (
                <div key={e} className="flex items-center gap-2">
                  <span className="w-10 text-xs" style={{ color: EMOTION_COLORS[e] }}>
                    {EMOTION_LABELS[e]}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-elevated">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${tally.ratios[e] ?? 0}%`, backgroundColor: EMOTION_COLORS[e] }}
                    />
                  </div>
                  <span className="w-9 text-right text-xs text-muted">{tally.ratios[e] ?? 0}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
