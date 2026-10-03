import { ref } from 'vue';
import { upload } from '@vercel/blob/client';

export interface UploadResult {
  assetId: string;
  blobUrl: string;
  width?: number;
  height?: number;
}

export function useUpload() {
  const isUploading = ref(false);
  const uploadProgress = ref(0);
  const uploadError = ref<string | null>(null);

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        resolve({ width: 1024, height: 1024 });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadProductPhoto = async (
    file: File,
    projectId: string
  ): Promise<UploadResult> => {
    isUploading.value = true;
    uploadProgress.value = 10;
    uploadError.value = null;

    try {
      // 1. Validation
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Please upload a valid image file (JPG, PNG, or WebP).');
      }

      const maxSize = 10 * 1024 * 1024; // 10 MB
      if (file.size > maxSize) {
        throw new Error('Image file size exceeds the 10 MB limit.');
      }

      uploadProgress.value = 30;
      const { width, height } = await getImageDimensions(file);

      // 2. Try Vercel Blob client upload
      try {
        uploadProgress.value = 60;
        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/uploads',
          clientPayload: JSON.stringify({ projectId }),
        });

        uploadProgress.value = 90;

        // Fetch assets to locate the newly created asset
        const data = await $fetch<{ assets: any[] }>(`/api/projects/${projectId}/assets`);
        const createdAsset = data.assets.find((a) => a.blobUrl === blob.url) || data.assets[0];

        uploadProgress.value = 100;
        return {
          assetId: createdAsset?.id,
          blobUrl: blob.url,
          width,
          height,
        };
      } catch (blobErr: any) {
        // Fallback for local development or when Vercel Blob store is not configured
        console.warn('Vercel Blob upload fallback initiated:', blobErr?.message);
        uploadProgress.value = 75;

        // Convert to data URL for local display & create asset row
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await $fetch<{ asset: any }>('/api/uploads', {
          method: 'POST',
          body: {
            mode: 'direct_upload',
            projectId,
            blobUrl: dataUrl,
            blobPathname: `local/${file.name}`,
            width,
            height,
            mimeType: file.type,
            sizeBytes: file.size,
          },
        });

        uploadProgress.value = 100;
        return {
          assetId: res.asset.id,
          blobUrl: res.asset.blobUrl,
          width,
          height,
        };
      }
    } catch (err: any) {
      uploadError.value = err?.message || 'Failed to upload photo.';
      throw err;
    } finally {
      isUploading.value = false;
    }
  };

  return {
    isUploading,
    uploadProgress,
    uploadError,
    uploadProductPhoto,
  };
}
