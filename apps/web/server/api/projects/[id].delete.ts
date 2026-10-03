import { eq, and } from 'drizzle-orm';
import { db, projects, assets } from '../../db';
import { requireUserSession } from '../../utils/auth';
import { deleteBlobs } from '../../lib/blob';

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

  // 1. Check ownership and fetch assets
  const [project] = await db
    .select({ id: projects.id })
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
          message: 'Project not found or unauthorized to delete.',
        },
      },
    });
  }

  const projectAssets = await db
    .select({ blobUrl: assets.blobUrl })
    .from(assets)
    .where(and(eq(assets.projectId, projectId), eq(assets.userId, userId)));

  // 2. Delete all blobs from Vercel Blob
  const urlsToDelete = projectAssets.map((a) => a.blobUrl);
  await deleteBlobs(urlsToDelete);

  // 3. Delete project from DB (cascades to assets, jobs, copy)
  await db
    .delete(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

  return {
    success: true,
  };
});
