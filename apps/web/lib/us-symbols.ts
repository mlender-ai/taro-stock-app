import { STOCK_VOCAB, type StockDef } from "@fomo/core";

export interface UsDiscoverySymbol {
  canonical: string;
  symbol: string;
  market: "NASDAQ" | "NYSE";
  sector: string;
  /**
   * Fame rank is a coarse, curated ordering used only for deck sorting when
   * live market-cap rank is unavailable. It must not be displayed as 시총 순위.
   */
  fameRank?: number;
}

export const US_DISCOVERY_SYMBOLS: UsDiscoverySymbol[] = [
  { canonical: "엔비디아", symbol: "NVDA", market: "NASDAQ", sector: "AI", fameRank: 3 },
  { canonical: "TSMC", symbol: "TSM", market: "NYSE", sector: "반도체", fameRank: 10 },
  { canonical: "마이크로소프트", symbol: "MSFT", market: "NASDAQ", sector: "AI", fameRank: 2 },
  { canonical: "애플", symbol: "AAPL", market: "NASDAQ", sector: "빅테크", fameRank: 1 },
  { canonical: "테슬라", symbol: "TSLA", market: "NASDAQ", sector: "전기차", fameRank: 9 },
  { canonical: "AMD", symbol: "AMD", market: "NASDAQ", sector: "반도체", fameRank: 32 },
  { canonical: "브로드컴", symbol: "AVGO", market: "NASDAQ", sector: "반도체", fameRank: 8 },
  { canonical: "팔란티어", symbol: "PLTR", market: "NASDAQ", sector: "AI", fameRank: 55 },
  { canonical: "마이크론", symbol: "MU", market: "NASDAQ", sector: "반도체", fameRank: 96 },
  { canonical: "슈퍼마이크로", symbol: "SMCI", market: "NASDAQ", sector: "AI", fameRank: 170 },
  { canonical: "앱러빈", symbol: "APP", market: "NASDAQ", sector: "AI", fameRank: 120 },
  { canonical: "로빈후드", symbol: "HOOD", market: "NASDAQ", sector: "핀테크", fameRank: 190 },
  { canonical: "코인베이스", symbol: "COIN", market: "NASDAQ", sector: "핀테크", fameRank: 160 },
  { canonical: "크라우드스트라이크", symbol: "CRWD", market: "NASDAQ", sector: "보안", fameRank: 150 },
  { canonical: "스노우플레이크", symbol: "SNOW", market: "NYSE", sector: "클라우드", fameRank: 220 },
  { canonical: "데이터독", symbol: "DDOG", market: "NASDAQ", sector: "클라우드", fameRank: 210 },
  { canonical: "몽고DB", symbol: "MDB", market: "NASDAQ", sector: "클라우드", fameRank: 260 },
  { canonical: "아이온큐", symbol: "IONQ", market: "NYSE", sector: "양자", fameRank: 360 },
  { canonical: "리게티", symbol: "RGTI", market: "NASDAQ", sector: "양자", fameRank: 620 },
  { canonical: "디웨이브퀀텀", symbol: "QBTS", market: "NYSE", sector: "양자", fameRank: 650 },
  { canonical: "사운드하운드AI", symbol: "SOUN", market: "NASDAQ", sector: "AI", fameRank: 540 },
  { canonical: "빅베어AI", symbol: "BBAI", market: "NYSE", sector: "AI", fameRank: 690 },
  { canonical: "코어위브", symbol: "CRWV", market: "NASDAQ", sector: "AI", fameRank: 430 },
  { canonical: "아스테라랩스", symbol: "ALAB", market: "NASDAQ", sector: "반도체", fameRank: 310 },
  { canonical: "램리서치", symbol: "LRCX", market: "NASDAQ", sector: "반도체", fameRank: 80 },
  { canonical: "어플라이드머티어리얼즈", symbol: "AMAT", market: "NASDAQ", sector: "반도체", fameRank: 75 },
  { canonical: "마벨테크놀로지", symbol: "MRVL", market: "NASDAQ", sector: "반도체", fameRank: 130 },
  { canonical: "퀄컴", symbol: "QCOM", market: "NASDAQ", sector: "반도체", fameRank: 34 },
  { canonical: "인텔", symbol: "INTC", market: "NASDAQ", sector: "반도체", fameRank: 85 },
  { canonical: "KLA", symbol: "KLAC", market: "NASDAQ", sector: "반도체", fameRank: 72 },
  { canonical: "ASML", symbol: "ASML", market: "NASDAQ", sector: "반도체", fameRank: 28 },
  { canonical: "시놉시스", symbol: "SNPS", market: "NASDAQ", sector: "반도체", fameRank: 82 },
  { canonical: "케이던스디자인", symbol: "CDNS", market: "NASDAQ", sector: "반도체", fameRank: 88 },
  { canonical: "샌디스크", symbol: "SNDK", market: "NASDAQ", sector: "반도체", fameRank: 340 },
  { canonical: "ARM", symbol: "ARM", market: "NASDAQ", sector: "반도체", fameRank: 60 },
  { canonical: "웨스턴디지털", symbol: "WDC", market: "NASDAQ", sector: "반도체", fameRank: 230 },
  { canonical: "시게이트", symbol: "STX", market: "NASDAQ", sector: "반도체", fameRank: 240 },
  { canonical: "델테크놀로지스", symbol: "DELL", market: "NYSE", sector: "AI", fameRank: 105 },
  { canonical: "HPE", symbol: "HPE", market: "NYSE", sector: "AI", fameRank: 210 },
  { canonical: "아리스타네트웍스", symbol: "ANET", market: "NYSE", sector: "AI", fameRank: 66 },
  { canonical: "오라클", symbol: "ORCL", market: "NYSE", sector: "AI", fameRank: 18 },
  { canonical: "세일즈포스", symbol: "CRM", market: "NYSE", sector: "클라우드", fameRank: 42 },
  { canonical: "서비스나우", symbol: "NOW", market: "NYSE", sector: "클라우드", fameRank: 64 },
  { canonical: "알파벳", symbol: "GOOGL", market: "NASDAQ", sector: "빅테크", fameRank: 4 },
  { canonical: "아마존", symbol: "AMZN", market: "NASDAQ", sector: "빅테크", fameRank: 5 },
  { canonical: "메타", symbol: "META", market: "NASDAQ", sector: "빅테크", fameRank: 6 },
  { canonical: "어도비", symbol: "ADBE", market: "NASDAQ", sector: "AI", fameRank: 98 },
  { canonical: "오클로", symbol: "OKLO", market: "NYSE", sector: "원자력", fameRank: 520 },
  { canonical: "뉴스케일파워", symbol: "SMR", market: "NYSE", sector: "원자력", fameRank: 560 },
  { canonical: "콘스텔레이션에너지", symbol: "CEG", market: "NASDAQ", sector: "에너지", fameRank: 90 },
  { canonical: "넥스트에라에너지", symbol: "NEE", market: "NYSE", sector: "에너지", fameRank: 50 },
  { canonical: "NRG에너지", symbol: "NRG", market: "NYSE", sector: "에너지", fameRank: 190 },
  { canonical: "비스트라", symbol: "VST", market: "NYSE", sector: "에너지", fameRank: 135 },
  { canonical: "GE버노바", symbol: "GEV", market: "NYSE", sector: "에너지", fameRank: 95 },
  { canonical: "버티브", symbol: "VRT", market: "NYSE", sector: "전력인프라", fameRank: 125 },
  { canonical: "이튼", symbol: "ETN", market: "NYSE", sector: "전력인프라", fameRank: 70 },
  { canonical: "콴타서비스", symbol: "PWR", market: "NYSE", sector: "전력인프라", fameRank: 110 },
  { canonical: "블룸에너지", symbol: "BE", market: "NYSE", sector: "에너지", fameRank: 580 },
  { canonical: "퍼스트솔라", symbol: "FSLR", market: "NASDAQ", sector: "태양광", fameRank: 240 },
  { canonical: "인페이즈에너지", symbol: "ENPH", market: "NASDAQ", sector: "태양광", fameRank: 300 },
  { canonical: "리비안", symbol: "RIVN", market: "NASDAQ", sector: "전기차", fameRank: 260 },
  { canonical: "루시드", symbol: "LCID", market: "NASDAQ", sector: "전기차", fameRank: 420 },
  { canonical: "니오", symbol: "NIO", market: "NYSE", sector: "전기차", fameRank: 360 },
  { canonical: "업스타트", symbol: "UPST", market: "NASDAQ", sector: "핀테크", fameRank: 600 },
  { canonical: "어펌", symbol: "AFRM", market: "NASDAQ", sector: "핀테크", fameRank: 280 },
  { canonical: "블록", symbol: "SQ", market: "NYSE", sector: "핀테크", fameRank: 180 },
  { canonical: "소파이", symbol: "SOFI", market: "NASDAQ", sector: "핀테크", fameRank: 330 },
  { canonical: "비자", symbol: "V", market: "NYSE", sector: "핀테크", fameRank: 16 },
  { canonical: "마스터카드", symbol: "MA", market: "NYSE", sector: "핀테크", fameRank: 20 },
  { canonical: "아메리칸익스프레스", symbol: "AXP", market: "NYSE", sector: "금융", fameRank: 76 },
  { canonical: "레딧", symbol: "RDDT", market: "NYSE", sector: "소셜", fameRank: 260 },
  { canonical: "스포티파이", symbol: "SPOT", market: "NYSE", sector: "콘텐츠", fameRank: 115 },
  { canonical: "넷플릭스", symbol: "NFLX", market: "NASDAQ", sector: "콘텐츠", fameRank: 35 },
  { canonical: "로쿠", symbol: "ROKU", market: "NASDAQ", sector: "콘텐츠", fameRank: 500 },
  { canonical: "듀오링고", symbol: "DUOL", market: "NASDAQ", sector: "교육", fameRank: 390 },
  { canonical: "월트디즈니", symbol: "DIS", market: "NYSE", sector: "콘텐츠", fameRank: 100 },
  { canonical: "우버", symbol: "UBER", market: "NYSE", sector: "플랫폼", fameRank: 74 },
  { canonical: "도어대시", symbol: "DASH", market: "NASDAQ", sector: "플랫폼", fameRank: 150 },
  { canonical: "에어비앤비", symbol: "ABNB", market: "NASDAQ", sector: "플랫폼", fameRank: 170 },
  { canonical: "부킹홀딩스", symbol: "BKNG", market: "NASDAQ", sector: "플랫폼", fameRank: 52 },
  { canonical: "쇼피파이", symbol: "SHOP", market: "NASDAQ", sector: "플랫폼", fameRank: 92 },
  { canonical: "클라우드플레어", symbol: "NET", market: "NYSE", sector: "클라우드", fameRank: 260 },
  { canonical: "팔로알토네트웍스", symbol: "PANW", market: "NASDAQ", sector: "보안", fameRank: 115 },
  { canonical: "포티넷", symbol: "FTNT", market: "NASDAQ", sector: "보안", fameRank: 180 },
  { canonical: "지스케일러", symbol: "ZS", market: "NASDAQ", sector: "보안", fameRank: 300 },
  { canonical: "일라이릴리", symbol: "LLY", market: "NYSE", sector: "바이오", fameRank: 14 },
  { canonical: "노보노디스크", symbol: "NVO", market: "NYSE", sector: "바이오", fameRank: 24 },
  { canonical: "암젠", symbol: "AMGN", market: "NASDAQ", sector: "바이오", fameRank: 65 },
  { canonical: "유나이티드헬스", symbol: "UNH", market: "NYSE", sector: "헬스케어", fameRank: 22 },
  { canonical: "존슨앤드존슨", symbol: "JNJ", market: "NYSE", sector: "헬스케어", fameRank: 26 },
  { canonical: "머크", symbol: "MRK", market: "NYSE", sector: "헬스케어", fameRank: 45 },
  { canonical: "애브비", symbol: "ABBV", market: "NYSE", sector: "헬스케어", fameRank: 38 },
  { canonical: "화이자", symbol: "PFE", market: "NYSE", sector: "헬스케어", fameRank: 120 },
  { canonical: "써모피셔", symbol: "TMO", market: "NYSE", sector: "헬스케어", fameRank: 58 },
  { canonical: "인튜이티브서지컬", symbol: "ISRG", market: "NASDAQ", sector: "헬스케어", fameRank: 62 },
  { canonical: "버텍스", symbol: "VRTX", market: "NASDAQ", sector: "바이오", fameRank: 100 },
  { canonical: "리제네론", symbol: "REGN", market: "NASDAQ", sector: "바이오", fameRank: 125 },
  { canonical: "모더나", symbol: "MRNA", market: "NASDAQ", sector: "바이오", fameRank: 260 },
  { canonical: "깅코바이오웍스", symbol: "DNA", market: "NYSE", sector: "바이오", fameRank: 760 },
  { canonical: "AST스페이스모바일", symbol: "ASTS", market: "NASDAQ", sector: "우주", fameRank: 430 },
  { canonical: "로켓랩", symbol: "RKLB", market: "NASDAQ", sector: "우주", fameRank: 480 },
  { canonical: "인튜이티브머신스", symbol: "LUNR", market: "NASDAQ", sector: "우주", fameRank: 720 },
  { canonical: "아처에비에이션", symbol: "ACHR", market: "NYSE", sector: "항공", fameRank: 650 },
  { canonical: "조비에비에이션", symbol: "JOBY", market: "NYSE", sector: "항공", fameRank: 590 },
  { canonical: "보잉", symbol: "BA", market: "NYSE", sector: "항공", fameRank: 95 },
  { canonical: "록히드마틴", symbol: "LMT", market: "NYSE", sector: "방산", fameRank: 68 },
  { canonical: "RTX", symbol: "RTX", market: "NYSE", sector: "방산", fameRank: 73 },
  { canonical: "노스롭그루먼", symbol: "NOC", market: "NYSE", sector: "방산", fameRank: 86 },
  { canonical: "트랜스다임", symbol: "TDG", market: "NYSE", sector: "항공", fameRank: 105 },
  { canonical: "캐터필러", symbol: "CAT", market: "NYSE", sector: "산업재", fameRank: 54 },
  { canonical: "디어", symbol: "DE", market: "NYSE", sector: "산업재", fameRank: 78 },
  { canonical: "GE에어로스페이스", symbol: "GE", market: "NYSE", sector: "산업재", fameRank: 44 },
  { canonical: "하니웰", symbol: "HON", market: "NASDAQ", sector: "산업재", fameRank: 84 },
];

const KNOWN_US_SYMBOLS: Record<string, string> = Object.fromEntries(
  US_DISCOVERY_SYMBOLS.flatMap((item) => [
    [item.canonical, item.symbol],
    [item.symbol, item.symbol],
  ])
);

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

export function usDiscoveryUniverse(): UsDiscoverySymbol[] {
  const bySymbol = new Map<string, UsDiscoverySymbol>();
  for (const item of US_DISCOVERY_SYMBOLS) bySymbol.set(item.symbol, { ...item });
  for (const def of usStockDefs()) {
    const symbol = usSymbolForStock(def.canonical);
    if (!symbol || bySymbol.has(symbol)) continue;
    bySymbol.set(symbol, {
      canonical: def.canonical,
      symbol,
      market: def.market === "NYSE" ? "NYSE" : "NASDAQ",
      sector: "미국주식",
    });
  }
  return [...bySymbol.values()];
}
