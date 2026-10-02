import { describe, it, expect } from 'vitest';
import {
  SCENE_PRESETS,
  EXPORT_PRESETS,
  CREDIT_COSTS,
  loginSchema,
  registerSchema,
  createProjectSchema,
  createJobSchema,
  copyOutputSchema,
} from '../index';

describe('Shared Presets and Configurations', () => {
  it('should have all 5 scene presets configured properly', () => {
    expect(SCENE_PRESETS).toHaveLength(5);
    const ids = SCENE_PRESETS.map((p) => p.id);
    expect(ids).toContain('marble_counter');
    expect(ids).toContain('wooden_table');
    expect(ids).toContain('beach');
    expect(ids).toContain('studio_gradient');
    expect(ids).toContain('festive');

    // Every scene preset prompt template must ensure the product stays unchanged
    for (const preset of SCENE_PRESETS) {
      expect(preset.promptTemplate.toLowerCase()).toContain('keep the product');
    }
  });

  it('should have all marketplace export presets with expected sizes', () => {
    expect(EXPORT_PRESETS).toHaveLength(5);
    const igPost = EXPORT_PRESETS.find((p) => p.id === 'instagram_post');
    expect(igPost?.width).toBe(1080);
    expect(igPost?.height).toBe(1080);

    const amazon = EXPORT_PRESETS.find((p) => p.id === 'amazon_main');
    expect(amazon?.width).toBe(2000);
    expect(amazon?.height).toBe(2000);
    expect(amazon?.background).toBe('white');
  });

  it('should specify exact credit costs according to specification', () => {
    expect(CREDIT_COSTS.remove_bg).toBe(1);
    expect(CREDIT_COSTS.scene).toBe(4);
    expect(CREDIT_COSTS.edit).toBe(1);
    expect(CREDIT_COSTS.upscale).toBe(2);
    expect(CREDIT_COSTS.copy).toBe(1);
    expect(CREDIT_COSTS.describe).toBe(0);
  });
});

describe('Shared Zod Schemas', () => {
  it('validates register schema with correct constraints', () => {
    const valid = registerSchema.safeParse({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(valid.success).toBe(true);

    const invalidShortPassword = registerSchema.safeParse({
      name: 'Test',
      email: 'test@example.com',
      password: 'short',
    });
    expect(invalidShortPassword.success).toBe(false);
  });

  it('validates project creation constraints', () => {
    const valid = createProjectSchema.safeParse({
      name: 'Modern Lamp',
      product_description: 'An elegant brass lamp',
    });
    expect(valid.success).toBe(true);

    const emptyName = createProjectSchema.safeParse({
      name: '',
    });
    expect(emptyName.success).toBe(false);
  });

  it('validates copy output structured format', () => {
    const valid = copyOutputSchema.safeParse({
      title: 'Ergonomic Desk Chair',
      description: 'Engineered for comfort and productivity.',
      bullets: ['Point 1', 'Point 2', 'Point 3', 'Point 4', 'Point 5'],
      caption: 'Elevate your workspace now! #workspace',
      hashtags: ['#chair', '#ergonomics'],
    });
    expect(valid.success).toBe(true);

    // Fails if bullets is not exactly 5
    const invalidBullets = copyOutputSchema.safeParse({
      title: 'Title',
      description: 'Desc',
      bullets: ['1', '2'],
      caption: 'Cap',
      hashtags: [],
    });
    expect(invalidBullets.success).toBe(false);
  });
});
