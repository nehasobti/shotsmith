export interface ScenePreset {
  id: string;
  label: string;
  thumbnail: string;
  promptTemplate: string;
  description: string;
}

export const SCENE_PRESETS: readonly ScenePreset[] = [
  {
    id: 'marble_counter',
    label: 'Marble Counter',
    thumbnail: '/presets/marble_counter.webp',
    description: 'Clean luxury modern kitchen or bathroom with natural soft sunlight',
    promptTemplate:
      'Professional product photography of the product placed on a sleek white Carrara marble countertop, soft natural morning sunlight casting subtle gentle shadows, elegant minimalist luxury aesthetic, crisp depth of field, 8k resolution. Crucial requirement: Keep the product\'s shape, label, text, colours, texture and logo exactly unchanged.',
  },
  {
    id: 'wooden_table',
    label: 'Wooden Table',
    thumbnail: '/presets/wooden_table.webp',
    description: 'Warm rustic oak surface with cozy ambient lighting',
    promptTemplate:
      'Commercial product photo of the product resting on a warm textured rustic oak wooden tabletop, soft warm ambient cafe lighting in the blurred background, cozy organic earthy mood, commercial grade lighting. Crucial requirement: Keep the product\'s shape, label, text, colours, texture and logo exactly unchanged.',
  },
  {
    id: 'beach',
    label: 'Tropical Beach',
    thumbnail: '/presets/beach.webp',
    description: 'Sunny beach with white sand and blurred turquoise ocean waves',
    promptTemplate:
      'Sunny outdoor product photography of the product set on fine warm white sand at a tropical summer beach, blurred turquoise ocean waves and gentle bokeh in the background, bright natural golden hour sunlight, refreshing vacation commercial aesthetic. Crucial requirement: Keep the product\'s shape, label, text, colours, texture and logo exactly unchanged.',
  },
  {
    id: 'studio_gradient',
    label: 'Studio Gradient',
    thumbnail: '/presets/studio_gradient.webp',
    description: 'Minimal pastel studio background with soft studio rim lighting',
    promptTemplate:
      'High-end studio commercial product photography of the product centered on a smooth matte pedestal with an elegant neutral pastel gradient backdrop, professional three-point softbox studio lighting, clean soft ground reflection. Crucial requirement: Keep the product\'s shape, label, text, colours, texture and logo exactly unchanged.',
  },
  {
    id: 'festive',
    label: 'Festive Holiday',
    thumbnail: '/presets/festive.webp',
    description: 'Holiday celebration setting with twinkling lights and gold accents',
    promptTemplate:
      'Festive holiday marketing product shot of the product surrounded by subtle golden ribbons, pine cones, and warm sparkling out-of-focus fairy bokeh lights, sophisticated celebration atmosphere. Crucial requirement: Keep the product\'s shape, label, text, colours, texture and logo exactly unchanged.',
  },
] as const;

export interface ExportPreset {
  id: string;
  label: string;
  width: number;
  height: number;
  fit: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  background: 'keep' | 'white' | 'transparent';
  description: string;
}

export const EXPORT_PRESETS: readonly ExportPreset[] = [
  {
    id: 'instagram_post',
    label: 'Instagram Post (1:1)',
    width: 1080,
    height: 1080,
    fit: 'contain',
    background: 'keep',
    description: 'Square feed post, 1080 × 1080',
  },
  {
    id: 'instagram_story',
    label: 'Instagram Story (9:16)',
    width: 1080,
    height: 1920,
    fit: 'contain',
    background: 'keep',
    description: 'Vertical story / reels format, 1080 × 1920 with padding',
  },
  {
    id: 'amazon_main',
    label: 'Amazon Main Image',
    width: 2000,
    height: 2000,
    fit: 'contain',
    background: 'white',
    description: 'Amazon compliant pure white (#ffffff) background, product filling ~85%',
  },
  {
    id: 'shopify',
    label: 'Shopify Product Card',
    width: 2048,
    height: 2048,
    fit: 'contain',
    background: 'keep',
    description: 'High-res square store listing, 2048 × 2048',
  },
  {
    id: 'web_banner',
    label: 'Web Banner (16:5)',
    width: 1920,
    height: 600,
    fit: 'cover',
    background: 'keep',
    description: 'Hero landscape banner for store headers, 1920 × 600',
  },
] as const;

export const CREDIT_COSTS = {
  remove_bg: 1,
  scene: 4,
  edit: 1,
  upscale: 2,
  copy: 1,
  describe: 0,
} as const;

export const DEFAULT_SIGNUP_CREDITS = 30;
