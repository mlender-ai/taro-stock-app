// SWR 캐싱 TTL 중앙 설정 — 종목 데이터 업데이트 주기 기반으로 조정.
// 동일 종목 중복 요청 최소화를 위해 fresh 구간을 2분, stale 구간을 10분으로 설정.
// 키 네이밍: `symbol:time_interval` 형태를 사용해 캐시 충돌 방지.

export const SWR_QUOTE_FRESH_TTL_MS  = 2 * 60 * 1000;   // 2분 — 중복 요청 차단
export const SWR_QUOTE_STALE_TTL_MS  = 10 * 60 * 1000;  // 10분 — stale-while-revalidate 창

export const SWR_CHART_FRESH_TTL_MS  = 2 * 60 * 1000;
export const SWR_CHART_STALE_TTL_MS  = 10 * 60 * 1000;

export const SWR_FINANCIALS_FRESH_TTL_MS = 5 * 60 * 1000;  // 재무 데이터는 자주 안 바뀜
export const SWR_FINANCIALS_STALE_TTL_MS = 30 * 60 * 1000;

// useCachedFetch 기본값 — 뉴스/인사이트 등 단순 endpoint에 적용
export const SWR_DEFAULT_FRESH_TTL_MS = 5 * 60 * 1000;
export const SWR_DEFAULT_STALE_TTL_MS = 15 * 60 * 1000;
