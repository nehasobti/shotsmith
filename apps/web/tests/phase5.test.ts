import { describe, it, expect } from 'vitest';
import { exportRequestSchema, generateCopySchema, EXPORT_PRESETS } from '@shopshot/shared';
import { processImageForPreset } from '../server/lib/images';
import { MockAiProvider } from '@shopshot/ai';
import sharp from 'sharp';

describe('Phase 5: Ad Copy & Marketplace Exports', () => {
  it('validates export request schema', () => {
    const valid = exportRequestSchema.safeParse({
      assetIds: ['123e4567-e89b-12d3-a456-426614174000'],
      presetIds: ['instagram_post', 'amazon_main'],
    });
    expect(valid.success).toBe(true);
  });

  it('rejects empty export requests', () => {
    const invalid = exportRequestSchema.safeParse({
      assetIds: [],
      presetIds: ['instagram_post'],
    });
    expect(invalid.success).toBe(false);
  });

  it('validates ad copy generation input', () => {
    const valid = generateCopySchema.safeParse({
      productName: 'Ceramic Tumbler',
      productDescription: 'Double walled insulated travel mug',
      tone: 'luxury',
      language: 'en',
    });
    expect(valid.success).toBe(true);
  });

  it('generates structured copy with 5 bullets and hashtags via mock provider', async () => {
    const provider = new MockAiProvider();
    const res = await provider.generateCopy({
      productName: 'Ceramic Tumbler',
      tone: 'luxury',
      language: 'en',
    });

    expect(res.output.title).toBeDefined();
    expect(res.output.description).toBeDefined();
    expect(res.output.bullets).toHaveLength(5);
    expect(res.output.caption).toBeDefined();
    expect(res.output.hashtags.length).toBeGreaterThanOrEqual(5);
  });

  it('auto-describes product photo with mock provider', async () => {
    const provider = new MockAiProvider();
    const res = await provider.describeImage({
      imageUrl: 'https://example.com/mug.jpg',
    });

    expect(res.productName).toBeDefined();
    expect(res.productDescription).toBeDefined();
  });

  it('processes Amazon Main image preset with Sharp to 2000x2000 white background', async () => {
    // Generate a 500x500 test image in memory
    const testBuffer = await sharp({
      create: {
        width: 500,
        height: 500,
        channels: 4,
        background: { r: 50, g: 100, b: 200, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const amazonPreset = EXPORT_PRESETS.find((p) => p.id === 'amazon_main')!;
    const { buffer, filename } = await processImageForPreset(testBuffer, amazonPreset);

    expect(filename).toBe('amazon_main.jpg');

    const meta = await sharp(buffer).metadata();
    expect(meta.width).toBe(2000);
    expect(meta.height).toBe(2000);
    expect(meta.format).toBe('jpeg');
  });

  it('processes Instagram Story preset with Sharp to 1080x1920', async () => {
    const testBuffer = await sharp({
      create: {
        width: 600,
        height: 600,
        channels: 4,
        background: { r: 255, g: 100, b: 50, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const storyPreset = EXPORT_PRESETS.find((p) => p.id === 'instagram_story')!;
    const { buffer, filename } = await processImageForPreset(testBuffer, storyPreset);

    expect(filename).toBe('instagram_story.png');

    const meta = await sharp(buffer).metadata();
    expect(meta.width).toBe(1080);
    expect(meta.height).toBe(1920);
    expect(meta.format).toBe('png');
  });
});
