import { create } from "zustand";
import { apiFetch } from "./api";

export interface FavoriteItem {
  id: string;
  userId: string;
  ticker: string;
  market: string;
  label: string | null;
  alertEnabled: boolean;
  createdAt: string;
}

interface FavoritesState {
  items: FavoriteItem[];
  loading: boolean;
  pushToken: string | null;

  fetchFavorites: (userId: string) => Promise<void>;
  addFavorite: (
    userId: string,
    ticker: string,
    market: string,
    label?: string
  ) => Promise<void>;
  removeFavorite: (userId: string, ticker: string) => Promise<void>;
  toggleAlert: (id: string, enabled: boolean) => Promise<void>;
  isFavorite: (ticker: string) => boolean;

  registerPushToken: (userId: string, token: string) => Promise<void>;
  unregisterPushToken: (userId: string) => Promise<void>;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  items: [],
  loading: false,
  pushToken: null,

  fetchFavorites: async (userId) => {
    set({ loading: true });
    try {
      const data = await apiFetch<{ items: FavoriteItem[] }>(
        `/api/tarot/favorites?userId=${userId}`
      );
      set({ items: data.items, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addFavorite: async (userId, ticker, market, label) => {
    try {
      const fav = await apiFetch<FavoriteItem>("/api/tarot/favorites", {
        method: "POST",
        body: JSON.stringify({ userId, ticker, market, label }),
      });
      set((state) => ({
        items: [fav, ...state.items.filter((f) => f.ticker !== ticker)],
      }));
    } catch {
      // silent
    }
  },

  removeFavorite: async (userId, ticker) => {
    // 낙관적 업데이트
    const prev = get().items;
    set({ items: prev.filter((f) => f.ticker !== ticker) });
    try {
      await apiFetch(
        `/api/tarot/favorites?userId=${userId}&ticker=${ticker}`,
        { method: "DELETE" }
      );
    } catch {
      set({ items: prev }); // 롤백
    }
  },

  toggleAlert: async (id, enabled) => {
    // 낙관적 업데이트
    set((state) => ({
      items: state.items.map((f) =>
        f.id === id ? { ...f, alertEnabled: enabled } : f
      ),
    }));
    try {
      await apiFetch(`/api/tarot/favorites/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ alertEnabled: enabled }),
      });
    } catch {
      // 실패 시 롤백
      set((state) => ({
        items: state.items.map((f) =>
          f.id === id ? { ...f, alertEnabled: !enabled } : f
        ),
      }));
    }
  },

  isFavorite: (ticker) => {
    return get().items.some((f) => f.ticker === ticker);
  },

  registerPushToken: async (userId, token) => {
    try {
      await apiFetch("/api/tarot/push", {
        method: "POST",
        body: JSON.stringify({ userId, pushToken: token }),
      });
      set({ pushToken: token });
    } catch {
      // silent
    }
  },

  unregisterPushToken: async (userId) => {
    try {
      await apiFetch(`/api/tarot/push?userId=${userId}`, {
        method: "DELETE",
      });
      set({ pushToken: null });
    } catch {
      // silent
    }
  },
}));
