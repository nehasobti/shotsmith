import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { requireUserSession } from '../utils/auth';
import { db, assets, projects } from '../db';
import { eq, and } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const userId = session.user.id;

  const rawBody = await readBody(event);

  // 1. Direct / Mock / Local Upload Support
  // Allows testing and local development seamlessly without requiring BLOB_READ_WRITE_TOKEN
  if (rawBody && rawBody.mode === 'direct_upload') {
    const { projectId, blobUrl, blobPathname, width, height, mimeType, sizeBytes } = rawBody;

    if (!projectId || !blobUrl) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: { error: { code: 'INVALID_UPLOAD_PARAMS', message: 'projectId and blobUrl are required' } },
      });
    }

    // Verify project ownership
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1);

    if (!project) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        data: { error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found.' } },
      });
    }

    const [newAsset] = await db
      .insert(assets)
      .values({
        projectId,
        userId,
        kind: 'original',
        blobUrl,
        blobPathname: blobPathname || `users/${userId}/projects/${projectId}/originals/${Date.now()}.png`,
        width: width || 1024,
        height: height || 1024,
        mimeType: mimeType || 'image/png',
        sizeBytes: sizeBytes || 102400,
      })
      .returning();

    // Set cover asset if project does not have one
    if (!project.coverAssetId && newAsset) {
      await db
        .update(projects)
        .set({ coverAssetId: newAsset.id })
        .where(eq(projects.id, projectId));
    }

    return {
      asset: newAsset,
    };
  }

  // 2. Production Vercel Blob Client Upload Token & Callback
  try {
    const jsonResponse = await handleUpload({
      body: rawBody as HandleUploadBody,
      request: toWebRequest(event),
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let projectId = '';
        if (clientPayload) {
          try {
            const parsedPayload = JSON.parse(clientPayload);
            projectId = parsedPayload.projectId || '';
          } catch {
            // ignore JSON parse error
          }
        }

        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          maximumSizeInBytes: 10 * 1024 * 1024, // 10 MB
          tokenPayload: JSON.stringify({
            userId,
            projectId,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          if (!tokenPayload) return;
          const { userId: payloadUserId, projectId } = JSON.parse(tokenPayload);

          if (!projectId || !payloadUserId) return;

          const [newAsset] = await db
            .insert(assets)
            .values({
              projectId,
              userId: payloadUserId,
              kind: 'original',
              blobUrl: blob.url,
              blobPathname: blob.pathname,
              mimeType: blob.contentType || 'image/png',
              sizeBytes: 0,
            })
            .returning();

          if (newAsset) {
            // Check if project has a cover image
            const [proj] = await db
              .select({ coverAssetId: projects.coverAssetId })
              .from(projects)
              .where(eq(projects.id, projectId))
              .limit(1);

            if (proj && !proj.coverAssetId) {
              await db
                .update(projects)
                .set({ coverAssetId: newAsset.id })
                .where(eq(projects.id, projectId));
            }
          }
        } catch (err) {
          console.error('[uploads] Error handling onUploadCompleted:', err);
        }
      },
    });

    return jsonResponse;
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        error: {
          code: 'UPLOAD_TOKEN_ERROR',
          message: error.message || 'Failed to process upload request',
        },
      },
    });
  }
});
