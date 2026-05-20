import { prisma } from "./prisma";
import type { TarotCreditReason } from "@prisma/client";

const SIGNUP_BONUS = 3;

// Short-lived in-memory cache to deduplicate concurrent aggregate queries.
// Invalidated on every write, so balance staleness is bounded to BALANCE_CACHE_TTL_MS
// only in the window between a write and the next read.
const BALANCE_CACHE_TTL_MS = 5_000;
const balanceCache = new Map<string, { balance: number; expiresAt: number }>();

function invalidateBalanceCache(userId: string) {
  balanceCache.delete(userId);
}

export async function getCreditBalance(userId: string): Promise<number> {
  const now = Date.now();
  const cached = balanceCache.get(userId);
  if (cached && cached.expiresAt > now) return cached.balance;

  const result = await prisma.tarotCreditLedger.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  const balance = result._sum.amount ?? 0;
  balanceCache.set(userId, { balance, expiresAt: now + BALANCE_CACHE_TTL_MS });
  return balance;
}

export async function addCredit(
  userId: string,
  amount: number,
  reason: TarotCreditReason,
  referenceId?: string
): Promise<number> {
  const data: { userId: string; amount: number; reason: TarotCreditReason; referenceId?: string | null } = { userId, amount, reason };
  if (referenceId !== undefined) data.referenceId = referenceId;
  await prisma.tarotCreditLedger.create({ data });
  invalidateBalanceCache(userId);
  return getCreditBalance(userId);
}

export async function deductCredit(
  userId: string,
  amount: number,
  reason: TarotCreditReason,
  referenceId?: string
): Promise<{ ok: boolean; balance: number }> {
  const balance = await getCreditBalance(userId);
  if (balance < amount) return { ok: false, balance };

  const data: { userId: string; amount: number; reason: TarotCreditReason; referenceId?: string | null } = { userId, amount: -amount, reason };
  if (referenceId !== undefined) data.referenceId = referenceId;
  await prisma.tarotCreditLedger.create({ data });
  invalidateBalanceCache(userId);
  return { ok: true, balance: balance - amount };
}

export async function grantSignupBonus(userId: string): Promise<void> {
  await prisma.tarotCreditLedger.create({
    data: { userId, amount: SIGNUP_BONUS, reason: "SIGNUP_BONUS" },
  });
}
