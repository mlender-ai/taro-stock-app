"use client";

import { useEffect, useState } from "react";
import {
  EMOTION_TYPES,
  EMOTION_LABELS,
  EMOTION_COLORS,
  scoreToFace,
  type EmotionType,
} from "@fomo/core";
import { FomoFace } from "@/components/FomoFace";
import { getSessionId } from "@/lib/session";

// Phase 1 셸: 백엔드 미연동. FOMO Index 실제값은 Phase 3에서 /api/fomo/index 연동.
// 정직한 숫자 원칙 — 가짜 수치를 진짜처럼 보이지 않게 "준비 중"으로 표기.
const MARKET_SCORE_PLACEHOLDER: number | null = null;

export default function Home() {
  const [mine, setMine] = useState<EmotionType | null>(null);

  // 무가입 익명 세션 발급 (첫 방문 시 localStorage)
  useEffect(() => {
    getSessionId();
  }, []);

  const stage: "market" | "mine" = mine ? "mine" : "market";
  const marketFace =
    MARKET_SCORE_PLACEHOLDER == null ? "curious" : scoreToFace(MARKET_SCORE_PLACEHOLDER);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center px-6 pb-16 pt-6">
      <div className="mb-8 flex w-full items-center justify-between">
        <span className="text-lg font-semibold text-whiteout">FOMO Club</span>
        <span className="text-sm text-muted">가입 없이 둘러보기</span>
      </div>

      {/* 주인공: 포모 마스코트 (숫자는 보조) */}
      <p className="mb-3 text-xs text-muted">
        {stage === "market" ? "오늘의 포모 — 시장의 분위기" : "나의 포모"}
      </p>
      <FomoFace
        face={stage === "market" ? marketFace : "calm"}
        glow={stage === "mine" && mine ? EMOTION_COLORS[mine] : undefined}
      />

      {/* 보조: FOMO Index (미연동 시 정직하게 "준비 중") */}
      <p className="mt-5 text-sm text-muted">FOMO INDEX · 집계 준비 중</p>

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
                onClick={() => setMine(e)}
                className="rounded-xl border px-4 py-3 text-sm"
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

        {mine && (
          <p className="mt-4 text-xs text-muted">같은 감정을 선택한 사람: 집계 준비 중</p>
        )}
      </section>
    </main>
  );
}
