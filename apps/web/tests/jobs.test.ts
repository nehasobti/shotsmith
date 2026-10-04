import { describe, it, expect } from 'vitest';
import { createJobSchema, CREDIT_COSTS } from '@shopshot/shared';
import { getFalProvider, MockAiProvider } from '@shopshot/ai';

describe('Phase 3: Job Engine & Background Removal', () => {
  it('validates background removal job creation payload', () => {
    const valid = createJobSchema.safeParse({
      projectId: '123e4567-e89b-12d3-a456-426614174000',
      sourceAssetId: '123e4567-e89b-12d3-a456-426614174001',
      type: 'remove_bg',
      params: {},
    });
    expect(valid.success).toBe(true);
  });

  it('rejects invalid job types', () => {
    const invalid = createJobSchema.safeParse({
      projectId: '123e4567-e89b-12d3-a456-426614174000',
      sourceAssetId: '123e4567-e89b-12d3-a456-426614174001',
      type: 'invalid_type',
    });
    expect(invalid.success).toBe(false);
  });

  it('charges exactly 1 credit for background removal', () => {
    expect(CREDIT_COSTS.remove_bg).toBe(1);
  });

  it('runs background removal with mock adapter without throwing', async () => {
    const provider = new MockAiProvider();
    const result = await provider.removeBackground('https://example.com/shoe.jpg');

    expect(result.requestId).toBeDefined();
    expect(result.result?.imageUrl).toBeDefined();
    expect(result.result?.costUsd).toBe(0.005);
  });

  it('simulates job failure refund calculation', () => {
    let userBalance = 30;
    const cost = CREDIT_COSTS.remove_bg;

    // 1. Deduct credits on job start
    userBalance -= cost;
    expect(userBalance).toBe(29);

    // 2. On job failure, refund credits
    const jobFailed = true;
    if (jobFailed) {
      userBalance += cost;
    }
    expect(userBalance).toBe(30);
  });
});
