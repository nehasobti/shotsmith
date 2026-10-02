import { describe, it, expect } from 'vitest';
import { MockAiProvider, AI_MODELS } from '../index';

describe('AI Package & Mock Provider', () => {
  const provider = new MockAiProvider();

  it('exposes defined models matching spec', () => {
    expect(AI_MODELS.gemini.text).toBe('gemini-1.5-flash');
    expect(AI_MODELS.fal.birefnet).toBe('fal-ai/birefnet');
  });

  it('removes background with mock adapter', async () => {
    const res = await provider.removeBackground('https://example.com/test.jpg');
    expect(res.requestId).toBeDefined();
    expect(res.result?.imageUrl).toBeDefined();
  });

  it('generates up to requested variation count for scenes', async () => {
    const res = await provider.generateScenes({
      imageUrl: 'https://example.com/test.jpg',
      prompt: 'placed on marble',
      variationCount: 4,
    });
    expect(res.images).toHaveLength(4);
    expect(res.costUsd).toBeGreaterThan(0);
  });

  it('generates compliant 5-bullet structured copy', async () => {
    const res = await provider.generateCopy({
      productName: 'Noise Cancelling Headphones',
      tone: 'luxury',
      language: 'en',
    });
    expect(res.output.bullets).toHaveLength(5);
    expect(res.output.title).toContain('Noise Cancelling Headphones');
    expect(res.output.hashtags.length).toBeGreaterThanOrEqual(5);
  });

  it('describes image for auto-fill', async () => {
    const res = await provider.describeImage({
      imageUrl: 'https://example.com/mug.jpg',
    });
    expect(res.productName).toBeTruthy();
    expect(res.productDescription).toBeTruthy();
  });
});
