import { fal } from '@fal-ai/client';
import { AI_MODELS } from './config';
import type { RemoveBgResult, UpscaleParams } from './types';

export class FalAiProvider {
  constructor(apiKey?: string) {
    if (apiKey) {
      fal.config({ credentials: apiKey });
    }
  }

  async removeBackground(
    imageUrl: string,
    options?: { webhookUrl?: string }
  ): Promise<{ requestId: string; result?: RemoveBgResult }> {
    const input = {
      image_url: imageUrl,
    };

    if (options?.webhookUrl) {
      const response = await fal.queue.submit(AI_MODELS.fal.birefnet, {
        input,
        webhookUrl: options.webhookUrl,
      });

      return {
        requestId: response.request_id,
      };
    }

    // Local / direct subscription
    const result: any = await fal.subscribe(AI_MODELS.fal.birefnet, {
      input,
      logs: false,
    });

    return {
      requestId: 'direct-' + Date.now(),
      result: {
        imageUrl: result.data?.image?.url || result.image?.url,
        width: result.data?.image?.width || result.image?.width,
        height: result.data?.image?.height || result.image?.height,
        costUsd: 0.005,
      },
    };
  }

  async checkQueueStatus(requestId: string): Promise<{
    status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED';
    result?: RemoveBgResult;
  }> {
    const status: any = await fal.queue.status(AI_MODELS.fal.birefnet, {
      requestId,
      logs: false,
    });

    if (status.status === 'COMPLETED') {
      const result: any = await fal.queue.result(AI_MODELS.fal.birefnet, {
        requestId,
      });

      return {
        status: 'COMPLETED',
        result: {
          imageUrl: result.data?.image?.url || result.image?.url,
          width: result.data?.image?.width || result.image?.width,
          height: result.data?.image?.height || result.image?.height,
          costUsd: 0.005,
        },
      };
    }

    return {
      status: status.status,
    };
  }
}
