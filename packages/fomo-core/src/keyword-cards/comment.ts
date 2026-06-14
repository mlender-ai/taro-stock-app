import type { KeywordCard } from "./types";
import type { ScoredKeyword, KeywordConfidence } from "./score";
import { josa } from "./josa";

/**
 * 코멘트 생성 — 룰 폴백 템플릿. KEYWORD_ENGINE_SPEC §4.4.
 *
 * 순수 함수. Phase 2 는 LLM 없이 점수 구간별 템플릿만 쓴다(LLM 은 Phase 3).
 * mock.ts 의 톤을 폴백 기준으로 삼는다: 친구 반말 + 담담함 + 반드시 균형추(진정)로 닫기.
 *
 * 변주: 같은 밴드라도 똑같은 문장이 반복되지 않게 밴드별 템플릿 2~3개 풀 + 키워드 해시로
 *   **결정적** 선택(랜덤 X → 새로고침/캐시에도 안 바뀜) + 코멘트에 mention 수 반영.
 * 조사: josa() 로 받침 처리("코인는"→"코인은").
 *
 * 절대 규칙(§2): 예측·투자조언·전문용어·거래부추김 0, 모든 변주에 균형추 필수.
 * 가드 테스트(keyword-comment.test.ts)가 금칙어/균형추를 전 변주에서 검증한다.
 */

/** 진정(균형추) 마커 — 모든 코멘트·remember 에 최소 1개 포함되어야 한다(가드 테스트). */
export const CALM_MARKERS: readonly string[] = [
  "기회는 또 와",
  "안 급해도 돼",
  "급할 거 없어",
  "급할 것도 없어",
  "천천히",
  "조심",
  "아쉬워할 필요 없어",
  "아쉬워하지 않아도",
  "무서워할 것",
  "나쁜 게 아니야",
  "쉬어가는",
];

/** 키워드로 결정적 인덱스(랜덤 아님 — 캐시·새로고침에도 동일). */
function pick<T>(arr: readonly T[], key: string): T {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return arr[h % arr.length]!;
}

type CommentFn = (kw: string, mention: number) => string;

interface BandTemplate {
  /** 구간 하한(이상). state.ts BANDS 와 동일 경계. */
  min: number;
  /** 앞면 코멘트 변주 풀(2~3개). 각 변주에 균형추 필수. */
  comments: readonly CommentFn[];
  whyTitle: string;
  rememberTitle: string;
  /** 균형추 한마디 변주 풀. */
  remembers: readonly CommentFn[];
}

const eun = (k: string) => `${k}${josa(k, "은는")}`;

// 점수 구간별 템플릿(state.ts 5구간 정합). 높을수록 진정 톤을 강하게(§4.4 규칙5).
const BANDS: readonly BandTemplate[] = [
  {
    min: 81,
    comments: [
      (k, m) =>
        `오늘 ${k} 얘기가 ${m}번이나 돌았어. 너만 못 탄 것 같지? 그 마음 알아. ` +
        `근데 이미 한참 달아오른 거 따라 들어가는 건 늘 조심하는 게 좋아.`,
      (k, m) =>
        `${eun(k)} 오늘 제일 시끄러운 키워드야 — ${m}번 넘게 얘기됐어. ` +
        `다 놓친 기분 들지? 그래도 따라가는 건 천천히, 늦었다고 조급해 말고.`,
    ],
    whyTitle: "오늘 왜 여기에 다들 쏠렸어?",
    rememberTitle: "근데 이건 기억해",
    remembers: [
      () => "다들 좋다고 몰릴 때가 보통 제일 비쌀 때야. 오늘 못 탔다고 아쉬워할 필요 없어. 기회는 또 와.",
      () => "제일 뜨거울 때 들어가면 늦는 경우가 많아. 오늘 놓쳤어도 괜찮아 — 기회는 또 와.",
    ],
  },
  {
    min: 61,
    comments: [
      (k, m) =>
        `${k} 얘기가 다시 뜨거워졌어. 오늘만 ${m}번쯤 돌았더라. ` +
        `휩쓸리기 쉬운 주제니까 한 박자 천천히 봐도 돼.`,
      (k, m) =>
        `오늘 ${k} 쪽으로 시선이 꽤 쏠렸어(${m}번). 다들 보니까 나도 봐야 하나 싶지? ` +
        `그 마음일수록 조심해서 천천히.`,
    ],
    whyTitle: "오늘 왜 여기에 다들 쏠렸어?",
    rememberTitle: "근데 이건 기억해",
    remembers: [
      () => "분위기로 달아오른 건 분위기로 식기도 해. '나만 놓쳤다'는 마음이 들 때일수록 천천히.",
      () => "다들 몰릴 때가 제일 휩쓸리기 쉬워. 안 급해도 돼.",
    ],
  },
  {
    min: 41,
    comments: [
      (k, m) =>
        `오늘은 ${k} 쪽으로 시선이 조금씩 모이는 날이야(${m}번). ` +
        `크게 들뜨진 않았어. 급할 거 없어.`,
      (k, m) =>
        `${k} 얘기가 ${m}번 정도 보이네. 후끈하진 않고 슬슬 관심 붙는 정도야. ` +
        `천천히 봐도 돼.`,
    ],
    whyTitle: "오늘 왜 여기에 시선이 모였어?",
    rememberTitle: "근데 이건 기억해",
    remembers: [
      () => "이런 날은 섣불리 움직이기보다 지켜보는 사람이 많아. 안 급해도 돼.",
      () => "조용히 붙는 관심은 천천히 봐도 늦지 않아. 급할 거 없어.",
    ],
  },
  {
    min: 21,
    comments: [
      (k, m) =>
        `${eun(k)} 오늘 좀 잠잠했어. ${m}번 정도 언급됐는데 크게 들썩이진 않았어. ` +
        `무서워할 것도, 급할 것도 없어.`,
      (k, m) =>
        `오늘 ${k} 얘기는 ${m}번쯤, 조용한 편이야. 한 박자 쉬어가는 날이지. ` +
        `안 급해도 돼.`,
    ],
    whyTitle: "오늘은 왜 잠잠했어?",
    rememberTitle: "근데 이건 기억해",
    remembers: [
      () => "크게 올랐던 자리는 식을 때도 크게 식어. 오를 때 못 탔다고 아쉬워하지 않아도 되는 이유야.",
      () => "잠잠한 날은 잠잠한 대로 괜찮아. 무서워할 것 없어.",
    ],
  },
  {
    min: 0,
    comments: [
      (k, m) =>
        `${eun(k)} 오늘 거의 조용했어(${m}번). 다들 관심이 다른 데 가 있어. ` +
        `조용한 건 나쁜 게 아니야.`,
      (k, m) =>
        `오늘 ${k} 얘기는 ${m}번뿐, 거의 안 보였어. 이런 날도 있는 거야. ` +
        `너도 안 급해도 돼.`,
    ],
    whyTitle: "오늘은 왜 잠잠했어?",
    rememberTitle: "근데 이건 기억해",
    remembers: [
      () => "관심이 없다고 뭔가 잘못된 건 아니야. 시선은 매일 다른 곳으로 옮겨다니거든.",
      () => "조용한 건 나쁜 게 아니야. 너도 안 급해도 돼.",
    ],
  },
];

