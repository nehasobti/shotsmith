import { requireUserSession } from '../../../utils/auth';
import { db, assets, projects } from '../../../db';
import { eq, and } from 'drizzle-orm';
import { createAiProvider } from '@shopshot/ai';

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const userId = session.user.id;
  const assetId = getRouterParam(event, 'id');

  if (!assetId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: { error: { code: 'INVALID_ID', message: 'Asset ID is required.' } },
    });
  }

  const [asset] = await db
    .select()
    .from(assets)
    .where(and(eq(assets.id, assetId), eq(assets.userId, userId)))
    .limit(1);

  if (!asset) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      data: { error: { code: 'NOT_FOUND', message: 'Asset not found.' } },
    });
  }

  const provider = createAiProvider();
  const result = await provider.describeImage({
    imageUrl: asset.blobUrl,
  });

  // Update project details if description was empty
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, asset.projectId), eq(projects.userId, userId)))
    .limit(1);

  if (project && (!project.productDescription || project.name.toLowerCase().includes('untitled'))) {
    await db
      .update(projects)
      .set({
        name: result.productName || project.name,
        productDescription: result.productDescription || project.productDescription,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, project.id));
  }

  return {
    productName: result.productName,
    productDescription: result.productDescription,
  };
});
