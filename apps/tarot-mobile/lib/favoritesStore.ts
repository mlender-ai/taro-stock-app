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

  fetchFavorites: () => Promise<void>;
  addFavorite: (ticker: string, market: string, label?: string) => Promise<void>;
  removeFavorite: (ticker: string) => Promise<void>;
  toggleAlert: (id: string, enabled: boolean) => Promise<void>;
  isFavorite: (ticker: string) => boolean;

  registerPushToken: (userId: string, token: string) => Promise<void>;
  unregisterPushToken: (userId: string) => Promise<void>;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  items: [],
  loading: false,
  pushToken: null,

  fetchFavorites: async () => {
    set({ loading: true });
    try {
      const data = await apiFetch<{ items: FavoriteItem[] }>("/api/tarot/favorites");
      set({ items: data.items, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addFavorite: async (ticker, market, label) => {
    try {
      const fav = await apiFetch<FavoriteItem>("/api/tarot/favorites", {
        method: "POST",
        body: JSON.stringify({ ticker, market, label }),
      });
      set((state) => ({
        items: [fav, ...state.items.filter((f) => f.ticker !== ticker)],
      }));
    } catch {
      // silent
    }
  },

  removeFavorite: async (ticker) => {
    const prev = get().items;
    set({ items: prev.filter((f) => f.ticker !== ticker) });
    try {
      await apiFetch(`/api/tarot/favorites?ticker=${ticker}`, { method: "DELETE" });
    } catch {
      set({ items: prev });
    }
  },

  toggleAlert: async (id, enabled) => {
    set((state) => ({
      items: state.items.map((f) => (f.id === id ? { ...f, alertEnabled: enabled } : f)),
    }));
    try {
      await apiFetch(`/api/tarot/favorites/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ alertEnabled: enabled }),
      });
    } catch {
      set((state) => ({
        items: state.items.map((f) => (f.id === id ? { ...f, alertEnabled: !enabled } : f)),
      }));
    }
  },

  isFavorite: (ticker) => get().items.some((f) => f.ticker === ticker),

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
      await apiFetch(`/api/tarot/push?userId=${userId}`, { method: "DELETE" });
      set({ pushToken: null });
    } catch {
      // silent
    }
  },
}));
