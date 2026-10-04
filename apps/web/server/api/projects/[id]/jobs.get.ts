import { eq, and, desc } from 'drizzle-orm';
import { db, generationJobs } from '../../../db';
import { requireUserSession } from '../../../utils/auth';

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const userId = session.user.id;
  const projectId = event.context.params?.id;

  if (!projectId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: { error: { code: 'INVALID_PROJECT_ID', message: 'Project ID is required' } },
    });
  }

  const jobsList = await db
    .select()
    .from(generationJobs)
    .where(
      and(
        eq(generationJobs.projectId, projectId),
        eq(generationJobs.userId, userId)
      )
    )
    .orderBy(desc(generationJobs.createdAt))
    .limit(30);

  return {
    jobs: jobsList,
  };
});
