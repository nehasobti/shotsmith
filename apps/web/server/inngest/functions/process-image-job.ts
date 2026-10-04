import { inngest } from '../client';
import { db, generationJobs, assets } from '../../db';
import { eq } from 'drizzle-orm';
import { refundCredits } from '../../lib/credits';
import { getFalProvider } from '@shopshot/ai';

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
    const { jobId, userId, projectId, sourceAssetId, type, creditsCharged } = event.data;

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

      // Step 3: Run the AI operation
      let resultImageUrl = '';
      let resultWidth = sourceAsset.width || 1024;
      let resultHeight = sourceAsset.height || 1024;
      let costUsd = 0.005;

      if (type === 'remove_bg') {
        const falProvider = getFalProvider();
        const webhookBaseUrl = process.env.FAL_WEBHOOK_BASE_URL;

        if (process.env.AI_MOCK === '1' || !process.env.FAL_KEY) {
          // Mock mode: Return high-quality transparent PNG sample
          const mockRes = await falProvider.removeBackground(sourceAsset.blobUrl);
          resultImageUrl = mockRes.result?.imageUrl || sourceAsset.blobUrl;
          resultWidth = mockRes.result?.width || resultWidth;
          resultHeight = mockRes.result?.height || resultHeight;
          costUsd = mockRes.result?.costUsd || costUsd;
        } else if (webhookBaseUrl) {
          // Production: submit to queue with webhook URL and wait for event
          const submitRes = await step.run('submit-fal-queue', async () => {
            const webhookUrl = `${webhookBaseUrl}/api/webhooks/fal`;
            const res = await falProvider.removeBackground(sourceAsset.blobUrl, {
              webhookUrl,
            });

            await db
              .update(generationJobs)
              .set({ externalRequestId: res.requestId })
              .where(eq(generationJobs.id, jobId));

            return res;
          });

          // Wait for webhook callback event
          const falEvent = await step.waitForEvent('wait-for-fal-webhook', {
            event: 'fal/result',
            timeout: '10m',
            match: 'async.data.requestId == event.data.requestId',
          });

          if (!falEvent || !falEvent.data?.payload?.image?.url) {
            throw new Error('Fal background removal webhook did not return an image URL');
          }

          resultImageUrl = falEvent.data.payload.image.url;
          resultWidth = falEvent.data.payload.image.width || resultWidth;
          resultHeight = falEvent.data.payload.image.height || resultHeight;
        } else {
          // Local development without webhook URL: run direct subscription
          const directRes = await step.run('fal-direct-call', async () => {
            return await falProvider.removeBackground(sourceAsset.blobUrl);
          });

          if (!directRes.result?.imageUrl) {
            throw new Error('Failed to extract transparent cut-out from fal.ai');
          }

          resultImageUrl = directRes.result.imageUrl;
          resultWidth = directRes.result.width || resultWidth;
          resultHeight = directRes.result.height || resultHeight;
          costUsd = directRes.result.costUsd || costUsd;
        }
      } else {
        throw new Error(`Unsupported job type in processImageJob: ${type}`);
      }

      // Step 4: Save result asset to database
      const createdAsset = await step.run('save-result-asset', async () => {
        const [asset] = await db
          .insert(assets)
          .values({
            projectId,
            userId,
            parentAssetId: sourceAssetId,
            jobId,
            kind: 'cutout',
            blobUrl: resultImageUrl,
            blobPathname: `users/${userId}/projects/${projectId}/cutouts/${Date.now()}.png`,
            width: resultWidth,
            height: resultHeight,
            mimeType: 'image/png',
          })
          .returning();

        return asset;
      });

      // Step 5: Mark job as succeeded
      await step.run('mark-job-succeeded', async () => {
        await db
          .update(generationJobs)
          .set({
            status: 'succeeded',
            finishedAt: new Date(),
            costUsd: costUsd.toString(),
          })
          .where(eq(generationJobs.id, jobId));
      });

      return {
        success: true,
        assetId: createdAsset?.id,
        imageUrl: resultImageUrl,
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
