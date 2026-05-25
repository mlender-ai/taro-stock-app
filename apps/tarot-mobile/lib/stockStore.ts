import { create } from "zustand";
import { apiFetch } from "./api";
import type { StockQuote, StockChartBar, StockChartResponse } from "@trading/shared/src/stockTypes";

export type ChartRange = "1d" | "5d" | "1mo" | "3mo" | "1y";

export interface QuarterlyEarning {
  date: string;
  revenue: number | null;
  earnings: number | null;
}

export interface AnnualFinancial {
  year: string;
  revenue: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
}

export interface CompanyProfile {
  sector: string;
  industry: string;
  employees: number | null;
  summary: string;
  website: string;
}

interface FinancialsResponse {
  profile: CompanyProfile;
  quarterlyEarnings: QuarterlyEarning[];
  annualFinancials: AnnualFinancial[];
}

interface StockState {
  quote: StockQuote | null;
  chartBars: StockChartBar[];
  chartRange: ChartRange;
  quoteLoading: boolean;
  chartLoading: boolean;
  error: string | null;

  // Financials
  profile: CompanyProfile | null;
  quarterlyEarnings: QuarterlyEarning[];
  annualFinancials: AnnualFinancial[];
  financialsLoading: boolean;

  fetchQuote: (symbol: string) => Promise<void>;
  fetchChart: (symbol: string, range?: ChartRange) => Promise<void>;
  fetchFinancials: (symbol: string) => Promise<void>;
  setChartRange: (range: ChartRange) => void;
  reset: () => void;
}

export const useStockStore = create<StockState>((set, get) => ({
  quote: null,
  chartBars: [],
  chartRange: "3mo",
  quoteLoading: false,
  chartLoading: false,
  error: null,
  profile: null,
  quarterlyEarnings: [],
  annualFinancials: [],
  financialsLoading: false,

  fetchQuote: async (symbol) => {
    set({ quoteLoading: true, error: null });
    try {
      const data = await apiFetch<StockQuote>(
        `/api/tarot/quote?symbol=${encodeURIComponent(symbol)}`
      );
      set({ quote: data, quoteLoading: false });
    } catch (err) {
      set({
        quoteLoading: false,
        error: err instanceof Error ? err.message : "시세 조회 실패",
      });
    }
  },

  fetchChart: async (symbol, range) => {
    const r = range ?? get().chartRange;
    set({ chartLoading: true, chartRange: r });
    try {
      const data = await apiFetch<StockChartResponse>(
        `/api/tarot/chart?symbol=${encodeURIComponent(symbol)}&range=${r}`
      );
      set({ chartBars: data.bars, chartLoading: false });
    } catch {
      set({ chartLoading: false, chartBars: [] });
    }
  },

  fetchFinancials: async (symbol) => {
    set({ financialsLoading: true });
    try {
      const data = await apiFetch<FinancialsResponse>(
        `/api/tarot/financials?symbol=${encodeURIComponent(symbol)}`
      );
      set({
        profile: data.profile,
        quarterlyEarnings: data.quarterlyEarnings,
        annualFinancials: data.annualFinancials,
        financialsLoading: false,
      });
    } catch {
      set({ financialsLoading: false });
    }
  },

  setChartRange: (range) => set({ chartRange: range }),

  reset: () =>
    set({
      quote: null,
      chartBars: [],
      chartRange: "3mo",
      quoteLoading: false,
      chartLoading: false,
      error: null,
      profile: null,
      quarterlyEarnings: [],
      annualFinancials: [],
      financialsLoading: false,
    }),
}));
