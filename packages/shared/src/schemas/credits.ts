import { z } from 'zod';

export const creditReasonEnum = z.enum([
  'signup_grant',
  'daily_grant',
  'job_charge',
  'job_refund',
  'purchase',
]);

export type CreditReason = z.infer<typeof creditReasonEnum>;

export const creditLedgerEntrySchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  delta: z.number().int(),
  reason: creditReasonEnum,
  jobId: z.string().uuid().nullable().optional(),
  createdAt: z.string().datetime(),
});

export type CreditLedgerEntry = z.infer<typeof creditLedgerEntrySchema>;

export const creditBalanceResponseSchema = z.object({
  balance: z.number().int(),
  recentTransactions: z.array(creditLedgerEntrySchema),
});

export type CreditBalanceResponse = z.infer<typeof creditBalanceResponseSchema>;
