import { describe, it, expect } from 'vitest';
import { createProjectSchema, updateProjectSchema, updateAssetSchema } from '@shopshot/shared';

describe('Phase 2: Projects & Asset Schemas', () => {
  it('validates valid project creation payloads', () => {
    const valid = createProjectSchema.safeParse({
      name: 'Leather Weekend Bag',
      product_description: 'Handcrafted full-grain leather duffel bag with brass hardware.',
    });
    expect(valid.success).toBe(true);
  });

  it('rejects empty or whitespace-only project names', () => {
    const empty = createProjectSchema.safeParse({
      name: '   ',
    });
    expect(empty.success).toBe(false);
  });

  it('validates project update payloads', () => {
    const updateValid = updateProjectSchema.safeParse({
      name: 'Renamed Project',
      cover_asset_id: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(updateValid.success).toBe(true);

    const invalidUuid = updateProjectSchema.safeParse({
      cover_asset_id: 'not-a-uuid',
    });
    expect(invalidUuid.success).toBe(false);
  });

  it('validates asset favorite toggle updates', () => {
    const valid = updateAssetSchema.safeParse({
      is_favorite: true,
    });
    expect(valid.success).toBe(true);
  });
});
