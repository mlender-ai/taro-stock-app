import { STOCK_VOCAB, type StockDef } from "@fomo/core";

const KNOWN_US_SYMBOLS: Record<string, string> = {
  "엔비디아": "NVDA",
  "TSMC": "TSM",
  "마이크로소프트": "MSFT",
  "애플": "AAPL",
  "테슬라": "TSLA",
  "AMD": "AMD",
  "브로드컴": "AVGO",
  "팔란티어": "PLTR",
  "마이크론": "MU",
};

const SEC_CIK_BY_SYMBOL: Record<string, string> = {
  AAPL: "0000320193",
  AMD: "0000002488",
  AVGO: "0001730168",
  MSFT: "0000789019",
  MU: "0000723125",
  NVDA: "0001045810",
  PLTR: "0001321655",
  TSLA: "0001318605",
};

function asciiAlias(def: StockDef): string | undefined {
  return def.aliases.find((alias) => /^[A-Z]{1,5}$/.test(alias));
}

export function usSymbolForStock(stock: string): string | undefined {
  const direct = KNOWN_US_SYMBOLS[stock.trim()];
  if (direct) return direct;
  const upper = stock.trim().toUpperCase();
  if (/^[A-Z]{1,5}$/.test(upper)) return upper;
  const def = STOCK_VOCAB.find((item) => item.canonical === stock || item.aliases.includes(stock));
  if (!def || def.country === "KR") return undefined;
  return KNOWN_US_SYMBOLS[def.canonical] ?? asciiAlias(def);
}

export function secCikForSymbol(symbol: string): string | undefined {
  return SEC_CIK_BY_SYMBOL[symbol.trim().toUpperCase()];
}

export function usStockDefs(): StockDef[] {
  return STOCK_VOCAB.filter((def) => def.country !== "KR" && def.market !== "COIN").map((def) => ({ ...def }));
}
