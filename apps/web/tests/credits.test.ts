import { describe, it, expect } from 'vitest';
import { CREDIT_COSTS, DEFAULT_SIGNUP_CREDITS } from '@shopshot/shared';

describe('Credit System Logic', () => {
  it('calculates credit balances correctly from ledger deltas', () => {
    const transactions = [
      { delta: DEFAULT_SIGNUP_CREDITS, reason: 'signup_grant' },
      { delta: -CREDIT_COSTS.remove_bg, reason: 'job_charge' },
      { delta: -CREDIT_COSTS.scene, reason: 'job_charge' },
      { delta: CREDIT_COSTS.scene, reason: 'job_refund' }, // Refund failed job
    ];

    const balance = transactions.reduce((acc, tx) => acc + tx.delta, 0);
    // 30 - 1 - 4 + 4 = 29
    expect(balance).toBe(29);
  });

  it('prevents overdraft when checking balance against cost', () => {
    const currentBalance = 3;
    const canAffordScene = currentBalance >= CREDIT_COSTS.scene; // 4
    const canAffordEdit = currentBalance >= CREDIT_COSTS.edit; // 1
    const canAffordUpscale = currentBalance >= CREDIT_COSTS.upscale; // 2

    expect(canAffordScene).toBe(false);
    expect(canAffordEdit).toBe(true);
    expect(canAffordUpscale).toBe(true);
  });

  it('maintains expected default signup grant of 30 credits', () => {
    expect(DEFAULT_SIGNUP_CREDITS).toBe(30);
  });
});
