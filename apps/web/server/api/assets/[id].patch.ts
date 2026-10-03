import { eq, and } from 'drizzle-orm';
import { db, assets } from '../../db';
import { requireUserSession } from '../../utils/auth';
import { updateAssetSchema } from '@shopshot/shared';

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const userId = session.user.id;
  const assetId = event.context.params?.id;

  if (!assetId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        error: {
          code: 'INVALID_ASSET_ID',
          message: 'Asset ID is required',
        },
      },
    });
  }

  const rawBody = await readBody(event);
  const parsed = updateAssetSchema.safeParse(rawBody);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid asset update data.',
        },
      },
    });
  }

  const updates: Record<string, any> = {};
  if (parsed.data.is_favorite !== undefined) {
    updates.isFavorite = parsed.data.is_favorite;
  }

  const [updatedAsset] = await db
    .update(assets)
    .set(updates)
    .where(and(eq(assets.id, assetId), eq(assets.userId, userId)))
    .returning();

  if (!updatedAsset) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      data: {
        error: {
          code: 'ASSET_NOT_FOUND',
          message: 'Asset not found or unauthorized to update.',
        },
      },
    });
  }

  return {
    asset: updatedAsset,
  };
});
