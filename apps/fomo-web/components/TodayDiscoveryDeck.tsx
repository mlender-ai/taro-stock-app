"use client";

import { useEffect, useState } from "react";
import { StockSwipeDeck } from "@/components/StockSwipeDeck";
import { DISCOVERY_UPDATED_EVENT, fetchDiscovery, type DiscoveryResponse } from "@/lib/fomoApi";
import { FullPageLoading, LOADING_PRESETS } from "@/components/FullPageLoading";
import { MIN_DISCOVERY_STOCKS, type DeckStock } from "@/lib/discoveryDeck";
import type { FrontEntry } from "@/components/StockSwipeDeck";

interface TodayDiscoveryDeckProps {
  loggedIn?: boolean | undefined;
  onRequireLogin?: (() => void) | undefined;
}

function DiscoveryEmpty({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mt-16 px-8 text-center text-sm leading-6 text-whiteout" role="status">
      <p>
        오늘 발견 풀을 불러오지 못했어요.
        <br />
        다시 불러오는 중이에요.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-full border border-hairline bg-surface px-5 py-2 text-xs font-semibold text-whiteout transition-colors hover:border-whiteout/30"
      >
        지금 다시 불러오기
      </button>
    </div>
  );
}

export function TodayDiscoveryDeck({ loggedIn, onRequireLogin }: TodayDiscoveryDeckProps) {
  const [retryKey, setRetryKey] = useState(0);
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "error" }
    | { kind: "ready"; stocks: DeckStock[]; fronts: Record<string, FrontEntry> }
  >({ kind: "loading" });

  useEffect(() => {
    let alive = true;
    const applyDiscovery = (discovery: DiscoveryResponse) => {
      const stocks = discovery.stocks as DeckStock[];
      if (stocks.length === 0) {
        setState({ kind: "error" });
        return;
      }
      setState({ kind: "ready", stocks, fronts: discovery.fronts as Record<string, FrontEntry> });
    };
    const onDiscoveryUpdated = (event: Event) => {
      const discovery = (event as CustomEvent<DiscoveryResponse>).detail;
      if (!alive || !discovery) return;
      applyDiscovery(discovery);
    };
    window.addEventListener(DISCOVERY_UPDATED_EVENT, onDiscoveryUpdated);
    setState({ kind: "loading" });
    (async () => {
      try {
        const discovery = await fetchDiscovery();
        if (!alive) return;
        applyDiscovery(discovery);
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[TodayDiscoveryDeck] fetch failed", err);
        }
        if (alive) setState({ kind: "error" });
      }
    })();
    return () => {
      alive = false;
      window.removeEventListener(DISCOVERY_UPDATED_EVENT, onDiscoveryUpdated);
    };
  }, [retryKey]);

  useEffect(() => {
    if (state.kind !== "error") return;
    const retry = window.setTimeout(() => setRetryKey((value) => value + 1), 3_500);
    return () => window.clearTimeout(retry);
  }, [state.kind]);

  if (state.kind === "loading") {
    return <FullPageLoading estimateMs={LOADING_PRESETS.main.estimateMs} steps={LOADING_PRESETS.main.steps} />;
  }
  if (state.kind === "error") return <DiscoveryEmpty onRetry={() => setRetryKey((value) => value + 1)} />;

  return (
    <StockSwipeDeck
      stocks={state.stocks.slice(0, Math.max(MIN_DISCOVERY_STOCKS, state.stocks.length))}
      initialFronts={state.fronts}
      contextLabel="오늘의 발견"
      loggedIn={loggedIn}
      onRequireLogin={onRequireLogin}
    />
  );
}
