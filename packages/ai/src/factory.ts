import { MockAiProvider } from './mock';
import { FalAiProvider } from './fal';
import { GeminiAiProvider } from './gemini';
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

export class UnifiedAiProvider implements AiProvider {
  private fal: FalAiProvider;
  private gemini: GeminiAiProvider;
  private mock: MockAiProvider;

  constructor() {
    this.fal = new FalAiProvider();
    this.gemini = new GeminiAiProvider();
    this.mock = new MockAiProvider();
  }

  async removeBackground(
    imageUrl: string,
    options?: { webhookUrl?: string }
  ): Promise<{ requestId: string; result?: RemoveBgResult }> {
    if (process.env.AI_MOCK === '1' || !process.env.FAL_KEY) {
      return this.mock.removeBackground(imageUrl, options);
    }
    return this.fal.removeBackground(imageUrl, options);
  }

  async generateScenes(
    params: SceneGenParams
  ): Promise<{ images: Array<{ url: string; width: number; height: number }>; costUsd: number }> {
    if (process.env.AI_MOCK === '1' || (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && !process.env.FAL_KEY)) {
      return this.mock.generateScenes(params);
    }
    return this.gemini.generateScenes(params);
  }

  async magicEdit(
    params: MagicEditParams
  ): Promise<{ imageUrl: string; width: number; height: number; costUsd: number }> {
    if (process.env.AI_MOCK === '1' || (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && !process.env.FAL_KEY)) {
      return this.mock.magicEdit(params);
    }
    return this.gemini.magicEdit(params);
  }

  async upscale(
    params: UpscaleParams,
    options?: { webhookUrl?: string }
  ): Promise<{ requestId: string; result?: { imageUrl: string; width: number; height: number; costUsd: number } }> {
    if (process.env.AI_MOCK === '1' || !process.env.FAL_KEY) {
      return this.mock.upscale(params, options);
    }
    return this.fal.upscale(params, options);
  }

  async generateCopy(params: CopyGenParams): Promise<{ output: CopyOutput; tokens: number; costUsd: number }> {
    if (process.env.AI_MOCK === '1' || !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return this.mock.generateCopy(params);
    }
    return this.gemini.generateCopy(params);
  }

  async describeImage(params: DescribeImageParams): Promise<DescribeImageResult> {
    if (process.env.AI_MOCK === '1' || !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return this.mock.describeImage(params);
    }
    return this.gemini.describeImage(params);
  }
}

export function createAiProvider(): AiProvider {
  if (process.env.AI_MOCK === '1') {
    return new MockAiProvider();
  }
  return new UnifiedAiProvider();
}
