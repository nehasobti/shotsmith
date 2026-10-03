import { eq, and, desc } from 'drizzle-orm';
import { db, projects, assets } from '../../db';
import { requireUserSession } from '../../utils/auth';

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

  const [project] = await db
    .select()
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
          message: 'The requested project could not be found.',
        },
      },
    });
  }

  const projectAssets = await db
    .select()
    .from(assets)
    .where(and(eq(assets.projectId, projectId), eq(assets.userId, userId)))
    .orderBy(desc(assets.createdAt));

  return {
    project,
    assets: projectAssets,
  };
});
