const DISCOVERY_REASON_JOINER = " — ";

export interface DiscoveryHeadlineInput {
  reason?: string | undefined;
  sector?: string | undefined;
  marketCapRank?: number | undefined;
}

interface ReasonParts {
  state?: string;
  detail?: string;
}

function cleanInline(text: string | undefined): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

export function splitDiscoveryReason(text: string | undefined): ReasonParts {
  const clean = cleanInline(text);
  if (!clean || !clean.includes(DISCOVERY_REASON_JOINER)) return {};
  const [rawState, ...rest] = clean.split(DISCOVERY_REASON_JOINER);
  const state = rawState?.trim();
  const detail = rest.join(DISCOVERY_REASON_JOINER).trim();
  if (!state || state.length > 16) return {};
  return {
    state,
    ...(detail ? { detail } : {}),
  };
}

function stripSourceAndTime(text: string): string {
  return text
    .replace(/^(?:오늘|최근)\s+/, "")
    .replace(/\s*·\s*[^.。]+[.。]?$/g, "")
    .replace(/[.。]+$/g, "")
    .trim();
}

function topicFromMaterial(detail: string): string {
  const title = stripSourceAndTime(detail);
  const lower = title.toLowerCase();
  if (/해외\s*수주/.test(title)) return "해외 수주";
  if (/공급계약|계약|contract|deal|order/.test(lower)) return "계약";
  if (/수주/.test(title)) return "수주";
  if (/실적|가이던스|매출|earnings|revenue|guidance|results/.test(lower)) return "실적";
  if (/sec|공시|filing|8-k|10-q/.test(lower)) return "공시";
  if (/파트너십|제휴|partnership|customer/.test(lower)) return "파트너십";
  if (/제품|출시|인프라|launch|product|infrastructure/.test(lower)) return "제품";
  const compact = title
    .replace(/['"“”‘’]/g, "")
    .split(/[,，:：\-–—]/)[0]
    ?.trim();
  return compact && compact.length <= 10 ? compact : "뉴스";
}

function supportFromDetail(detail: string): string {
  if (/수급|외국인|기관|순매수|사는 중/.test(detail)) return "수급도 붙었어요";
  if (/거래량|거래가|거래도/.test(detail)) return "거래도 붙었어요";
  if (/동종|섹터|흐름|종목들 중/.test(detail)) return "동종 흐름도 붙었어요";
  return "직접 재료가 붙었어요";
}

function sectorFromDetail(detail: string, fallback?: string): string {
  const sameSector = detail.match(/같은\s+(.+?)\s+종목들/);
  if (sameSector?.[1]) return sameSector[1].trim();
  const inSector = detail.match(/([가-힣A-Za-z0-9]+)\s+안에서/);
  if (inSector?.[1]) return inSector[1].trim();
  return fallback?.trim() || "섹터";
}

function rankFromDetail(detail: string, fallback?: number): number | undefined {
  if (typeof fallback === "number" && Number.isFinite(fallback)) return fallback;
  const match = detail.match(/시총\s+(\d+)위/);
  return match?.[1] ? Number(match[1]) : undefined;
}

function clipped(text: string, max = 34): string {
  const clean = cleanInline(text);
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export function compactDiscoveryCardHeadline({
  reason,
  sector,
  marketCapRank,
}: DiscoveryHeadlineInput): string | undefined {
  const clean = cleanInline(reason);
  if (!clean) return undefined;

  const parts = splitDiscoveryReason(clean);
  const state = parts.state;
  const detail = parts.detail ?? clean;

  if (state === "혼자 튄 무명주") {
    const displaySector = sectorFromDetail(detail, sector);
    const rank = rankFromDetail(detail, marketCapRank);
    const caveat = /뒤를 받칠/.test(detail);
    const subject = rank ? `시총 ${rank}위 ${displaySector}주` : `${displaySector} 안의 무명주`;
    return caveat ? clipped(`${subject}가 튀었지만 근거는 얇아요`) : clipped(`${subject}가 혼자 튀었어요`);
  }

  if (state === "이유 얇은 섹터선두") {
    return clipped(`${sectorFromDetail(detail, sector)} 선두지만 근거는 얇아요`);
  }

  if (state === "뉴스 재료 붙은 종목" || state === "공시 먼저 뜬 종목" || (!state && /뉴스|공시|소식|계약|수주/.test(clean))) {
    const topic = topicFromMaterial(detail);
    const support = supportFromDetail(detail);
    return topic === "뉴스" ? support : `${topic}에 ${support}`;
  }

  if (state?.includes("수급")) {
    if (/외국인/.test(detail)) return "외국인 수급이 먼저 들어왔어요";
    if (/기관/.test(detail)) return "기관 수급이 먼저 들어왔어요";
    return "수급이 먼저 들어온 종목이에요";
  }

  if (state?.includes("거래")) return "거래가 먼저 커진 종목이에요";
  if (state?.includes("새 가격대")) return "새 가격대까지 밟은 종목이에요";

  return undefined;
}