function bandFor(score: number): BandTemplate {
  for (const b of BANDS) if (score >= b.min) return b;
  return BANDS[BANDS.length - 1]!;
}

/** 관련 종목 자연어 나열(시세 아님). "삼성전자·SK하이닉스 같은" 식. */
function relatedPhrase(related: readonly string[]): string {
  if (related.length === 0) return "관련 종목들";
  if (related.length === 1) return `${related[0]} 같은 곳`;
  return `${related.slice(0, 2).join("·")} 같은 곳`;
}

/**
 * depth.why — 오늘 데이터를 담담히. 예측 없이 "무슨 일이 있었나"만.
 * 실제 mention 수를 정직하게 노출(가짜 단정 금지).
 */
function buildWhy(kw: ScoredKeyword): string {
  const phrase = relatedPhrase(kw.related);
  if (kw.mentions === 0) {
    return `오늘은 ${kw.keyword} 쪽에 새 소식이 거의 없어서 사람들 시선이 머물지 않았어. 새 소식이 없으면 이렇게 잠잠하기도 해.`;
  }
  return (
    `오늘 ${kw.keyword} 관련 얘기가 여기저기서 ${kw.mentions}건쯤 돌았어. ` +
    `${phrase}이 같이 묶여 오르내리니까 '나도 봐야 하나' 하는 사람이 늘어난 거야.`
  );
}

/** ScoredKeyword → KeywordCard(룰 폴백 코멘트 포함, 키워드 해시로 변주 결정). */
export function buildKeywordCard(kw: ScoredKeyword): KeywordCard {
  const band = bandFor(kw.fomoScore);
  const comment = pick(band.comments, kw.keyword)(kw.keyword, kw.mentions);
  const remember = pick(band.remembers, kw.keyword)(kw.keyword, kw.mentions);
  return {
    id: kw.keyword,
    keyword: kw.keyword,
    emoji: kw.emoji,
    fomoScore: kw.fomoScore,
    comment,
    related: kw.related,
    depth: {
      whyTitle: band.whyTitle,
      why: buildWhy(kw),
      rememberTitle: band.rememberTitle,
      remember,
    },
  };
}

export function buildKeywordCards(scored: readonly ScoredKeyword[]): KeywordCard[] {
  return scored.map(buildKeywordCard);
}

/**
 * 전체 산출 신뢰도(응답 confidence, §4.6·§5). 정직성 노출.
 * - 키워드 0건 → "fallback"(보여줄 게 없음 → 라우트가 mock 으로 대체).
 * - 키워드 있음 → Phase 2 는 30일 절대 기준선이 없어 'high' 도달 불가. 카드별 confidence 중 최선.
 *   (Phase 2 는 전부 'low' — (a)volume 은 당일 상대값, 절대 기준선은 Phase 4.)
 */
export function overallConfidence(scored: readonly ScoredKeyword[]): KeywordConfidence {
  if (scored.length === 0) return "fallback";
  const order: KeywordConfidence[] = ["high", "medium", "low", "fallback"];
  let best: KeywordConfidence = "fallback";
  for (const k of scored) {
    if (order.indexOf(k.confidence) < order.indexOf(best)) best = k.confidence;
  }
  return best;
}
