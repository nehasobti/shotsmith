import { inngest } from '../client';
import { db, user, creditLedger } from '../../db';
import { eq } from 'drizzle-orm';
import { getCreditBalance } from '../../lib/credits';

export const resetDemoAccount = inngest.createFunction(
  {
    id: 'reset-demo-account',
    name: 'Reset Demo Account Daily Credits',
  },
  { cron: '0 0 * * *' }, // Nightly at midnight
  async ({ step }) => {
    const demoEmail = process.env.DEMO_USER_EMAIL || 'demo@shopshot.dev';

    const result = await step.run('topup-demo-credits', async () => {
      const [demoUser] = await db
        .select()
        .from(user)
        .where(eq(user.email, demoEmail))
        .limit(1);

      if (!demoUser) {
        return { skipped: true, reason: 'Demo user not found' };
      }

      const targetCredits = parseInt(process.env.SIGNUP_CREDITS || '30', 10);
      const currentBalance = await getCreditBalance(demoUser.id);

      if (currentBalance < targetCredits) {
        const topupAmount = targetCredits - currentBalance;
        await db.insert(creditLedger).values({
          userId: demoUser.id,
          delta: topupAmount,
          reason: 'daily_grant',
        });

        return {
          success: true,
          userId: demoUser.id,
          previousBalance: currentBalance,
          addedCredits: topupAmount,
          newBalance: targetCredits,
        };
      }

      return {
        success: true,
        userId: demoUser.id,
        currentBalance,
        message: 'Balance already at or above target',
      };
    });

    return result;
  }
);
