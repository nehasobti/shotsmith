import { del } from '@vercel/blob';

/**
 * Safely delete blob assets from Vercel Blob storage.
 * If running locally without a BLOB_READ_WRITE_TOKEN or on external URLs, fails gracefully.
 */
export async function deleteBlobs(urls: (string | undefined | null)[]): Promise<void> {
  const validUrls = urls.filter((url): url is string => Boolean(url && url.startsWith('http')));
  if (validUrls.length === 0) return;

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.warn('[blob] Skipping Vercel Blob deletion: BLOB_READ_WRITE_TOKEN is not configured.');
    return;
  }

  try {
    // Only attempt deletion for Vercel Blob hosted files
    const blobStoreUrls = validUrls.filter(
      (url) => url.includes('.public.blob.vercel-storage.com') || url.includes('.blob.vercel-storage.com')
    );

    if (blobStoreUrls.length > 0) {
      await del(blobStoreUrls, { token });
    }
  } catch (error) {
    console.error('[blob] Failed to delete blobs from storage:', error);
  }
}
