<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import Canvas from '~/components/studio/Canvas.vue';
import ToolPanel from '~/components/studio/ToolPanel.vue';
import ResultsStrip from '~/components/studio/ResultsStrip.vue';
import { useUpload } from '~/composables/useUpload';
import { useCredits } from '~/composables/useCredits';
import { useJobs } from '~/composables/useJobs';
import {
  Sparkles,
  ArrowLeft,
  Images,
  FileText,
  UploadCloud,
  Loader2,
  Clock,
  AlertCircle,
  CheckCircle2,
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
const toastMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null);

const { isUploading, uploadProductPhoto } = useUpload();
const { balance, fetchCredits } = useCredits();
const { isJobRunning, activeJob, elapsedSeconds, jobError, startJob, pollJobUntilDone } = useJobs();

// The original asset for this project (used for Before/After compare)
const originalAsset = computed(() => {
  return assetsList.value.find((a) => a.kind === 'original') || assetsList.value[assetsList.value.length - 1] || null;
});

const showToast = (type: 'success' | 'error', text: string) => {
  toastMessage.value = { type, text };
  setTimeout(() => {
    toastMessage.value = null;
  }, 5000);
};

const fetchProjectDetails = async () => {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    const data = await $fetch<{ project: Project; assets: Asset[] }>(`/api/projects/${projectId.value}`);
    project.value = data.project;
    assetsList.value = data.assets;

    if (data.assets.length > 0) {
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
    showToast('success', 'Original product photo uploaded!');
  } catch (err: any) {
    showToast('error', err?.message || 'Upload failed');
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

// Phase 3: Trigger Background Removal Job
const expectedVariations = ref(1);

const handleStartRemoveBg = async () => {
  if (!activeAsset.value) return;
  expectedVariations.value = 1;

  try {
    const { job, remainingCredits } = await startJob({
      projectId: projectId.value,
      sourceAssetId: activeAsset.value.id,
      type: 'remove_bg',
    });

    if (balance.value !== null) {
      balance.value = remainingCredits;
    }

    showToast('success', 'Background removal job started!');

    pollJobUntilDone(job.id, {
      onSuccess: async (newAssets) => {
        await fetchProjectDetails();
        await fetchCredits();
        if (newAssets.length > 0) {
          activeAsset.value = newAssets[0];
        }
        showToast('success', 'Transparent cut-out generated successfully!');
      },
      onError: async (errMsg) => {
        await fetchCredits();
        showToast('error', errMsg);
      },
    });
  } catch (err: any) {
    showToast('error', err?.data?.error?.message || err?.message || 'Failed to start background removal');
  }
};

const handleStartScene = async (payload: { presetId?: string; prompt?: string; variationCount: number }) => {
  if (!activeAsset.value) return;
  expectedVariations.value = payload.variationCount;

  try {
    const { job, remainingCredits } = await startJob({
      projectId: projectId.value,
      sourceAssetId: activeAsset.value.id,
      type: 'scene',
      params: {
        presetId: payload.presetId,
        prompt: payload.prompt,
        variationCount: payload.variationCount,
      },
    });

    if (balance.value !== null) {
      balance.value = remainingCredits;
    }

    showToast('success', `Generating ${payload.variationCount} scene variations...`);

    pollJobUntilDone(job.id, {
      onSuccess: async (newAssets) => {
        await fetchProjectDetails();
        await fetchCredits();
        if (newAssets.length > 0) {
          activeAsset.value = newAssets[0];
        }
        showToast('success', 'Scene variations generated successfully!');
      },
      onError: async (errMsg) => {
        await fetchCredits();
        showToast('error', errMsg);
      },
    });
  } catch (err: any) {
    showToast('error', err?.data?.error?.message || err?.message || 'Failed to start scene generation');
  }
};

const handleStartMagicEdit = async (payload: { instruction: string; maskUrl?: string }) => {
  if (!activeAsset.value) return;
  expectedVariations.value = 1;

  try {
    const { job, remainingCredits } = await startJob({
      projectId: projectId.value,
      sourceAssetId: activeAsset.value.id,
      type: 'edit',
      params: {
        instruction: payload.instruction,
        maskUrl: payload.maskUrl,
      },
    });

    if (balance.value !== null) {
      balance.value = remainingCredits;
    }

    showToast('success', 'Magic edit job in progress...');

    pollJobUntilDone(job.id, {
      onSuccess: async (newAssets) => {
        await fetchProjectDetails();
        await fetchCredits();
        if (newAssets.length > 0) {
          activeAsset.value = newAssets[0];
        }
        showToast('success', 'Magic edit completed successfully!');
      },
      onError: async (errMsg) => {
        await fetchCredits();
        showToast('error', errMsg);
      },
    });
  } catch (err: any) {
    showToast('error', err?.data?.error?.message || err?.message || 'Failed to start magic edit');
  }
};

const handleStartUpscale = async (payload: { scale: 2 | 4 }) => {
  if (!activeAsset.value) return;
  expectedVariations.value = 1;

  try {
    const { job, remainingCredits } = await startJob({
      projectId: projectId.value,
      sourceAssetId: activeAsset.value.id,
      type: 'upscale',
      params: {
        scale: payload.scale,
      },
    });

    if (balance.value !== null) {
      balance.value = remainingCredits;
    }

    showToast('success', `Upscaling image ${payload.scale}×...`);

    pollJobUntilDone(job.id, {
      onSuccess: async (newAssets) => {
        await fetchProjectDetails();
        await fetchCredits();
        if (newAssets.length > 0) {
          activeAsset.value = newAssets[0];
        }
        showToast('success', `Image upscaled ${payload.scale}× successfully!`);
      },
      onError: async (errMsg) => {
        await fetchCredits();
        showToast('error', errMsg);
      },
    });
  } catch (err: any) {
    showToast('error', err?.data?.error?.message || err?.message || 'Failed to start upscale');
  }
};

onMounted(async () => {
  await Promise.all([fetchCredits(), fetchProjectDetails()]);
});
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background">
    <!-- Studio Sub-Header -->
    <header class="h-16 border-b border-border/80 bg-card/60 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-4 min-w-0">
        <NuxtLink
          to="/projects"
          class="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all border border-border/60 hover:border-border"
          title="Return to Projects"
        >
          <ArrowLeft class="h-4 w-4" />
        </NuxtLink>

        <div class="min-w-0">
          <div class="flex items-center gap-2.5">
            <h1 class="text-sm font-extrabold text-foreground truncate tracking-tight">
              {{ project?.name || 'Studio Session' }}
            </h1>
            <span
              v-if="activeAsset"
              class="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
            >
              {{ activeAsset.kind }}
            </span>
          </div>
          <p v-if="project?.productDescription" class="text-[11px] text-muted-foreground truncate max-w-xs sm:max-w-md">
            {{ project.productDescription }}
          </p>
        </div>
      </div>

      <!-- Navigation tabs between Studio, Gallery, and Ad Copy -->
      <div class="flex items-center gap-1 bg-muted/60 p-1.5 rounded-2xl text-xs font-bold border border-border/60">
        <NuxtLink
          :to="`/projects/${projectId}`"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all"
          active-class="bg-card text-foreground shadow-xs font-black"
        >
          <Sparkles class="h-3.5 w-3.5 text-primary" />
          <span>Studio</span>
        </NuxtLink>

        <NuxtLink
          :to="`/projects/${projectId}/gallery`"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all text-muted-foreground hover:text-foreground"
          active-class="!bg-card !text-foreground shadow-xs !font-black"
        >
          <Images class="h-3.5 w-3.5" />
          <span>Gallery</span>
        </NuxtLink>

        <NuxtLink
          :to="`/projects/${projectId}/copy`"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all text-muted-foreground hover:text-foreground"
          active-class="!bg-card !text-foreground shadow-xs !font-black"
        >
          <FileText class="h-3.5 w-3.5" />
          <span>Ad Copy</span>
        </NuxtLink>
      </div>

      <!-- Quick Upload Action & Job Status Pill -->
      <div class="flex items-center gap-3">
        <!-- Running Job Live Indicator -->
        <div
          v-if="isJobRunning"
          class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold animate-pulse"
        >
          <Loader2 class="h-3.5 w-3.5 animate-spin" />
          <span>Processing ({{ elapsedSeconds }}s)</span>
        </div>

        <label
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold cursor-pointer transition-all shadow-md shadow-violet-500/20 hover:scale-[1.02]"
        >
          <UploadCloud class="h-4 w-4" />
          <span class="hidden sm:inline">Upload Photo</span>
          <input
            type="file"
            class="hidden"
            accept="image/jpeg,image/png,image/webp"
            @change="handleFileInputChange"
          />
        </label>
      </div>
    </header>

    <!-- Floating Toast Notification -->
    <div
      v-if="toastMessage"
      class="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold transition-all"
      :class="toastMessage.type === 'success' ? 'bg-zinc-900 text-white border-emerald-500/40' : 'bg-destructive text-destructive-foreground border-destructive'"
    >
      <CheckCircle2 v-if="toastMessage.type === 'success'" class="h-4 w-4 text-emerald-400" />
      <AlertCircle v-else class="h-4 w-4" />
      <span>{{ toastMessage.text }}</span>
    </div>

    <!-- Main Workspace Area: Tools Left, Canvas Center, Results Right -->
    <div class="flex-1 p-2 sm:p-3 md:p-4 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row gap-3 min-h-0">
      <!-- Loading view -->
      <div v-if="isLoading" class="flex-1 flex flex-col items-center justify-center">
        <Loader2 class="h-9 w-9 animate-spin text-primary mb-3" />
        <p class="text-xs font-bold text-muted-foreground">Loading Studio Workspace...</p>
      </div>

      <!-- Error view -->
      <div v-else-if="errorMessage" class="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div class="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-3">
          !
        </div>
        <p class="text-sm font-bold text-destructive mb-2">{{ errorMessage }}</p>
        <NuxtLink to="/projects" class="text-xs text-primary underline font-bold">Return to projects hub</NuxtLink>
      </div>

      <!-- Studio Layout -->
      <template v-else>
        <!-- Left: Tool Panel -->
        <ToolPanel
          :has-active-asset="Boolean(activeAsset) && !isJobRunning"
          :user-credits="balance"
          @start-remove-bg="handleStartRemoveBg"
          @start-scene="handleStartScene"
          @start-magic-edit="handleStartMagicEdit"
          @start-upscale="handleStartUpscale"
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
          :is-running-job="isJobRunning"
          :expected-variations-count="expectedVariations"
          @select-asset="handleSelectAsset"
          @toggle-favorite="handleToggleFavorite"
        />
      </template>
    </div>
  </div>
</template>
