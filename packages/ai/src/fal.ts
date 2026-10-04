import { fal } from '@fal-ai/client';
import { AI_MODELS } from './config';
import type { MagicEditParams, RemoveBgResult, UpscaleParams } from './types';
import { smartRemoveBackground, smartUpscale } from './local-processor';

export class FalAiProvider {
  constructor(apiKey?: string) {
    const key = apiKey || process.env.FAL_KEY;
    if (key) {
      fal.config({ credentials: key });
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

    // Direct / local subscription
    try {
      const result: any = await fal.subscribe(AI_MODELS.fal.birefnet, {
        input,
        logs: false,
      });

      return {
        requestId: 'direct-' + Date.now(),
        result: {
          imageUrl: result.data?.image?.url || result.image?.url,
          width: result.data?.image?.width || result.image?.width || 1024,
          height: result.data?.image?.height || result.image?.height || 1024,
          costUsd: 0.005,
        },
      };
    } catch {
      // Offline fallback
      const cutout = await smartRemoveBackground(imageUrl);
      return {
        requestId: 'mock-fal-' + Date.now(),
        result: {
          imageUrl: cutout.dataUrl,
          width: cutout.width,
          height: cutout.height,
          costUsd: 0.005,
        },
      };
    }
  }

  async upscale(
    params: UpscaleParams,
    options?: { webhookUrl?: string }
  ): Promise<{
    requestId: string;
    result?: { imageUrl: string; width: number; height: number; costUsd: number };
  }> {
    const input = {
      image_url: params.imageUrl,
      scale: params.scale,
    };

    if (options?.webhookUrl) {
      const response = await fal.queue.submit(AI_MODELS.fal.upscaler, {
        input,
        webhookUrl: options.webhookUrl,
      });

      return {
        requestId: response.request_id,
      };
    }

    try {
      const result: any = await fal.subscribe(AI_MODELS.fal.upscaler, {
        input,
        logs: false,
      });

      const mult = params.scale || 2;
      return {
        requestId: 'direct-upscale-' + Date.now(),
        result: {
          imageUrl: result.data?.image?.url || result.image?.url,
          width: (result.data?.image?.width || result.image?.width || 1024) * mult,
          height: (result.data?.image?.height || result.image?.height || 1024) * mult,
          costUsd: 0.01,
        },
      };
    } catch {
      // Offline fallback
      const mult = (params.scale === 4 ? 4 : 2) as 2 | 4;
      const upscaled = await smartUpscale(params.imageUrl, mult);
      return {
        requestId: 'mock-upscale-' + Date.now(),
        result: {
          imageUrl: upscaled.dataUrl,
          width: upscaled.width,
          height: upscaled.height,
          costUsd: 0.01,
        },
      };
    }
  }

  async checkQueueStatus(
    endpoint: string,
    requestId: string
  ): Promise<{
    status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED';
    result?: { imageUrl: string; width: number; height: number; costUsd: number };
  }> {
    const status: any = await fal.queue.status(endpoint, {
      requestId,
      logs: false,
    });

    if (status.status === 'COMPLETED') {
      const result: any = await fal.queue.result(endpoint, {
        requestId,
      });

      return {
        status: 'COMPLETED',
        result: {
          imageUrl: result.data?.image?.url || result.image?.url,
          width: result.data?.image?.width || result.image?.width || 1024,
          height: result.data?.image?.height || result.image?.height || 1024,
          costUsd: 0.005,
        },
      };
    }

    return {
      status: status.status,
    };
  }

  async magicEdit(
    params: MagicEditParams
  ): Promise<{ imageUrl: string; width: number; height: number; costUsd: number }> {
    try {
      const result: any = await fal.subscribe(AI_MODELS.fal.fluxEdit, {
        input: {
          image_url: params.imageUrl,
          mask_url: params.maskUrl,
          prompt: params.instruction,
        } as any,
        logs: false,
      });

      return {
        imageUrl: result.data?.images?.[0]?.url || result.images?.[0]?.url || params.imageUrl,
        width: 1024,
        height: 1024,
        costUsd: 0.03,
      };
    } catch {
      return {
        imageUrl: params.imageUrl,
        width: 1024,
        height: 1024,
        costUsd: 0.03,
      };
    }
  }
}
