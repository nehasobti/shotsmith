import { eq, and } from 'drizzle-orm';
import { db, generationJobs, assets } from '../../db';
import { requireUserSession } from '../../utils/auth';

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const userId = session.user.id;
  const jobId = event.context.params?.id;

  if (!jobId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: { error: { code: 'INVALID_JOB_ID', message: 'Job ID is required' } },
    });
  }

  const [job] = await db
    .select()
    .from(generationJobs)
    .where(and(eq(generationJobs.id, jobId), eq(generationJobs.userId, userId)))
    .limit(1);

  if (!job) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      data: { error: { code: 'JOB_NOT_FOUND', message: 'Job not found' } },
    });
  }

  let resultAssets: any[] = [];
  if (job.status === 'succeeded') {
    resultAssets = await db
      .select()
      .from(assets)
      .where(and(eq(assets.jobId, jobId), eq(assets.userId, userId)));
  }

  return {
    job,
    resultAssets,
  };
});
