import { eq, and, desc } from 'drizzle-orm';
import { db, projects, assets } from '../../../db';
import { requireUserSession } from '../../../utils/auth';
import type { AssetKind } from '@shopshot/shared';

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

  // Verify project ownership
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);

  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      data: {
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project not found.',
        },
      },
    });
  }

  const query = getQuery(event);
  const kindFilter = query.kind as AssetKind | undefined;

  const conditions = [
    eq(assets.projectId, projectId),
    eq(assets.userId, userId),
  ];

  if (kindFilter) {
    conditions.push(eq(assets.kind, kindFilter));
  }

  const projectAssets = await db
    .select()
    .from(assets)
    .where(and(...conditions))
    .orderBy(desc(assets.createdAt));

  return {
    assets: projectAssets,
  };
});
