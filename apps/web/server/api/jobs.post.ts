import { createJobSchema, CREDIT_COSTS, type JobType } from '@shopshot/shared';
import { requireUserSession } from '../utils/auth';
import { db, generationJobs, assets } from '../db';
import { deductCredits } from '../lib/credits';
import { inngest } from '../inngest/client';
import { eq, and } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const userId = session.user.id;

  const rawBody = await readBody(event);
  const parsed = createJobSchema.safeParse(rawBody);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid job parameters.',
        },
      },
    });
  }

  const { projectId, sourceAssetId, type, params } = parsed.data;

  // 1. Verify source asset exists and belongs to user
  const [sourceAsset] = await db
    .select()
    .from(assets)
    .where(
      and(
        eq(assets.id, sourceAssetId),
        eq(assets.projectId, projectId),
        eq(assets.userId, userId)
      )
    )
    .limit(1);

  if (!sourceAsset) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      data: {
        error: {
          code: 'SOURCE_ASSET_NOT_FOUND',
          message: 'The source image could not be found.',
        },
      },
    });
  }

  // 2. Check and deduct credits
  const cost = CREDIT_COSTS[type as JobType] ?? 1;
  const chargeResult = await deductCredits(userId, cost, 'job_charge');

  if (!chargeResult.success) {
    throw createError({
      statusCode: 402,
      statusMessage: 'Payment Required',
      data: {
        error: {
          code: 'INSUFFICIENT_CREDITS',
          message: `This operation requires ${cost} credit(s), but your current balance is ${chargeResult.newBalance}.`,
        },
      },
    });
  }

  // 3. Create queued generation job row
  const provider = type === 'remove_bg' || type === 'upscale' ? 'fal' : 'google';
  const modelName = type === 'remove_bg' ? 'fal-ai/birefnet' : 'imagen-3.0';

  const [newJob] = await db
    .insert(generationJobs)
    .values({
      userId,
      projectId,
      sourceAssetId,
      type: type as any,
      status: 'queued',
      provider,
      model: modelName,
      params: params as any,
      creditsCharged: cost,
    })
    .returning();

  if (!newJob) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        error: {
          code: 'JOB_CREATION_FAILED',
          message: 'Failed to create job entry.',
        },
      },
    });
  }

  // 4. Dispatch durable Inngest event
  await inngest.send({
    name: 'image/job.requested',
    data: {
      jobId: newJob.id,
      userId,
      projectId,
      sourceAssetId,
      type,
      params,
      creditsCharged: cost,
    },
  });

  return {
    job: newJob,
    remainingCredits: chargeResult.newBalance,
  };
});
