import { eq, and } from 'drizzle-orm';
import { db, assets, projects } from '../../db';
import { requireUserSession } from '../../utils/auth';
import { deleteBlobs } from '../../lib/blob';

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

  // 1. Fetch asset details
  const [asset] = await db
    .select()
    .from(assets)
    .where(and(eq(assets.id, assetId), eq(assets.userId, userId)))
    .limit(1);

  if (!asset) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      data: {
        error: {
          code: 'ASSET_NOT_FOUND',
          message: 'Asset not found or unauthorized to delete.',
        },
      },
    });
  }

  // 2. Delete blob from Vercel Blob
  if (asset.blobUrl) {
    await deleteBlobs([asset.blobUrl]);
  }

  // 3. Clear coverAssetId if this asset is used as project cover
  await db
    .update(projects)
    .set({ coverAssetId: null })
    .where(and(eq(projects.id, asset.projectId), eq(projects.coverAssetId, asset.id)));

  // 4. Delete asset row
  await db
    .delete(assets)
    .where(and(eq(assets.id, assetId), eq(assets.userId, userId)));

  return {
    success: true,
  };
});
