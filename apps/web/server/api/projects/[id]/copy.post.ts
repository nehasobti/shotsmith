import { generateCopySchema, CREDIT_COSTS } from '@shopshot/shared';
import { requireUserSession } from '../../../utils/auth';
import { db, projects, assets, copyGenerations } from '../../../db';
import { deductCredits, refundCredits } from '../../../lib/credits';
import { limitCopyPerUser } from '../../../lib/ratelimit';
import { createAiProvider } from '@shopshot/ai';
import { eq, and } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const userId = session.user.id;

  const rateCheck = await limitCopyPerUser(userId);
  if (!rateCheck.success) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      data: {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Ad copy generation rate limit reached (max 5 per minute). Please try again shortly.',
        },
      },
    });
  }

  const projectId = getRouterParam(event, 'id');

  if (!projectId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: { error: { code: 'INVALID_PROJECT_ID', message: 'Project ID is required.' } },
    });
  }

  // 1. Verify project exists and belongs to user
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);

  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      data: { error: { code: 'NOT_FOUND', message: 'Project not found.' } },
    });
  }

  const rawBody = await readBody(event);
  const parsed = generateCopySchema.safeParse({
    productName: project.name,
    productDescription: project.productDescription || '',
    ...rawBody,
  });

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid parameters.',
        },
      },
    });
  }

  const { tone, language, productName, productDescription, assetId } = parsed.data;

  // 2. Deduct credit (1 credit for ad copy generation)
  const cost = CREDIT_COSTS.copy;
  const charge = await deductCredits(userId, cost, 'job_charge');
  if (!charge.success) {
    throw createError({
      statusCode: 402,
      statusMessage: 'Payment Required',
      data: {
        error: {
          code: 'INSUFFICIENT_CREDITS',
          message: `Ad copy requires ${cost} credit, but your current balance is ${charge.newBalance}.`,
        },
      },
    });
  }

  try {
    let imageUrl: string | undefined;
    if (assetId) {
      const [asset] = await db
        .select()
        .from(assets)
        .where(and(eq(assets.id, assetId), eq(assets.userId, userId)))
        .limit(1);
      if (asset) imageUrl = asset.blobUrl;
    }

    const provider = createAiProvider();
    const result = await provider.generateCopy({
      productName,
      productDescription,
      tone,
      language,
      imageUrl,
    });

    const [createdCopy] = await db
      .insert(copyGenerations)
      .values({
        projectId,
        userId,
        tone: tone as any,
        language,
        output: result.output,
        tokens: result.tokens,
        costUsd: result.costUsd.toString(),
      })
      .returning();

    return {
      copy: createdCopy,
      remainingCredits: charge.newBalance,
    };
  } catch (error: any) {
    // Refund on failure
    await refundCredits(userId, cost);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        error: {
          code: 'AI_COPY_FAILED',
          message: error.message || 'Failed to generate ad copy.',
        },
      },
    });
  }
});
