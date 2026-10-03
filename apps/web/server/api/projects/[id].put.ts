import { eq, and } from 'drizzle-orm';
import { db, projects } from '../../db';
import { requireUserSession } from '../../utils/auth';
import { updateProjectSchema } from '@shopshot/shared';

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const userId = session.user.id;
  const projectId = event.context.params?.id;

  if (!projectId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        error: {
          code: 'INVALID_PROJECT_ID',
          message: 'Project ID is required',
        },
      },
    });
  }

  const rawBody = await readBody(event);
  const parsed = updateProjectSchema.safeParse(rawBody);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid update data.',
        },
      },
    });
  }

  const updates: Record<string, any> = {
    updatedAt: new Date(),
  };

  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.product_description !== undefined) updates.productDescription = parsed.data.product_description;
  if (parsed.data.cover_asset_id !== undefined) updates.coverAssetId = parsed.data.cover_asset_id;

  const [updatedProject] = await db
    .update(projects)
    .set(updates)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .returning();

  if (!updatedProject) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      data: {
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project not found or unauthorized to update.',
        },
      },
    });
  }

  return {
    project: updatedProject,
  };
});
