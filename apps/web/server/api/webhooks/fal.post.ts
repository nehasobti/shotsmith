import { inngest } from '../../inngest/client';
import { db, generationJobs } from '../../db';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: { error: { code: 'EMPTY_WEBHOOK_BODY', message: 'Webhook body cannot be empty' } },
    });
  }

  const requestId = body.request_id || body.requestId || event.headers.get('x-fal-request-id');

  if (!requestId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: { error: { code: 'MISSING_REQUEST_ID', message: 'fal.ai request ID was not provided' } },
    });
  }

  // Verify this request ID matches a running generation job
  const [job] = await db
    .select({ id: generationJobs.id, status: generationJobs.status })
    .from(generationJobs)
    .where(eq(generationJobs.externalRequestId, requestId))
    .limit(1);

  if (!job) {
    console.warn(`[fal webhook] Ignoring unknown request ID: ${requestId}`);
    return { received: true, ignored: true };
  }

  // Dispatch Inngest event to wake up the waiting step
  await inngest.send({
    name: 'fal/result',
    data: {
      requestId,
      payload: body.payload || body,
    },
  });

  return {
    received: true,
    jobId: job.id,
  };
});
