<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import Canvas from '~/components/studio/Canvas.vue';
import ToolPanel from '~/components/studio/ToolPanel.vue';
import ResultsStrip from '~/components/studio/ResultsStrip.vue';
import { useUpload } from '~/composables/useUpload';
import { useCredits } from '~/composables/useCredits';
import {
  Sparkles,
  ArrowLeft,
  FolderKanban,
  Images,
  FileText,
  UploadCloud,
  Loader2,
} from 'lucide-vue-next';

interface Asset {
  id: string;
  blobUrl: string;
  kind: string;
  isFavorite?: boolean;
  width?: number;
  height?: number;
  createdAt?: string;
}

interface Project {
  id: string;
  name: string;
  productDescription?: string | null;
  coverAssetId?: string | null;
}

const route = useRoute();
const projectId = computed(() => route.params.id as string);

const project = ref<Project | null>(null);
const assetsList = ref<Asset[]>([]);
const activeAsset = ref<Asset | null>(null);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);

const { isUploading, uploadProductPhoto } = useUpload();
const { balance, fetchCredits } = useCredits();

// The original asset for this project (used for Before/After compare)
const originalAsset = computed(() => {
  return assetsList.value.find((a) => a.kind === 'original') || assetsList.value[assetsList.value.length - 1] || null;
});

const fetchProjectDetails = async () => {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    const data = await $fetch<{ project: Project; assets: Asset[] }>(`/api/projects/${projectId.value}`);
    project.value = data.project;
    assetsList.value = data.assets;

    if (data.assets.length > 0) {
      // Default to latest asset if not currently selected
      if (!activeAsset.value || !data.assets.some((a) => a.id === activeAsset.value?.id)) {
        activeAsset.value = data.assets[0] || null;
      }
    }
  } catch (err: any) {
    errorMessage.value = err?.data?.message || err?.message || 'Failed to load project.';
  } finally {
    isLoading.value = false;
  }
};

const handleUploadFile = async (file: File) => {
  try {
    const res = await uploadProductPhoto(file, projectId.value);
    await fetchProjectDetails();
    if (res.assetId) {
      const created = assetsList.value.find((a) => a.id === res.assetId);
      if (created) activeAsset.value = created;
    }
  } catch (err: any) {
    alert(err?.message || 'Upload failed');
  }
};

const handleFileInputChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    handleUploadFile(target.files[0]);
    target.value = '';
  }
};

const handleSelectAsset = (asset: Asset) => {
  activeAsset.value = asset;
};

const handleToggleFavorite = async (assetId: string, currentFav: boolean) => {
  try {
    await $fetch(`/api/assets/${assetId}`, {
      method: 'PATCH',
      body: { is_favorite: currentFav },
    });
    const found = assetsList.value.find((a) => a.id === assetId);
    if (found) found.isFavorite = currentFav;
  } catch (err: any) {
    console.error('Failed to update favorite:', err);
  }
};

onMounted(async () => {
  await Promise.all([fetchCredits(), fetchProjectDetails()]);
});
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
    <!-- Studio Sub-Header -->
    <header class="h-14 border-b border-border bg-card/60 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-4 min-w-0">
        <NuxtLink
          to="/projects"
          class="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Back to Projects"
        >
          <ArrowLeft class="h-4 w-4" />
        </NuxtLink>

        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <h1 class="text-sm font-bold text-foreground truncate">
              {{ project?.name || 'Studio' }}
            </h1>
            <span
              v-if="activeAsset"
              class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
            >
              {{ activeAsset.kind }}
            </span>
          </div>
        </div>
      </div>

      <!-- Navigation tabs between Studio, Gallery, and Ad Copy -->
      <div class="flex items-center gap-1 bg-muted/60 p-1 rounded-xl text-xs font-semibold">
        <NuxtLink
          :to="`/projects/${projectId}`"
          class="flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all"
          active-class="bg-card text-foreground shadow-xs font-bold"
        >
          <Sparkles class="h-3.5 w-3.5 text-primary" />
          <span>Studio</span>
        </NuxtLink>

        <NuxtLink
          :to="`/projects/${projectId}/gallery`"
          class="flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all text-muted-foreground hover:text-foreground"
          active-class="!bg-card !text-foreground shadow-xs !font-bold"
        >
          <Images class="h-3.5 w-3.5" />
          <span>Gallery</span>
        </NuxtLink>

        <NuxtLink
          :to="`/projects/${projectId}/copy`"
          class="flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all text-muted-foreground hover:text-foreground"
          active-class="!bg-card !text-foreground shadow-xs !font-bold"
        >
          <FileText class="h-3.5 w-3.5" />
          <span>Ad Copy</span>
        </NuxtLink>
      </div>

      <!-- Quick Upload Action -->
      <div class="flex items-center gap-2">
        <label
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold cursor-pointer transition-colors border border-border"
        >
          <UploadCloud class="h-3.5 w-3.5" />
          <span class="hidden sm:inline">Upload New</span>
          <input
            type="file"
            class="hidden"
            accept="image/jpeg,image/png,image/webp"
            @change="handleFileInputChange"
          />
        </label>
      </div>
    </header>

    <!-- Main Workspace Area: Tools Left, Canvas Center, Results Right -->
    <div class="flex-1 p-3 sm:p-4 overflow-hidden flex flex-col lg:flex-row gap-3">
      <!-- Loading view -->
      <div v-if="isLoading" class="flex-1 flex flex-col items-center justify-center">
        <Loader2 class="h-8 w-8 animate-spin text-primary mb-2" />
        <p class="text-xs text-muted-foreground">Loading Studio...</p>
      </div>

      <!-- Error view -->
      <div v-else-if="errorMessage" class="flex-1 flex flex-col items-center justify-center text-center p-6">
        <p class="text-sm font-semibold text-destructive mb-2">{{ errorMessage }}</p>
        <NuxtLink to="/projects" class="text-xs text-primary underline">Return to projects</NuxtLink>
      </div>

      <!-- Studio Layout -->
      <template v-else>
        <!-- Left: Tool Panel -->
        <ToolPanel
          :has-active-asset="Boolean(activeAsset)"
          :user-credits="balance"
        />

        <!-- Center: Interactive Canvas with Pan/Zoom & Compare -->
        <Canvas
          :active-asset="activeAsset"
          :original-asset="originalAsset"
          :is-uploading="isUploading"
          @upload-file="handleUploadFile"
        />

        <!-- Right: Results Strip -->
        <ResultsStrip
          :assets="assetsList"
          :active-asset-id="activeAsset?.id || null"
          @select-asset="handleSelectAsset"
          @toggle-favorite="handleToggleFavorite"
        />
      </template>
    </div>
  </div>
</template>
