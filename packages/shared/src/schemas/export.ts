import { z } from 'zod';

export const exportRequestSchema = z.object({
  assetIds: z.array(z.string().uuid()).min(1, 'Select at least one image to export'),
  presetIds: z.array(z.string()).min(1, 'Select at least one export format'),
});

export type ExportRequestInput = z.infer<typeof exportRequestSchema>;
