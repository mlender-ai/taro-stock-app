import {
  synthesizeDiscoveryInsight,
  type DiscoveryCandidate,
  type DiscoveryEvent,
  type DiscoveryInsightSynthesis,
} from "@fomo/core";
import {
  cleanInline,
  hasConcreteSourceValue,
  hasExcessiveLatinHeadline,
  hasForbiddenCopy,
  isAbstractTemplate,
  isRawTitleCopy,
} from "./copy-guards";
import { synthesizeWhyDrivenInsight } from "./insight-synthesis";
import { ruleReprocessNewsHook } from "./news-reprocess";

export type CardHeadlineProvenance = "synthesis" | "rule" | "rule_nonmaterial" | "suppressed";
export type CardHeadlineMethod = "ai" | "rule" | "none";

export interface CardHeadline {
  text: string;
  provenance: CardHeadlineProvenance;
  method: CardHeadlineMethod;
  eventRef?: {
    kind: DiscoveryEvent["kind"];
    source?: string;
    asOf?: string;
    title?: string;
    url?: string;
  };
}

export interface ResolveCardHeadlineInput {
  candidate: DiscoveryCandidate;
  synthesis?: DiscoveryInsightSynthesis;
  synthesisMethod?: CardHeadlineMethod;
  reason?: string;
  sourceLabel?: string;
}

const DISCOVERY_REASON_JOINER = " — ";
const NONMATERIAL_CHANGE_THRESHOLD = 7;
const NONMATERIAL_VOLUME_THRESHOLD = 3;

const EMPTY_PATTERN = /아직\s*공개된\s*계기\s*없음|뚜렷한\s*이유는\s*아직|더\s*살펴볼|더\s*확인할|발견\s*풀/;
const WHAT_ONLY_PATTERN =
  /거래가|거래량|평소\s*\d|변동성|상대강도|시장\s*위치|종목\s+중|시총\s*\d|오늘\s*[+-]?\d|움직였|강했|셌|\d+\s*\/\s*\d+/;

function splitReasonDetail(text: string | undefined): { state?: string; detail?: string } {
  const clean = cleanInline(text);
  if (!clean || !clean.includes(DISCOVERY_REASON_JOINER)) return {};
  const [rawState, ...rest] = clean.split(DISCOVERY_REASON_JOINER);
  const state = rawState?.trim();
  const detail = rest.join(DISCOVERY_REASON_JOINER).trim();
  if (!state || state.length > 24) return {};
  return {
    state,
    ...(detail ? { detail } : {}),
  };
}

function sourceTitleFromLabel(sourceLabel: string | undefined): string | undefined {
  const clean = cleanInline(sourceLabel);
  if (!clean) return undefined;
  return clean.split(/\s+·\s+/)[0]?.trim();
}

function eventRefFrom(event: DiscoveryEvent | undefined): CardHeadline["eventRef"] | undefined {
  if (!event) return undefined;
  const ref: NonNullable<CardHeadline["eventRef"]> = {
    kind: event.kind,
  };
  const source = event.sourceName ?? event.source;
  const asOf = event.publishedAt ?? event.asOf;
  const title = event.sourceTitle ?? event.label;
  if (source) ref.source = source;
  if (asOf) ref.asOf = asOf;
  if (title) ref.title = title;
  if (event.sourceUrl) ref.url = event.sourceUrl;
  return ref;
}

function eventSourceTitle(event: DiscoveryEvent | undefined): string | undefined {
  const sourceTitle = cleanInline(event?.sourceTitle);
  if (sourceTitle && !isAbstractTemplate(sourceTitle)) return sourceTitle;
  const headlineHook = cleanInline(event?.headlineHook);
  if (headlineHook && !isAbstractTemplate(headlineHook)) return headlineHook;
  const label = cleanInline(event?.label);
  if (label && !isAbstractTemplate(label)) return label;
  return undefined;
}

function isUsableHeadline(text: string | undefined, sourceTitle: string | undefined): text is string {
  const clean = cleanInline(text);
  if (!clean || EMPTY_PATTERN.test(clean)) return false;
  if (hasExcessiveLatinHeadline(clean)) return false;
  if (hasForbiddenCopy(clean) || isAbstractTemplate(clean)) return false;
  if (isRawTitleCopy(clean, sourceTitle)) return false;
  if (sourceTitle && !hasConcreteSourceValue(clean, sourceTitle)) return false;
  return true;
}

function isMaterialEvent(event: DiscoveryEvent | undefined): boolean {
  return event?.kind === "news_mention" || event?.kind === "disclosure";
}

