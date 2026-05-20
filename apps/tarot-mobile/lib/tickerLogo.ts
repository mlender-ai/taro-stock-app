// Clearbit Logo API (PNG, no API key required for basic usage)
// https://logo.clearbit.com/{domain}?size={size}

const TICKER_DOMAIN_MAP: Record<string, string> = {
  // US — Large Cap
  AAPL:  "apple.com",
  NVDA:  "nvidia.com",
  TSLA:  "tesla.com",
  MSFT:  "microsoft.com",
  GOOGL: "google.com",
  GOOG:  "google.com",
  AMZN:  "amazon.com",
  META:  "meta.com",
  NFLX:  "netflix.com",
  BRKB:  "berkshirehathaway.com",
  "BRK.B": "berkshirehathaway.com",
  JPM:   "jpmorganchase.com",
  V:     "visa.com",
  MA:    "mastercard.com",
  UNH:   "unitedhealthgroup.com",
  JNJ:   "jnj.com",
  WMT:   "walmart.com",
  AVGO:  "broadcom.com",
  HD:    "homedepot.com",
  PG:    "pg.com",
  ORCL:  "oracle.com",
  AMD:   "amd.com",
  INTC:  "intel.com",
  QCOM:  "qualcomm.com",
  TXN:   "ti.com",
  CRM:   "salesforce.com",
  ADBE:  "adobe.com",
  NOW:   "servicenow.com",
  PYPL:  "paypal.com",
  UBER:  "uber.com",
  SPOT:  "spotify.com",
  COIN:  "coinbase.com",
  HOOD:  "robinhood.com",
  PLTR:  "palantir.com",
  SOFI:  "sofi.com",
  RBLX:  "roblox.com",
  SNAP:  "snap.com",
  LYFT:  "lyft.com",
  ABNB:  "airbnb.com",
  RIVN:  "rivian.com",
  LCID:  "lucidmotors.com",
  NIO:   "nio.com",
  BABA:  "alibaba.com",
  JD:    "jd.com",
  PDD:   "pinduoduo.com",
  BIDU:  "baidu.com",
  // KR — 코스피
  "005930.KS": "samsung.com",
  "000660.KS": "skhynix.com",
  "035420.KS": "navercorp.com",
  "035720.KS": "kakao.com",
  "051910.KS": "lgchem.com",
  "006400.KS": "samsungsdi.com",
  "207940.KS": "samsungbiologics.com",
  "066570.KS": "lge.com",
  "003550.KS": "lgcorp.com",
  "012330.KS": "hyundaimobis.com",
  "005380.KS": "hyundai.com",
  "000270.KS": "kia.com",
  "028260.KS": "samsungsds.com",
  "034730.KS": "sk.com",
  "017670.KS": "sktelecom.com",
  "030200.KS": "kt.com",
  "032830.KS": "samsunglife.com",
  "086790.KS": "hana.com",
  "105560.KS": "kb.com",
  // KR — 코스닥
  "035760.KQ": "cj.com",
};

export function getTickerLogoUrl(ticker: string, size = 48): string | null {
  const domain = TICKER_DOMAIN_MAP[ticker.toUpperCase()] ?? TICKER_DOMAIN_MAP[ticker];
  if (!domain) return null;
  return `https://logo.clearbit.com/${domain}?size=${size}`;
}

// Deterministic color from ticker string for fallback avatar
export function getTickerColor(ticker: string): string {
  const COLORS = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
    "#f97316", "#eab308", "#22c55e", "#14b8a6",
    "#3b82f6", "#06b6d4",
  ];
  let hash = 0;
  for (let i = 0; i < ticker.length; i++) {
    hash = (hash * 31 + ticker.charCodeAt(i)) & 0xffffffff;
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}
