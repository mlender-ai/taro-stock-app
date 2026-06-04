import Constants from "expo-constants";
import { useUserStore } from "./store";
import { dedupeFetch } from "./swrMiddleware";

const API_BASE =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  "http://localhost:3000";

interface ApiError {
  error: string;
  code: string;
}

async function _doFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = useUserStore.getState().token;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string> | undefined) },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as Partial<ApiError>;
    throw new Error(body.error ?? `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  // GET requests without body are deduplicated — mutation requests bypass dedup
  const isGet = !options?.method || options.method.toUpperCase() === "GET";
  const key = isGet ? `GET:${path}` : null;
  if (key) return dedupeFetch(key, () => _doFetch<T>(path, options));
  return _doFetch<T>(path, options);
}