function pctText(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(Math.abs(value) >= 10 ? 1 : 1)}%`;
}

function nonMaterialSignal(candidate: DiscoveryCandidate): { headline: string; event: DiscoveryEvent } | undefined {
  if (candidate.country !== "US") return undefined;

  const volume = candidate.events.find((event) => event.kind === "volume_spike" && (event.volumeRatio ?? 0) >= NONMATERIAL_VOLUME_THRESHOLD);
  const move = candidate.events.find((event) =>
    (event.kind === "price_move" || event.kind === "market_context" || event.kind === "theme_link") &&
    Math.abs(event.changePct ?? 0) >= NONMATERIAL_CHANGE_THRESHOLD
  );
  const event = volume ?? move;
  if (!event) return undefined;

  const change = typeof event.changePct === "number" ? event.changePct : candidate.events.find((item) => typeof item.changePct === "number")?.changePct;
  const volumeRatio = volume?.volumeRatio;
  const pieces: string[] = [];
  if (typeof volumeRatio === "number") pieces.push(`거래량 ${volumeRatio.toFixed(1)}배`);
  if (typeof change === "number") pieces.push(`${pctText(change)} ${change >= 0 ? "상승" : "하락"}`);
  if (pieces.length === 0) return undefined;
  const prefix = candidate.sector && candidate.sector !== "미국주식" ? `${candidate.sector}에서 ` : "";

  return {
    headline: `${prefix}공개 재료로 설명하긴 이른데, 오늘 ${pieces.join("·")}했습니다`,
    event,
  };
}

function materialEventFrom(candidate: DiscoveryCandidate, primary: DiscoveryEvent | undefined): DiscoveryEvent | undefined {
  if (isMaterialEvent(primary)) return primary;
  return candidate.events.find(isMaterialEvent);
}

function ruleHeadlineFromMaterial(
  candidate: DiscoveryCandidate,
  primary: DiscoveryEvent | undefined,
  sourceTitle: string | undefined
): string | undefined {
  if (!isMaterialEvent(primary)) return undefined;
  const title = sourceTitle ?? eventSourceTitle(primary);
  if (!title) return undefined;
  return ruleReprocessNewsHook({
    stock: candidate.ticker,
    sector: candidate.sector,
    title,
    source: primary?.sourceName ?? primary?.source,
    changePct: primary?.changePct,
    asOf: primary?.publishedAt ?? primary?.asOf ?? candidate.asOf,
  });
}

async function resolveSynthesis(input: ResolveCardHeadlineInput): Promise<{
  synthesis: DiscoveryInsightSynthesis;
  method: CardHeadlineMethod;
}> {
  if (input.synthesis) {
    return { synthesis: input.synthesis, method: input.synthesisMethod ?? "rule" };
  }
  const result = await synthesizeWhyDrivenInsight(input.candidate);
  if (result.insight) {
    return {
      synthesis: result.insight,
      method: result.method === "ai" ? "ai" : "rule",
    };
  }
  return {
    synthesis: synthesizeDiscoveryInsight(input.candidate),
    method: "rule",
  };
}

export async function resolveCardHeadline(input: ResolveCardHeadlineInput): Promise<CardHeadline> {
  const { synthesis, method } = await resolveSynthesis(input);
  const primary = synthesis.primary;
  const materialEvent = materialEventFrom(input.candidate, primary);
  const sourceTitle =
    eventSourceTitle(materialEvent) ?? eventSourceTitle(primary) ?? sourceTitleFromLabel(input.sourceLabel);
  const reasonParts = splitReasonDetail(input.reason);
  const reasonDetail = reasonParts.detail ?? input.reason;

  if (isUsableHeadline(synthesis.headline, sourceTitle)) {
    const eventRef = eventRefFrom(primary ?? materialEvent);
    return {
      text: cleanInline(synthesis.headline),
      provenance: "synthesis",
      method,
      ...(eventRef ? { eventRef } : {}),
    };
  }

  const materialHeadline = ruleHeadlineFromMaterial(input.candidate, materialEvent, sourceTitle);
  if (isUsableHeadline(materialHeadline, sourceTitle)) {
    const eventRef = eventRefFrom(materialEvent ?? primary);
    return {
      text: cleanInline(materialHeadline),
      provenance: "rule",
      method: "rule",
      ...(eventRef ? { eventRef } : {}),
    };
  }

  if (isUsableHeadline(reasonDetail, sourceTitle) && !WHAT_ONLY_PATTERN.test(reasonDetail ?? "")) {
    const eventRef = eventRefFrom(primary ?? materialEvent);
    return {
      text: cleanInline(reasonDetail),
      provenance: "rule",
      method: "rule",
      ...(eventRef ? { eventRef } : {}),
    };
  }

  const nonMaterial = nonMaterialSignal(input.candidate);
  if (nonMaterial && isUsableHeadline(nonMaterial.headline, undefined)) {
    const eventRef = eventRefFrom(nonMaterial.event);
    return {
      text: cleanInline(nonMaterial.headline),
      provenance: "rule_nonmaterial",
      method: "rule",
      ...(eventRef ? { eventRef } : {}),
    };
  }

  const eventRef = eventRefFrom(primary ?? materialEvent);
  return {
    text: "",
    provenance: "suppressed",
    method: "none",
    ...(eventRef ? { eventRef } : {}),
  };
}
