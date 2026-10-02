import { getCreditBalance, getRecentTransactions } from '../lib/credits';
import { requireUserSession } from '../utils/auth';

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const userId = session.user.id;

  const [balance, recentTransactions] = await Promise.all([
    getCreditBalance(userId),
    getRecentTransactions(userId, 20),
  ]);

  return {
    balance,
    recentTransactions,
  };
});
