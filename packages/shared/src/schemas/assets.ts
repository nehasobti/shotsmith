import { z } from 'zod';

export const assetKindEnum = z.enum([
  'original',
  'cutout',
  'scene',
  'edit',
  'upscale',
  'export',
]);

export type AssetKind = z.infer<typeof assetKindEnum>;

export const updateAssetSchema = z.object({
  is_favorite: z.boolean().optional(),
});

export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
