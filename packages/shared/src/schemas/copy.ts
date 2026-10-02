import { z } from 'zod';

export const copyToneEnum = z.enum(['professional', 'playful', 'luxury', 'minimal']);
export type CopyTone = z.infer<typeof copyToneEnum>;

export const copyOutputSchema = z.object({
  title: z.string().describe('Catchy product title for e-commerce listings'),
  description: z.string().describe('Compelling product description highlight'),
  bullets: z.array(z.string()).length(5).describe('Exactly 5 high-converting feature bullets'),
  caption: z.string().describe('Engaging Instagram / social caption with call to action'),
  hashtags: z.array(z.string()).describe('List of 10 relevant hashtags'),
});

export type CopyOutput = z.infer<typeof copyOutputSchema>;

export const generateCopySchema = z.object({
  assetId: z.string().uuid().optional(),
  productName: z.string().min(1).max(120),
  productDescription: z.string().max(1000).optional().default(''),
  tone: copyToneEnum.default('professional'),
  language: z.string().min(2).max(10).default('en'),
});

export type GenerateCopyInput = z.infer<typeof generateCopySchema>;
