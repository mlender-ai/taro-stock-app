/**
 * 키워드 카드 — "오늘 사람들 시선이 가장 쏠린 키워드/테마" + 포모 점수. KEYWORD_CARD_FEED_DEV_SPEC v3.
 *
 * 종목 시세(토스 영역)가 아니라 "군중의 시선 = 포모의 정체". §0 절대 규칙:
 * 전문용어 금지, 거래 부추김 금지, 예측·단정 금지(과거/현재 설명만), 포모 균형추 필수.
 * 지금은 손으로 쓴 mock — 실제 키워드 추출 엔진은 다음 단계(§5).
 */

export interface KeywordDepth {
  /** "오늘 왜 여기에 다들 쏠렸어?" 류 제목. */
  whyTitle: string;
  /** 뉴스 종합을 친구 말투로(어떤 일+어떤 종목 묶였나, 용어 없이). */
  why: string;
  /** "근데 이건 기억해" 류 제목(균형추). */
  rememberTitle: string;
  /** 포모 완화 — "따라가는 건 조심" 결. */
  remember: string;
}

export interface KeywordCard {
  id: string;
  /** 오늘의 키워드/테마(예: "반도체"). */
  keyword: string;
  /** 키워드 옆 이모지(분위기). */
  emoji: string;
  /** 포모 점수 0~100 — 쏠림 정도. 높을수록 뜨겁다. */
  fomoScore: number;
  /** 포모 한마디(2~3줄, §0 톤 + 균형추). 카드 앞면의 전부. */
  comment: string;
  /** 관련 종목/테마 미니 리스트(시세 아님, "다들 이런 것들 봤어"). */
  related: readonly string[];
  depth: KeywordDepth;
}
