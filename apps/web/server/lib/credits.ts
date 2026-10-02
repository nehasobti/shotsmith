import { eq, sql, desc } from 'drizzle-orm';
import { db, creditLedger } from '../db';
import type { CreditReason } from '@shopshot/shared';

export async function getCreditBalance(userId: string): Promise<number> {
  const result = await db
    .select({
      balance: sql<number>`coalesce(sum(${creditLedger.delta}), 0)::int`,
    })
    .from(creditLedger)
    .where(eq(creditLedger.userId, userId));

  return result[0]?.balance ?? 0;
}

export async function grantSignupCredits(userId: string, credits = 30): Promise<void> {
  // Check if signup credits already granted to prevent duplicate grants
  const existing = await db
    .select({ id: creditLedger.id })
    .from(creditLedger)
    .where(
      sql`${creditLedger.userId} = ${userId} AND ${creditLedger.reason} = 'signup_grant'`
    )
    .limit(1);

  if (existing.length > 0) {
    return;
  }

  await db.insert(creditLedger).values({
    userId,
    delta: credits,
    reason: 'signup_grant',
  });
}

export async function deductCredits(
  userId: string,
  amount: number,
  reason: CreditReason = 'job_charge',
  jobId?: string
): Promise<{ success: boolean; newBalance: number }> {
  return await db.transaction(async (tx) => {
    const balanceResult = await tx
      .select({
        balance: sql<number>`coalesce(sum(${creditLedger.delta}), 0)::int`,
      })
      .from(creditLedger)
      .where(eq(creditLedger.userId, userId));

    const currentBalance = balanceResult[0]?.balance ?? 0;

    if (currentBalance < amount) {
      return { success: false, newBalance: currentBalance };
    }

    await tx.insert(creditLedger).values({
      userId,
      delta: -Math.abs(amount),
      reason,
      jobId,
    });

    return { success: true, newBalance: currentBalance - amount };
  });
}

export async function refundCredits(
  userId: string,
  amount: number,
  jobId?: string
): Promise<void> {
  if (amount <= 0) return;

  await db.insert(creditLedger).values({
    userId,
    delta: Math.abs(amount),
    reason: 'job_refund',
    jobId,
  });
}

export async function getRecentTransactions(userId: string, limit = 20) {
  return await db
    .select()
    .from(creditLedger)
    .where(eq(creditLedger.userId, userId))
    .orderBy(desc(creditLedger.createdAt))
    .limit(limit);
}
