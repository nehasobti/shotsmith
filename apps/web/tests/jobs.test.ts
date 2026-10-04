import { describe, it, expect } from 'vitest';
import { createJobSchema, CREDIT_COSTS } from '@shopshot/shared';
import { FalAiProvider, MockAiProvider } from '@shopshot/ai';

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

  it('charges correct credits for scene (4), edit (1), and upscale (2)', () => {
    expect(CREDIT_COSTS.scene).toBe(4);
    expect(CREDIT_COSTS.edit).toBe(1);
    expect(CREDIT_COSTS.upscale).toBe(2);
  });

  it('validates scene generation with variations schema', () => {
    const valid = createJobSchema.safeParse({
      projectId: '123e4567-e89b-12d3-a456-426614174000',
      sourceAssetId: '123e4567-e89b-12d3-a456-426614174001',
      type: 'scene',
      params: {
        presetId: 'marble_counter',
        variationCount: 4,
      },
    });
    expect(valid.success).toBe(true);
  });

  it('generates 4 scene variations with mock provider', async () => {
    const provider = new MockAiProvider();
    const res = await provider.generateScenes({
      imageUrl: 'https://example.com/cutout.png',
      prompt: 'On marble counter',
      variationCount: 4,
    });
    expect(res.images.length).toBe(4);
    expect(res.costUsd).toBe(0.04);
  });

  it('executes magic edit with mock provider', async () => {
    const provider = new MockAiProvider();
    const res = await provider.magicEdit({
      imageUrl: 'https://example.com/original.png',
      maskUrl: 'https://example.com/mask.png',
      instruction: 'remove reflection',
    });
    expect(res.imageUrl).toBeDefined();
    expect(res.costUsd).toBe(0.02);
  });

  it('executes upscale 2x and 4x with mock provider', async () => {
    const provider = new MockAiProvider();
    const res2x = await provider.upscale({
      imageUrl: 'https://example.com/photo.png',
      scale: 2,
    });
    expect(res2x.result?.width).toBe(2048);

    const res4x = await provider.upscale({
      imageUrl: 'https://example.com/photo.png',
      scale: 4,
    });
    expect(res4x.result?.width).toBe(4096);
  });
});
