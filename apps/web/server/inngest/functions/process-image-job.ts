import { inngest } from '../client';
import { db, generationJobs, assets } from '../../db';
import { eq } from 'drizzle-orm';
import { refundCredits } from '../../lib/credits';
import { createAiProvider } from '@shopshot/ai';

export const processImageJob = inngest.createFunction(
  {
    id: 'process-image-job',
    name: 'Process E-Commerce Image Job',
    concurrency: [
      {
        limit: 3,
        key: 'event.data.userId',
      },
    ],
    retries: 2,
  },
  { event: 'image/job.requested' },
  async ({ event, step }) => {
    const { jobId, userId, projectId, sourceAssetId, type, params, creditsCharged } = event.data;

    try {
      // Step 1: Mark job as running
      await step.run('mark-job-running', async () => {
        await db
          .update(generationJobs)
          .set({
            status: 'running',
            startedAt: new Date(),
          })
          .where(eq(generationJobs.id, jobId));
      });

      // Step 2: Fetch source asset
      const sourceAsset = await step.run('fetch-source-asset', async () => {
        const [asset] = await db
          .select()
          .from(assets)
          .where(eq(assets.id, sourceAssetId))
          .limit(1);

        if (!asset) {
          throw new Error(`Source asset not found: ${sourceAssetId}`);
        }
        return asset;
      });

      const provider = createAiProvider();
      let createdAssetIds: string[] = [];
      let totalCostUsd = 0.005;

      // Step 3: Run the requested AI operation
      if (type === 'remove_bg') {
        const bgResult = await step.run('run-remove-bg', async () => {
          return await provider.removeBackground(sourceAsset.blobUrl);
        });

        const imageUrl = bgResult.result?.imageUrl || sourceAsset.blobUrl;
        const width = bgResult.result?.width || sourceAsset.width || 1024;
        const height = bgResult.result?.height || sourceAsset.height || 1024;
        totalCostUsd = bgResult.result?.costUsd || 0.005;

        const [createdAsset] = await db
          .insert(assets)
          .values({
            projectId,
            userId,
            parentAssetId: sourceAssetId,
            jobId,
            kind: 'cutout',
            blobUrl: imageUrl,
            blobPathname: `users/${userId}/projects/${projectId}/cutouts/${Date.now()}.png`,
            width,
            height,
            mimeType: 'image/png',
          })
          .returning();

        if (createdAsset) createdAssetIds.push(createdAsset.id);
      } else if (type === 'scene') {
        const scenePrompt = params?.prompt || 'Clean minimal studio setting with soft lighting';
        const variationCount = Math.min(Math.max(params?.variationCount || 4, 1), 4);

        const sceneResult = await step.run('run-scene-generation', async () => {
          return await provider.generateScenes({
            imageUrl: sourceAsset.blobUrl,
            prompt: scenePrompt,
            variationCount,
          });
        });

        totalCostUsd = sceneResult.costUsd || 0.03 * variationCount;

        for (const [idx, img] of sceneResult.images.entries()) {
          const [createdAsset] = await db
            .insert(assets)
            .values({
              projectId,
              userId,
              parentAssetId: sourceAssetId,
              jobId,
              kind: 'scene',
              blobUrl: img.url,
              blobPathname: `users/${userId}/projects/${projectId}/scenes/${Date.now()}_${idx}.jpg`,
              width: img.width || 1024,
              height: img.height || 1024,
              mimeType: 'image/jpeg',
            })
            .returning();

          if (createdAsset) createdAssetIds.push(createdAsset.id);
        }
      } else if (type === 'edit') {
        const instruction = params?.instruction || 'Refine lighting and background';
        const maskUrl = params?.maskUrl || sourceAsset.blobUrl;

        const editResult = await step.run('run-magic-edit', async () => {
          return await provider.magicEdit({
            imageUrl: sourceAsset.blobUrl,
            maskUrl,
            instruction,
          });
        });

        totalCostUsd = editResult.costUsd || 0.02;

        const [createdAsset] = await db
          .insert(assets)
          .values({
            projectId,
            userId,
            parentAssetId: sourceAssetId,
            jobId,
            kind: 'edit',
            blobUrl: editResult.imageUrl,
            blobPathname: `users/${userId}/projects/${projectId}/edits/${Date.now()}.jpg`,
            width: editResult.width || 1024,
            height: editResult.height || 1024,
            mimeType: 'image/jpeg',
          })
          .returning();

        if (createdAsset) createdAssetIds.push(createdAsset.id);
      } else if (type === 'upscale') {
        const scale = (params?.scale === 4 ? 4 : 2) as 2 | 4;

        const upscaleResult = await step.run('run-upscale', async () => {
          return await provider.upscale({
            imageUrl: sourceAsset.blobUrl,
            scale,
          });
        });

        const imageUrl = upscaleResult.result?.imageUrl || sourceAsset.blobUrl;
        const width = upscaleResult.result?.width || (sourceAsset.width || 1024) * scale;
        const height = upscaleResult.result?.height || (sourceAsset.height || 1024) * scale;
        totalCostUsd = upscaleResult.result?.costUsd || 0.01;

        const [createdAsset] = await db
          .insert(assets)
          .values({
            projectId,
            userId,
            parentAssetId: sourceAssetId,
            jobId,
            kind: 'upscale',
            blobUrl: imageUrl,
            blobPathname: `users/${userId}/projects/${projectId}/upscales/${Date.now()}.png`,
            width,
            height,
            mimeType: 'image/png',
          })
          .returning();

        if (createdAsset) createdAssetIds.push(createdAsset.id);
      } else {
        throw new Error(`Unsupported job type in processImageJob: ${type}`);
      }

      // Step 4: Mark job as succeeded
      await step.run('mark-job-succeeded', async () => {
        await db
          .update(generationJobs)
          .set({
            status: 'succeeded',
            finishedAt: new Date(),
            costUsd: totalCostUsd.toString(),
          })
          .where(eq(generationJobs.id, jobId));
      });

      return {
        success: true,
        assetIds: createdAssetIds,
      };
    } catch (error: any) {
      console.error(`[Inngest] Job ${jobId} failed:`, error);

      // Refund credits and mark failed
      await db
        .update(generationJobs)
        .set({
          status: 'failed',
          error: error.message || 'Unknown generation failure',
          finishedAt: new Date(),
        })
        .where(eq(generationJobs.id, jobId));

      if (creditsCharged && creditsCharged > 0) {
        await refundCredits(userId, creditsCharged, jobId);
      }

      throw error;
    }
  }
);
