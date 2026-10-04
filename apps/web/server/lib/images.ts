import sharp from 'sharp';
import type { ExportPreset } from '@shopshot/shared';

export async function processImageForPreset(
  inputBuffer: Buffer,
  preset: ExportPreset
): Promise<{ buffer: Buffer; filename: string }> {
  const { id, width, height, background } = preset;

  let pipeline = sharp(inputBuffer);

  if (id === 'amazon_main') {
    // Amazon Main: 2000x2000, pure white (#ffffff), product fills ~85% (1700px)
    const innerSize = Math.round(width * 0.85);
    const inner = await sharp(inputBuffer)
      .resize(innerSize, innerSize, { fit: 'inside' })
      .toBuffer();

    const padding = Math.floor((width - innerSize) / 2);

    pipeline = sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    }).composite([
      {
        input: inner,
        gravity: 'centre',
      },
    ]);

    const buffer = await pipeline.jpeg({ quality: 95 }).toBuffer();
    return { buffer, filename: `${id}.jpg` };
  }

  if (id === 'web_banner') {
    // Web Banner: 1920x600 cropped cover
    const buffer = await pipeline
      .resize(width, height, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 92 })
      .toBuffer();
    return { buffer, filename: `${id}.jpg` };
  }

  // Instagram Post, Story, Shopify
  const isPadded = background === 'white';
  const bgOpt = isPadded
    ? { r: 255, g: 255, b: 255, alpha: 1 }
    : { r: 0, g: 0, b: 0, alpha: 0 };

  const buffer = await pipeline
    .resize(width, height, {
      fit: 'contain',
      background: bgOpt,
    })
    .png({ quality: 95 })
    .toBuffer();

  return { buffer, filename: `${id}.png` };
}
