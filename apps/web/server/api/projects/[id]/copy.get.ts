import { requireUserSession } from '../../../utils/auth';
import { db, copyGenerations } from '../../../db';
import { eq, and, desc } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const userId = session.user.id;
  const projectId = getRouterParam(event, 'id');

  if (!projectId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: { error: { code: 'INVALID_PROJECT_ID', message: 'Project ID is required.' } },
    });
  }

  const generations = await db
    .select()
    .from(copyGenerations)
    .where(and(eq(copyGenerations.projectId, projectId), eq(copyGenerations.userId, userId)))
    .orderBy(desc(copyGenerations.createdAt));

  return {
    generations,
  };
});
