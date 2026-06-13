"use client";

import { scoreToColor, type EmotionType } from "@fomo/core";
import { KeywordCardFeed } from "@/components/KeywordCardFeed";
import type {
  FomoIndexResponse,
  TallyResponse,
  CalendarResponse,
  BannerItem,
  MarketScore,
  FeedResponse,
  NewsResponse,
  VoiceItem,
} from "@/lib/fomoApi";

/**
 * 메인 = 틴더형 키워드 카드 피드 그 자체. KEYWORD_CARD_FEED_DEV_SPEC v3.
 * 탭 분리 폐기 — 열면 바로 카드. 큰 마스코트 제거, 지수는 상단 얇은 띠로.
 * (감정 게이트/캘린더/한마디 등 props는 보존 차원에서 시그니처에 남겨두되 미사용 — flag로 숨김 유지.)
 */
export function HomeView({
  index,
}: {
  index: FomoIndexResponse | null;
  tally: TallyResponse | null;
  banner: BannerItem[];
  markets: MarketScore[];
  feed: FeedResponse | null;
  news: NewsResponse | null;
  calendar: CalendarResponse | null;
  voices: VoiceItem[] | null;
  mine: EmotionType | null;
  onReopenGate: () => void;
  loggedIn: boolean;
  onLoggedIn: () => void;
}) {
  const color = index ? scoreToColor(index.score) : undefined;

  return (
    <main className="fomo-phase-in mx-auto flex min-h-screen max-w-md flex-col px-6 pt-4">
      {/* 상단 얇은 띠: 로고 + 가입 없이 둘러보기 */}
      <div className="flex items-center justify-between">
        <span className="font-pixel text-base text-whiteout">FOMO CLUB</span>
        <span className="text-xs text-muted">가입 없이 둘러보기</span>
      </div>

      {/* 시장 온도(FOMO Index) + 어제 대비 변화 — 큰 마스코트 자리 대신 얇은 띠 */}
      {index && (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-hairline bg-surface px-4 py-2.5">
          <span className="text-xs text-muted">오늘의 시장 온도</span>
          <div className="flex items-baseline gap-2">
            <span className="font-pixel text-xl leading-none" style={{ color }}>
              {index.score}
            </span>
            <span className="font-pixel text-[11px] text-muted">{index.state}</span>
            {index.prevDayDelta !== 0 && (
              <span className="font-pixel text-[11px]" style={{ color }}>
                {index.prevDayDelta > 0
                  ? `· 어제보다 ▲+${index.prevDayDelta}`
                  : `· 어제보다 ▼${index.prevDayDelta}`}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 메인 = 키워드 카드 피드 (틴더형) */}
      <div className="mt-3">
        <KeywordCardFeed />
      </div>
    </main>
  );
}
