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

export class MockAiProvider implements AiProvider {
  async removeBackground(
    _imageUrl: string,
    _options?: { webhookUrl?: string }
  ): Promise<{ requestId: string; result?: RemoveBgResult }> {
    return {
      requestId: 'mock-req-' + Math.random().toString(36).substring(7),
      result: {
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1024&q=80',
        width: 1024,
        height: 1024,
        costUsd: 0.005,
      },
    };
  }

  async generateScenes(
    params: SceneGenParams
  ): Promise<{ images: Array<{ url: string; width: number; height: number }>; costUsd: number }> {
    const count = Math.min(params.variationCount || 4, 4);
    const mockUrls = [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1024&q=80',
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1024&q=80',
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1024&q=80',
      'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=1024&q=80',
    ];

    return {
      images: mockUrls.slice(0, count).map((url) => ({
        url,
        width: 1024,
        height: 1024,
      })),
      costUsd: 0.04,
    };
  }

  async magicEdit(
    _params: MagicEditParams
  ): Promise<{ imageUrl: string; width: number; height: number; costUsd: number }> {
    return {
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1024&q=80',
      width: 1024,
      height: 1024,
      costUsd: 0.02,
    };
  }

  async upscale(
    params: UpscaleParams,
    _options?: { webhookUrl?: string }
  ): Promise<{ requestId: string; result?: { imageUrl: string; width: number; height: number; costUsd: number } }> {
    const scaleFactor = params.scale || 2;
    return {
      requestId: 'mock-upscale-' + Math.random().toString(36).substring(7),
      result: {
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=2048&q=80',
        width: 1024 * scaleFactor,
        height: 1024 * scaleFactor,
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
