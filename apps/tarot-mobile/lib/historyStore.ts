import { create } from "zustand";
import { apiFetch } from "./api";

// ─── 기록 목록 타입 ──────────────────────────────────────

interface DrawHistoryCard {
  cardId: string;
  orientation: string;
  slot: string | null;
  position: number;
  card: {
    nameKo: string;
    name: string;
    number: number;
  };
}

export interface DrawHistoryItem {
  id: string;
  ticker: string;
  market: string;
  spread: string;
  headline: string;
  source: string;
  creditCost: number;
  createdAt: string;
  cards: DrawHistoryCard[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── 기록 상세 타입 ──────────────────────────────────────

interface DetailCard {
  cardId: string;
  orientation: string;
  slot: string | null;
  position: number;
  card: {
    id: string;
    name: string;
    nameKo: string;
    number: number;
    keywords: string[];
    keywordsKo: string[];
    meaningUpright: string;
    meaningReversed: string;
    imageUrl: string;
    toneGuide: string;
  };
}

export interface DrawDetail {
  id: string;
  ticker: string;
  market: string;
  spread: string;
  headline: string;
  summary: string;
  detail: string;
  source: string;
  creditCost: number;
  createdAt: string;
  cards: DetailCard[];
  feedbacks: Array<{
    rating: string;
    comment: string | null;
    createdAt: string;
  }>;
}

// ─── 분석 타입 ───────────────────────────────────────────

export interface Analytics {
  totalDraws: number;
  spreadBreakdown: Array<{ spread: string; count: number }>;
  topCards: Array<{
    cardId: string;
    count: number;
    card: { nameKo: string; name: string; number: number } | null;
  }>;
  topTickers: Array<{ ticker: string; count: number }>;
  sourceBreakdown: Array<{ source: string; count: number }>;
  recentActivity: Array<{ date: string; count: number }>;
}

// ─── 필터 ────────────────────────────────────────────────

export type SortOption = "newest" | "oldest";
export type SpreadFilter = "ALL" | "SINGLE" | "THREE_CARD";

interface HistoryFilters {
  ticker: string;
  spread: SpreadFilter;
  sort: SortOption;
}

// ─── 스토어 ──────────────────────────────────────────────

interface HistoryState {
  items: DrawHistoryItem[];
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
  filters: HistoryFilters;

  detail: DrawDetail | null;
  detailLoading: boolean;

  analytics: Analytics | null;
  analyticsLoading: boolean;

  fetchHistory: (userId: string, page?: number) => Promise<void>;
  fetchDetail: (drawId: string) => Promise<void>;
  fetchAnalytics: (userId: string) => Promise<void>;
  setFilter: (key: keyof HistoryFilters, value: string) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: HistoryFilters = {
  ticker: "",
  spread: "ALL",
  sort: "newest",
};

export const useHistoryStore = create<HistoryState>((set, get) => ({
  items: [],
  pagination: null,
  loading: false,
  error: null,
  filters: { ...DEFAULT_FILTERS },

  detail: null,
  detailLoading: false,

  analytics: null,
  analyticsLoading: false,

  fetchHistory: async (userId, page = 1) => {
    set({ loading: true, error: null });
    try {
      const { filters } = get();
      const params = new URLSearchParams({
        userId,
        page: String(page),
        limit: "20",
        sort: filters.sort,
      });
      if (filters.ticker) params.set("ticker", filters.ticker);
      if (filters.spread !== "ALL") params.set("spread", filters.spread);

      const data = await apiFetch<{
        items: DrawHistoryItem[];
        pagination: Pagination;
      }>(`/api/tarot/history?${params}`);

      set({
        items: page === 1 ? data.items : [...get().items, ...data.items],
        pagination: data.pagination,
        loading: false,
      });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "불러오기 실패",
        loading: false,
      });
    }
  },

  fetchDetail: async (drawId) => {
    set({ detailLoading: true, detail: null });
    try {
      const data = await apiFetch<DrawDetail>(
        `/api/tarot/history/${drawId}`
      );
      set({ detail: data, detailLoading: false });
    } catch {
      set({ detailLoading: false });
    }
  },

  fetchAnalytics: async (userId) => {
    set({ analyticsLoading: true });
    try {
      const data = await apiFetch<Analytics>(
        `/api/tarot/analytics?userId=${userId}`
      );
      set({ analytics: data, analyticsLoading: false });
    } catch {
      set({ analyticsLoading: false });
    }
  },

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    }));
  },

  resetFilters: () => {
    set({ filters: { ...DEFAULT_FILTERS } });
  },
}));
