import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required').max(120, 'Max 120 characters'),
  product_description: z.string().trim().max(1000).optional().nullable(),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  product_description: z.string().trim().max(1000).optional().nullable(),
  cover_asset_id: z.string().uuid().optional().nullable(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
