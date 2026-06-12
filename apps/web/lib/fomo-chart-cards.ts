import { assetHeatScore, fomoCommentFallback, type ChartCard } from "@fomo/core";
import { fetchIndexCloses, fetchNaverIndex } from "./fomo-market-sources";

/**
 * 차트 카드 데이터 수집 — VIX/코스피/나스닥/엔비디아. docs/PIVOT_FEED_FIRST.md.
 *
 * 현재가·등락률: 지수는 네이버(안정), NVDA는 Yahoo(개별종목 네이버 경로 불안정).
 * 추이(series): Yahoo 1mo 일봉 best-effort — 실패 시 series 생략(숫자 카드).
 * 정직한 숫자 원칙: 현재가를 못 구하면 그 카드는 만들지 않는다.
 */

interface ChartSpec {
  key: ChartCard["key"];
  label: string;
  /** 네이버 지수 심볼(있으면 현재가 소스). NVDA는 없음(Yahoo). */
  naver?: { sym: string; scope: "domestic" | "world" };
  /** Yahoo 심볼(시계열 + NVDA 현재가). */
  yahoo: string;
}

const SPECS: ChartSpec[] = [
  { key: "vix", label: "공포지수 VIX", naver: { sym: ".VIX", scope: "world" }, yahoo: "^VIX" },
  { key: "kospi", label: "코스피", naver: { sym: "KOSPI", scope: "domestic" }, yahoo: "^KS11" },
  { key: "ndq", label: "나스닥", naver: { sym: ".IXIC", scope: "world" }, yahoo: "^IXIC" },
  { key: "nvda", label: "엔비디아", yahoo: "NVDA" },
];

/** Yahoo 종가 배열에서 마지막 유효값 + 전일대비 변화율. */
function lastAndChange(closes: (number | null)[]): { value: number; change: number } | null {
  const v = closes.filter((c): c is number => typeof c === "number" && Number.isFinite(c));
  if (v.length === 0) return null;
  const value = v[v.length - 1]!;
  const prev = v.length >= 2 ? v[v.length - 2]! : value;
  const change = prev ? ((value - prev) / prev) * 100 : 0;
  return { value, change };
}

async function buildOne(spec: ChartSpec): Promise<ChartCard | null> {
  // 시계열(best-effort) — VIX/지수/NVDA 모두 Yahoo 1mo.
  const closes = await fetchIndexCloses(spec.yahoo, "1mo");
  const series = closes
    ? closes.filter((c): c is number => typeof c === "number" && Number.isFinite(c))
    : [];

  // 현재가/등락률: 네이버 우선(안정), 없으면 Yahoo 시계열에서 산출.
  let value: number | null = null;
  let change = 0;
  if (spec.naver) {
    const n = await fetchNaverIndex(spec.naver.sym, spec.naver.scope);
    if (n) {
      value = n.close;
      change = n.change;
    }
  }
  if (value === null) {
    const yc = lastAndChange(closes ?? []);
    if (yc) {
      value = yc.value;
      change = Math.round(yc.change * 100) / 100;
    }
  }
  if (value === null) return null; // 현재가조차 없으면 카드 생략

  const score = assetHeatScore(change);
  const comment = fomoCommentFallback({ title: spec.label, fomoScore: score });

  return {
    key: spec.key,
    label: spec.label,
    value,
    changePct: Math.round(change * 100) / 100,
    ...(series.length >= 2 ? { series } : {}),
    comment,
  };
}

/** 차트 카드 4종 수집(병렬). 현재가 못 구한 카드는 제외. */
export async function fetchChartCards(): Promise<ChartCard[]> {
  const settled = await Promise.allSettled(SPECS.map(buildOne));
  const out: ChartCard[] = [];
  for (const r of settled) if (r.status === "fulfilled" && r.value) out.push(r.value);
  return out;
}
