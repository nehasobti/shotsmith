/**
 * Centralized AI Model Configurations
 * Per spec: Keep model ids in one config file.
 */
export const AI_MODELS = {
  // Google Gemini
  gemini: {
    text: 'gemini-1.5-flash',
    vision: 'gemini-1.5-flash',
    image: 'imagen-3.0-generate-002',
  },
  // fal.ai
  fal: {
    birefnet: 'fal-ai/birefnet',
    upscaler: 'fal-ai/esrgan',
    fluxEdit: 'fal-ai/flux/dev/image-to-image',
  },
} as const;
