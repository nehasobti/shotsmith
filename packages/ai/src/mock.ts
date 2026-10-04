import type {
  AiProvider,
  CopyGenParams,
  DescribeImageParams,
  DescribeImageResult,
  MagicEditParams,
  RemoveBgResult,
  SceneGenParams,
  UpscaleParams,
} from './types';
import type { CopyOutput } from '@shopshot/shared';
import {
  smartRemoveBackground,
  smartGenerateScenes,
  smartMagicEdit,
  smartUpscale,
} from './local-processor';

export class MockAiProvider implements AiProvider {
  async removeBackground(
    imageUrl: string,
    _options?: { webhookUrl?: string }
  ): Promise<{ requestId: string; result?: RemoveBgResult }> {
    const cutout = await smartRemoveBackground(imageUrl);

    return {
      requestId: 'mock-req-' + Math.random().toString(36).substring(7),
      result: {
        imageUrl: cutout.dataUrl,
        width: cutout.width,
        height: cutout.height,
        costUsd: 0.005,
      },
    };
  }

  async generateScenes(
    params: SceneGenParams
  ): Promise<{ images: Array<{ url: string; width: number; height: number }>; costUsd: number }> {
    const count = Math.min(params.variationCount || 4, 4);
    const scenes = await smartGenerateScenes(params.imageUrl, count);

    return {
      images: scenes,
      costUsd: 0.01 * count,
    };
  }

  async magicEdit(
    params: MagicEditParams
  ): Promise<{ imageUrl: string; width: number; height: number; costUsd: number }> {
    const edited = await smartMagicEdit(params.imageUrl, params.instruction);

    return {
      imageUrl: edited.dataUrl,
      width: edited.width,
      height: edited.height,
      costUsd: 0.02,
    };
  }

  async upscale(
    params: UpscaleParams,
    _options?: { webhookUrl?: string }
  ): Promise<{ requestId: string; result?: { imageUrl: string; width: number; height: number; costUsd: number } }> {
    const scaleFactor = (params.scale === 4 ? 4 : 2) as 2 | 4;
    const upscaled = await smartUpscale(params.imageUrl, scaleFactor);

    return {
      requestId: 'mock-upscale-' + Math.random().toString(36).substring(7),
      result: {
        imageUrl: upscaled.dataUrl,
        width: upscaled.width,
        height: upscaled.height,
        costUsd: 0.01,
      },
    };
  }

  async generateCopy(params: CopyGenParams): Promise<{ output: CopyOutput; tokens: number; costUsd: number }> {
    return {
      output: {
        title: `${params.productName} – Premium Craftsmanship & Modern Style`,
        description: `Elevate your lifestyle with ${params.productName}. Engineered with sustainable materials and crafted for timeless appeal, this piece seamlessly integrates into your daily routine.`,
        bullets: [
          'Ultra-durable, premium eco-friendly materials built for daily performance',
          'Ergonomic minimalist design tailored for seamless everyday usability',
          'Signature aesthetic available in versatile, modern complementary colorways',
          'Precision-engineered details ensuring maximum longevity and comfort',
          'Backed by our 100% satisfaction guarantee and dedicated client care',
        ],
        caption: `Ready to upgrade your standard? Discover the all-new ${params.productName}. Click link in bio to shop now! ✨ #ECommerce #DesignInspiration`,
        hashtags: [
          '#lifestyle',
          '#productdesign',
          '#minimalism',
          '#sustainableliving',
          '#homedecor',
          '#craftsmanship',
          '#modernliving',
          '#dailyessentials',
          '#shopnow',
          '#shotsmith',
        ],
      },
      tokens: 450,
      costUsd: 0.001,
    };
  }

  async describeImage(_params: DescribeImageParams): Promise<DescribeImageResult> {
    return {
      productName: 'Artisan Ceramic Coffee Tumbler',
      productDescription:
        'A matte-finish ceramic tumbler featuring an ergonomic ribbed grip, insulated double-wall ceramic construction, and a splash-resistant bamboo lid.',
    };
  }
}
