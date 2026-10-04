import { exportRequestSchema, EXPORT_PRESETS } from '@shopshot/shared';
import { requireUserSession } from '../utils/auth';
import { db, assets } from '../db';
import { inArray, and, eq } from 'drizzle-orm';
import { processImageForPreset } from '../lib/images';
import * as archiverPkg from 'archiver';
const archiver = (archiverPkg as any).default || archiverPkg;
import { put } from '@vercel/blob';

async function fetchImageBuffer(url: string): Promise<Buffer> {
  if (url.startsWith('data:')) {
    const parts = url.split(',');
    const base64Data = parts[1] || '';
    return Buffer.from(base64Data, 'base64');
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${url}: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const userId = session.user.id;

  const rawBody = await readBody(event);
  const parsed = exportRequestSchema.safeParse(rawBody);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid export options.',
        },
      },
    });
  }

  const { assetIds, presetIds } = parsed.data;

  // 1. Fetch assets owned by user
  const userAssets = await db
    .select()
    .from(assets)
    .where(and(inArray(assets.id, assetIds), eq(assets.userId, userId)));

  if (userAssets.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      data: { error: { code: 'NO_ASSETS_FOUND', message: 'No valid assets found for export.' } },
    });
  }

  const selectedPresets = EXPORT_PRESETS.filter((p) => presetIds.includes(p.id));
  if (selectedPresets.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: { error: { code: 'INVALID_PRESETS', message: 'No recognized export presets selected.' } },
    });
  }

  // 2. Setup Archiver zip stream
  const archive = archiver('zip', { zlib: { level: 9 } });
  const chunks: Buffer[] = [];

  archive.on('data', (chunk: Buffer) => {
    chunks.push(chunk);
  });

  const archivePromise = new Promise<Buffer>((resolve, reject) => {
    archive.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    archive.on('error', (err: any) => {
      reject(err);
    });
  });

  // 3. Process every image with selected presets
  let count = 0;
  for (let aIdx = 0; aIdx < userAssets.length; aIdx++) {
    const asset = userAssets[aIdx];
    if (!asset) continue;

    try {
      const sourceBuffer = await fetchImageBuffer(asset.blobUrl);

      for (const preset of selectedPresets) {
        try {
          const { buffer, filename } = await processImageForPreset(sourceBuffer, preset);
          const zipEntryName = `${preset.id}/asset_${aIdx + 1}_${filename}`;
          archive.append(buffer, { name: zipEntryName });
          count++;
        } catch (presetErr) {
          console.error(`Failed to process preset ${preset.id} for asset ${asset.id}:`, presetErr);
        }
      }
    } catch (fetchErr) {
      console.error(`Failed to fetch source image for asset ${asset.id}:`, fetchErr);
    }
  }

  await archive.finalize();
  const zipBuffer = await archivePromise;

  // 4. Upload to Vercel Blob or provide direct Data URL fallback
  const timestamp = Date.now();
  const filename = `shopshot_export_${timestamp}.zip`;
  let downloadUrl = '';

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    try {
      const blob = await put(`users/${userId}/exports/${filename}`, zipBuffer, {
        access: 'public',
        contentType: 'application/zip',
        token,
      });
      downloadUrl = blob.url;
    } catch (blobErr) {
      console.warn('Vercel Blob upload failed, falling back to data URL:', blobErr);
      downloadUrl = `data:application/zip;base64,${zipBuffer.toString('base64')}`;
    }
  } else {
    downloadUrl = `data:application/zip;base64,${zipBuffer.toString('base64')}`;
  }

  return {
    downloadUrl,
    filename,
    totalFiles: count,
  };
});
