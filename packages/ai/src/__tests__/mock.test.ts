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

  it('cuts out actual product image and preserves transparency instead of hardcoded watches', async () => {
    const sharp = (await import('sharp')).default;
    // Create a 60x60 white image with a 20x20 blue box in the center
    const testSvg = `<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="60" fill="#ffffff"/>
      <rect x="20" y="20" width="20" height="20" fill="#0000ff"/>
    </svg>`;
    const pngBuffer = await sharp(Buffer.from(testSvg)).png().toBuffer();
    const dataUrl = `data:image/png;base64,${pngBuffer.toString('base64')}`;

    const res = await provider.removeBackground(dataUrl);
    expect(res.result?.imageUrl).toBeDefined();
    expect(res.result?.imageUrl).not.toContain('photo-1523275335684-37898b6baf30');
    expect(res.result?.imageUrl.startsWith('data:image/png;base64,')).toBe(true);

    // Verify cutout transparency
    const resultBase64 = res.result!.imageUrl.replace('data:image/png;base64,', '');
    const resultBuffer = Buffer.from(resultBase64, 'base64');
    const { data } = await sharp(resultBuffer).raw().toBuffer({ resolveWithObject: true });
    // Corner pixel (0,0) should be transparent (alpha = 0)
    expect(data[3]).toBe(0);
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
