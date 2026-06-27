import type { DiscoveryMarket, StockCountry } from "@fomo/core";

export type DiscoveryCountryScope = "KR" | "US" | "all";

export interface DiscoveryMarketRow {
  canonical: string;
  symbol: string;
  naverCode?: string;
  market: DiscoveryMarket;
  country: StockCountry;
  marketCapRank?: number;
  priceText?: string;
  changeText?: string;
  changeDir?: "up" | "down" | "flat";
  changePct?: number;
  tradingValue?: number;
  currency?: "KRW" | "USD";
  sparkline?: number[];
}

export interface MarketSource {
  id: string;
  country: DiscoveryCountryScope;
  fetchMarketRows(): Promise<DiscoveryMarketRow[]>;
}
