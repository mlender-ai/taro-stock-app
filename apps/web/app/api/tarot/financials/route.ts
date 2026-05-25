import { NextRequest, NextResponse } from "next/server";

const YAHOO_QUOTE_URL = "https://query2.finance.yahoo.com/v10/finance/quoteSummary";
const USER_AGENT = "Mozilla/5.0 (compatible; TarotStockBot/1.0)";

const CACHE_TTL_MS = 15 * 60 * 1000; // 15분 캐시 (재무 데이터는 변동 적음)
const cache = new Map<string, { data: FinancialsResponse; expiresAt: number }>();

interface QuarterlyEarning {
  date: string;
  revenue: number | null;
  earnings: number | null;
}

interface AnnualFinancial {
  year: string;
  revenue: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
}

interface CompanyProfile {
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

function extractNum(obj: unknown): number | null {
  if (obj && typeof obj === "object" && "raw" in obj) {
    const raw = (obj as { raw?: unknown }).raw;
    return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
  }
  if (typeof obj === "number" && Number.isFinite(obj)) return obj;
  return null;
}

function extractStr(obj: unknown): string {
  if (typeof obj === "string") return obj;
  return "";
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  const now = Date.now();
  const hit = cache.get(symbol);
  if (hit && hit.expiresAt > now) {
    return NextResponse.json(hit.data);
  }

  try {
    const modules = "summaryProfile,earnings,incomeStatementHistory";
    const url = `${YAHOO_QUOTE_URL}/${encodeURIComponent(symbol)}?modules=${modules}`;
    const res = await fetch(url, {
      headers: { accept: "application/json", "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Yahoo API error ${res.status}` }, { status: 502 });
    }

    const payload = await res.json() as {
      quoteSummary?: {
        result?: Array<{
          summaryProfile?: Record<string, unknown>;
          earnings?: {
            financialsChart?: {
              quarterly?: Array<{ date?: string; revenue?: unknown; earnings?: unknown }>;
              yearly?: Array<{ date?: number; revenue?: unknown; earnings?: unknown }>;
            };
          };
          incomeStatementHistory?: {
            incomeStatementHistory?: Array<{
              endDate?: { fmt?: string };
              totalRevenue?: unknown;
              operatingIncome?: unknown;
              netIncome?: unknown;
            }>;
          };
        }>;
      };
    };

    const result = payload.quoteSummary?.result?.[0];
    if (!result) {
      return NextResponse.json({ error: "No data found" }, { status: 404 });
    }

    const sp = result.summaryProfile ?? {};
    const profile: CompanyProfile = {
      sector: extractStr(sp.sector),
      industry: extractStr(sp.industry),
      employees: extractNum(sp.fullTimeEmployees),
      summary: extractStr(sp.longBusinessSummary),
      website: extractStr(sp.website),
    };

    // Quarterly earnings from earnings.financialsChart.quarterly
    const quarterly = result.earnings?.financialsChart?.quarterly ?? [];
    const quarterlyEarnings: QuarterlyEarning[] = quarterly.map((q) => ({
      date: q.date ?? "",
      revenue: extractNum(q.revenue),
      earnings: extractNum(q.earnings),
    }));

    // Annual financials from incomeStatementHistory
    const annualStatements = result.incomeStatementHistory?.incomeStatementHistory ?? [];
    const annualFinancials: AnnualFinancial[] = annualStatements.map((s) => ({
      year: s.endDate?.fmt?.slice(0, 4) ?? "",
      revenue: extractNum(s.totalRevenue),
      operatingIncome: extractNum(s.operatingIncome),
      netIncome: extractNum(s.netIncome),
    })).reverse(); // oldest first

    const data: FinancialsResponse = { profile, quarterlyEarnings, annualFinancials };
    cache.set(symbol, { data, expiresAt: now + CACHE_TTL_MS });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
