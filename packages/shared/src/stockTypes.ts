// Stock data types for ticker detail screen
// Used by both web API and mobile app

export interface StockQuote {
  symbol: string;
  shortName: string;
  longName: string;
  currency: string;
  exchange: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  dayLow: number;
  dayHigh: number;
  fiftyTwoWeekLow: number;
  fiftyTwoWeekHigh: number;
  marketCap: number;
  trailingPE: number | null;
  forwardPE: number | null;
  priceToBook: number | null;
  dividendYield: number | null;
  volume: number;
  averageVolume: number;
  // Phase 2: extended financials
  returnOnEquity?: number | null;
  grossMargins?: number | null;
  operatingMargins?: number | null;
  totalRevenue?: number | null;
  revenueGrowth?: number | null;
  debtToEquity?: number | null;
}

export interface StockChartBar {
  date: string; // ISO date or timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockChartResponse {
  bars: StockChartBar[];
  meta: {
    currency: string;
    symbol: string;
    exchangeName?: string;
  };
}
