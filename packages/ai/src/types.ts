import type { CopyOutput, CopyTone } from '@shopshot/shared';

export interface RemoveBgResult {
  imageUrl: string;
  width?: number;
  height?: number;
  costUsd?: number;
}

export interface SceneGenParams {
  imageUrl: string;
  prompt: string;
  variationCount: number;
}

export interface MagicEditParams {
  imageUrl: string;
  maskUrl: string;
  instruction: string;
}

export interface UpscaleParams {
  imageUrl: string;
  scale: 2 | 4;
}

export interface CopyGenParams {
  productName: string;
  productDescription?: string;
  imageUrl?: string;
  tone: CopyTone;
  language: string;
}

export interface DescribeImageParams {
  imageUrl: string;
}

export interface DescribeImageResult {
  productName: string;
  productDescription: string;
}

export interface AiProvider {
  removeBackground(imageUrl: string, options?: { webhookUrl?: string }): Promise<{ requestId: string; result?: RemoveBgResult }>;
  generateScenes(params: SceneGenParams): Promise<{ images: Array<{ url: string; width: number; height: number }>; costUsd: number }>;
  magicEdit(params: MagicEditParams): Promise<{ imageUrl: string; width: number; height: number; costUsd: number }>;
  upscale(params: UpscaleParams, options?: { webhookUrl?: string }): Promise<{ requestId: string; result?: { imageUrl: string; width: number; height: number; costUsd: number } }>;
  generateCopy(params: CopyGenParams): Promise<{ output: CopyOutput; tokens: number; costUsd: number }>;
  describeImage(params: DescribeImageParams): Promise<DescribeImageResult>;
}
