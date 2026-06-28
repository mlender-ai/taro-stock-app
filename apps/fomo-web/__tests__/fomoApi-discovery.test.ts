import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearApiCache } from "../lib/apiCache";
import { fetchDiscovery, type DiscoveryResponse } from "../lib/fomoApi";

const storage = new Map<string, string>();

function dateKey(): string {
  return new Date(Date.now() + 9 * 60 * 60_000).toISOString().slice(0, 10);
}

function storageKey(country = "KR"): string {
  return `fomo:discovery:v5:${country}:${dateKey()}`;
}

function installWindowStorage() {
  storage.clear();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
  });
}

function discovery(asOf: string, canonical = "엠게임"): DiscoveryResponse {
  return {
    asOf,
    country: "KR",
    stocks: [
      {
        kind: "stock",
        canonical,
        market: "KOSDAQ",
        country: "KR",
        naverCode: "058630",
        marquee: false,
        sector: "게임",
      },
    ],
    cards: [
      {
        kind: "stock",
        canonical,
        market: "KOSDAQ",
        country: "KR",
        naverCode: "058630",
        marquee: false,
        sector: "게임",
      },
    ],
    fronts: {},
    confidence: "M",
    source: "test",
  };
}

function okResponse(value: DiscoveryResponse): Response {
  return {
    ok: true,
    json: async () => value,
  } as Response;
}

beforeEach(() => {
  clearApiCache();
  installWindowStorage();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  storage.clear();
});

describe("fetchDiscovery loading contract", () => {
  it("waits for the fresh deck instead of rendering stored cards first", async () => {
    storage.set(storageKey(), JSON.stringify(discovery("stored")));
    const fresh = discovery("fresh", "광주신세계");
    const fetchMock = vi.fn(async () => okResponse(fresh));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchDiscovery("KR");

    expect(result.asOf).toBe("fresh");
    expect(result.stocks[0]?.canonical).toBe("광주신세계");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(storage.get(storageKey()) ?? "{}").asOf).toBe("fresh");
  });

  it("uses the stored deck only after the fresh request fails", async () => {
    storage.set(storageKey(), JSON.stringify(discovery("stored")));
    const fetchMock = vi.fn(async () => {
      throw new Error("network down");
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchDiscovery("KR");

    expect(result.asOf).toBe("stored");
    expect(fetchMock).toHaveBeenCalled();
  });
});
