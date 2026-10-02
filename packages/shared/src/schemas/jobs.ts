import { z } from 'zod';

export const jobTypeEnum = z.enum(['remove_bg', 'scene', 'edit', 'upscale']);
export type JobType = z.infer<typeof jobTypeEnum>;

export const jobStatusEnum = z.enum(['queued', 'running', 'succeeded', 'failed']);
export type JobStatus = z.infer<typeof jobStatusEnum>;

export const jobProviderEnum = z.enum(['google', 'fal']);
export type JobProvider = z.infer<typeof jobProviderEnum>;

export const sceneJobParamsSchema = z.object({
  presetId: z.string().optional(),
  prompt: z.string().max(500).optional(),
  variationCount: z.number().int().min(1).max(4).default(4),
});

export const editJobParamsSchema = z.object({
  maskUrl: z.string().url(),
  instruction: z.string().min(1).max(500),
});

export const upscaleJobParamsSchema = z.object({
  scale: z.union([z.literal(2), z.literal(4)]).default(2),
});

export const createJobSchema = z.object({
  projectId: z.string().uuid(),
  sourceAssetId: z.string().uuid(),
  type: jobTypeEnum,
  params: z.union([
    sceneJobParamsSchema,
    editJobParamsSchema,
    upscaleJobParamsSchema,
    z.record(z.unknown()),
  ]).default({}),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
