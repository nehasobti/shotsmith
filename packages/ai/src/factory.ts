import { MockAiProvider } from './mock';
import { FalAiProvider } from './fal';
import type { AiProvider } from './types';

export function getAiProvider(): AiProvider {
  const isMock = process.env.AI_MOCK === '1' || !process.env.FAL_KEY;

  if (isMock) {
    return new MockAiProvider();
  }

  // Fal provider handles background removal and upscaling
  return new MockAiProvider();
}

export function getFalProvider(): FalAiProvider | MockAiProvider {
  const isMock = process.env.AI_MOCK === '1' || !process.env.FAL_KEY;

  if (isMock) {
    return new MockAiProvider();
  }

  return new FalAiProvider(process.env.FAL_KEY);
}
