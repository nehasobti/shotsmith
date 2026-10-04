<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import {
  Images,
  ArrowLeft,
  Sparkles,
  FileText,
  Heart,
  Download,
  Trash2,
  ExternalLink,
  Eye,
  CheckSquare,
  Square,
  UploadCloud,
  Loader2,
  Archive,
  CheckCircle2,
  AlertCircle,
  X,
  PackageCheck,
} from 'lucide-vue-next';
import { useUpload } from '~/composables/useUpload';
import { EXPORT_PRESETS, type ExportPreset } from '@shopshot/shared';

interface Asset {
  id: string;
  blobUrl: string;
  kind: string;
  isFavorite?: boolean;
  width?: number;
  height?: number;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
}

const route = useRoute();
const projectId = computed(() => route.params.id as string);

const project = ref<Project | null>(null);
const assetsList = ref<Asset[]>([]);
const isLoading = ref(true);
const selectedKindFilter = ref<string>('all');
const showFavoritesOnly = ref(false);
const previewAsset = ref<Asset | null>(null);

// Multi-select and Export state
const isSelectionMode = ref(false);
const selectedAssetIds = ref<string[]>([]);
const showExportModal = ref(false);
const isExporting = ref(false);
const selectedPresetIds = ref<string[]>(['instagram_post', 'amazon_main', 'shopify']);
const toastMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null);

const { isUploading, uploadProductPhoto } = useUpload();

const showToast = (type: 'success' | 'error', text: string) => {
  toastMessage.value = { type, text };
  setTimeout(() => {
    toastMessage.value = null;
  }, 4000);
};

const fetchGallery = async () => {
  isLoading.value = true;
  try {
    const [projRes, assetsRes] = await Promise.all([
      $fetch<{ project: Project }>(`/api/projects/${projectId.value}`),
      $fetch<{ assets: Asset[] }>(`/api/projects/${projectId.value}/assets`),
    ]);
    project.value = projRes.project;
    assetsList.value = assetsRes.assets;
  } catch (err) {
    console.error('Failed to load gallery', err);
  } finally {
    isLoading.value = false;
  }
};

const filteredAssets = computed(() => {
  return assetsList.value.filter((asset) => {
    if (selectedKindFilter.value !== 'all' && asset.kind !== selectedKindFilter.value) {
      return false;
    }
    if (showFavoritesOnly.value && !asset.isFavorite) {
      return false;
    }
    return true;
  });
});

const toggleSelectAsset = (assetId: string) => {
  if (selectedAssetIds.value.includes(assetId)) {
    selectedAssetIds.value = selectedAssetIds.value.filter((id) => id !== assetId);
  } else {
    selectedAssetIds.value.push(assetId);
  }
};

const selectAllVisible = () => {
  selectedAssetIds.value = filteredAssets.value.map((a) => a.id);
};

const clearSelection = () => {
  selectedAssetIds.value = [];
  isSelectionMode.value = false;
};

const handleToggleFavorite = async (asset: Asset) => {
  const targetState = !asset.isFavorite;
  try {
    await $fetch(`/api/assets/${asset.id}`, {
      method: 'PATCH',
      body: { is_favorite: targetState },
    });
    asset.isFavorite = targetState;
  } catch (err) {
    console.error('Failed to toggle favorite', err);
  }
};

const handleDeleteAsset = async (assetId: string) => {
  if (!confirm('Are you sure you want to delete this asset?')) return;
  try {
    await $fetch(`/api/assets/${assetId}`, { method: 'DELETE' });
    assetsList.value = assetsList.value.filter((a) => a.id !== assetId);
    selectedAssetIds.value = selectedAssetIds.value.filter((id) => id !== assetId);
    if (previewAsset.value?.id === assetId) previewAsset.value = null;
  } catch (err) {
    console.error('Failed to delete asset', err);
  }
};

const handleUploadFile = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    try {
      await uploadProductPhoto(target.files[0], projectId.value);
      await fetchGallery();
      showToast('success', 'Photo uploaded to project gallery!');
    } catch (err: any) {
      showToast('error', err?.message || 'Upload failed');
    }
    target.value = '';
  }
};

// Export ZIP Bundle
const handleDownloadZip = async () => {
  if (selectedAssetIds.value.length === 0 || selectedPresetIds.value.length === 0) {
    showToast('error', 'Select at least one image and one preset format.');
    return;
  }

  isExporting.value = true;
  try {
    const res = await $fetch<{ downloadUrl: string; filename: string; totalFiles: number }>('/api/exports', {
      method: 'POST',
      body: {
        assetIds: selectedAssetIds.value,
        presetIds: selectedPresetIds.value,
      },
    });

    // Trigger instant browser download
    const link = document.createElement('a');
    link.href = res.downloadUrl;
    link.download = res.filename || 'shopshot_export.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('success', `Export bundle ready! (${res.totalFiles} images packaged in ZIP)`);
    showExportModal.value = false;
  } catch (err: any) {
    showToast('error', err?.data?.error?.message || err?.message || 'Export failed.');
  } finally {
    isExporting.value = false;
  }
};

const getKindBadge = (kind: string) => {
  switch (kind) {
    case 'original':
      return { label: 'Original', class: 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/20' };
    case 'cutout':
      return { label: 'Cut-out', class: 'bg-sky-500/15 text-sky-400 border border-sky-500/20' };
    case 'scene':
      return { label: 'Scene', class: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' };
    case 'edit':
      return { label: 'Magic Edit', class: 'bg-purple-500/15 text-purple-400 border border-purple-500/20' };
    case 'upscale':
      return { label: 'Upscale', class: 'bg-amber-500/15 text-amber-400 border border-amber-500/20' };
    default:
      return { label: kind, class: 'bg-muted text-muted-foreground' };
  }
};

onMounted(fetchGallery);
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
    <!-- Header -->
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/80">
      <div class="flex items-center gap-4">
        <NuxtLink
          :to="`/projects/${projectId}`"
          class="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all border border-border/60 hover:border-border"
          title="Return to Studio"
        >
          <ArrowLeft class="h-4 w-4" />
        </NuxtLink>

        <div>
          <h1 class="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <span>{{ project?.name || 'Project' }} Gallery</span>
          </h1>
          <p class="text-xs text-muted-foreground mt-0.5 font-mono">
            {{ assetsList.length }} total generated visual assets
          </p>
        </div>
      </div>

      <!-- Navigation tabs -->
      <div class="flex items-center gap-1 bg-muted/60 p-1.5 rounded-2xl text-xs font-bold border border-border/60">
        <NuxtLink
          :to="`/projects/${projectId}`"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all text-muted-foreground hover:text-foreground"
        >
          <Sparkles class="h-3.5 w-3.5" />
          <span>Studio</span>
        </NuxtLink>

        <NuxtLink
          :to="`/projects/${projectId}/gallery`"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all bg-card text-foreground shadow-xs font-black"
        >
          <Images class="h-3.5 w-3.5 text-primary" />
          <span>Gallery</span>
        </NuxtLink>

        <NuxtLink
          :to="`/projects/${projectId}/copy`"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all text-muted-foreground hover:text-foreground"
        >
          <FileText class="h-3.5 w-3.5" />
          <span>Ad Copy</span>
        </NuxtLink>
      </div>
    </header>

    <!-- Toast Notification -->
    <div
      v-if="toastMessage"
      class="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold transition-all"
      :class="toastMessage.type === 'success' ? 'bg-zinc-900 text-white border-emerald-500/40' : 'bg-destructive text-destructive-foreground border-destructive'"
    >
      <CheckCircle2 v-if="toastMessage.type === 'success'" class="h-4 w-4 text-emerald-400" />
      <AlertCircle v-else class="h-4 w-4" />
      <span>{{ toastMessage.text }}</span>
    </div>

    <!-- Filter & Action Bar -->
    <div class="flex flex-wrap items-center justify-between gap-4 bg-card/80 backdrop-blur-md p-3 rounded-2xl border border-border/80 shadow-xs">
      <!-- Kind filters -->
      <div class="flex flex-wrap items-center gap-1.5 text-xs">
        <button
          v-for="filter in [
            { id: 'all', label: 'All' },
            { id: 'original', label: 'Originals' },
            { id: 'cutout', label: 'Cut-outs' },
            { id: 'scene', label: 'Scenes' },
            { id: 'edit', label: 'Magic Edits' },
            { id: 'upscale', label: 'Upscales' },
          ]"
          :key="filter.id"
          type="button"
          @click="selectedKindFilter = filter.id"
          class="px-3 py-1.5 rounded-xl font-bold transition-all text-xs"
          :class="selectedKindFilter === filter.id ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'"
        >
          {{ filter.label }}
        </button>
      </div>

      <!-- Multi-select & Batch Actions -->
      <div class="flex items-center gap-2.5">
        <!-- Multi-select Toggle -->
        <button
          type="button"
          @click="isSelectionMode = !isSelectionMode; if (!isSelectionMode) selectedAssetIds = []"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all"
          :class="isSelectionMode ? 'bg-primary/10 border-primary text-primary' : 'border-border/80 text-muted-foreground hover:text-foreground'"
        >
          <CheckSquare class="h-3.5 w-3.5" />
          <span>{{ isSelectionMode ? 'Cancel Selection' : 'Select Images' }}</span>
        </button>

        <!-- Export ZIP Button (When items selected) -->
        <button
          v-if="selectedAssetIds.length > 0"
          type="button"
          @click="showExportModal = true"
          class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
        >
          <Archive class="h-3.5 w-3.5" />
          <span>Export ZIP ({{ selectedAssetIds.length }})</span>
        </button>

        <button
          type="button"
          @click="showFavoritesOnly = !showFavoritesOnly"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all"
          :class="showFavoritesOnly ? 'border-rose-500 bg-rose-500/10 text-rose-500 shadow-xs' : 'border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/40'"
        >
          <Heart class="h-3.5 w-3.5" :class="showFavoritesOnly ? 'fill-rose-500' : ''" />
          <span>Favorites</span>
        </button>

        <label
          class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold cursor-pointer transition-all shadow-md shadow-violet-500/20"
        >
          <Loader2 v-if="isUploading" class="h-3.5 w-3.5 animate-spin" />
          <UploadCloud v-else class="h-3.5 w-3.5" />
          <span>Upload</span>
          <input
            type="file"
            class="hidden"
            accept="image/jpeg,image/png,image/webp"
            :disabled="isUploading"
            @change="handleUploadFile"
          />
        </label>
      </div>
    </div>

    <!-- Selection Bar if active -->
    <div
      v-if="isSelectionMode"
      class="bg-muted/60 border border-primary/30 p-2.5 rounded-2xl flex items-center justify-between text-xs font-bold"
    >
      <div class="flex items-center gap-2">
        <span class="text-primary">{{ selectedAssetIds.length }} images selected</span>
        <button
          type="button"
          @click="selectAllVisible"
          class="px-2 py-0.5 rounded-lg bg-card border border-border text-foreground hover:bg-muted text-[11px]"
        >
          Select All Visible
        </button>
        <button
          type="button"
          @click="clearSelection"
          class="px-2 py-0.5 rounded-lg bg-card border border-border text-muted-foreground hover:bg-muted text-[11px]"
        >
          Clear
        </button>
      </div>

      <button
        type="button"
        @click="showExportModal = true"
        :disabled="selectedAssetIds.length === 0"
        class="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary text-white text-xs font-bold disabled:opacity-50"
      >
        <Archive class="h-3.5 w-3.5" />
        <span>Configure Marketplace ZIP</span>
      </button>
    </div>

    <!-- Gallery Grid -->
    <div v-if="isLoading" class="py-24 text-center">
      <Loader2 class="h-9 w-9 animate-spin text-primary mx-auto mb-2" />
      <p class="text-xs font-bold text-muted-foreground">Loading visual gallery...</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="filteredAssets.length === 0"
      class="py-20 text-center rounded-3xl border border-dashed border-border/80 bg-card/40"
    >
      <div class="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-3">
        <Images class="h-6 w-6 text-muted-foreground/60" />
      </div>
      <h3 class="text-base font-bold text-foreground">No assets found</h3>
      <p class="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
        {{ showFavoritesOnly ? 'No favorite assets match the current filter.' : 'Upload photos in the Studio or run generative AI tools to populate this gallery.' }}
      </p>
    </div>

    <!-- Image Cards Grid -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
      <div
        v-for="asset in filteredAssets"
        :key="asset.id"
        @click="isSelectionMode ? toggleSelectAsset(asset.id) : (previewAsset = asset)"
        class="group relative rounded-3xl border border-border/80 bg-card overflow-hidden transition-all hover:shadow-xl flex flex-col cursor-pointer"
        :class="selectedAssetIds.includes(asset.id) ? 'border-primary ring-2 ring-primary/50' : 'hover:border-primary/50'"
      >
        <!-- Selection Checkbox -->
        <div
          v-if="isSelectionMode"
          class="absolute top-2.5 left-2.5 z-20"
          @click.stop="toggleSelectAsset(asset.id)"
        >
          <div
            class="w-6 h-6 rounded-lg flex items-center justify-center transition-all shadow-md"
            :class="selectedAssetIds.includes(asset.id) ? 'bg-primary text-white' : 'bg-black/60 text-white/70 border border-white/30'"
          >
            <CheckSquare v-if="selectedAssetIds.includes(asset.id)" class="h-4 w-4" />
            <Square v-else class="h-4 w-4" />
          </div>
        </div>

        <!-- Thumbnail preview with checkerboard background -->
        <div class="aspect-square w-full bg-zinc-950 relative overflow-hidden bg-checkerboard flex items-center justify-center">
          <img
            :src="asset.blobUrl"
            :alt="asset.kind"
            class="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />

          <!-- Kind badge -->
          <div v-if="!isSelectionMode" class="absolute top-2.5 left-2.5 pointer-events-none">
            <span
              class="text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md shadow-xs"
              :class="getKindBadge(asset.kind).class"
            >
              {{ getKindBadge(asset.kind).label }}
            </span>
          </div>

          <!-- Favorite toggle -->
          <button
            type="button"
            @click.stop="handleToggleFavorite(asset)"
            class="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-background/80 backdrop-blur-md hover:bg-background text-muted-foreground hover:text-rose-500 transition-all shadow-sm z-10"
          >
            <Heart
              class="h-3.5 w-3.5"
              :class="asset.isFavorite ? 'fill-rose-500 text-rose-500' : ''"
            />
          </button>
        </div>

        <!-- Footer details -->
        <div class="p-3.5 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/80 bg-card">
          <span class="font-mono font-medium">
            {{ asset.width && asset.height ? `${asset.width}×${asset.height}` : 'Image' }}
          </span>

          <div class="flex items-center gap-1">
            <NuxtLink
              :to="`/projects/${projectId}`"
              class="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Open in Studio"
              @click.stop
            >
              <Sparkles class="h-3.5 w-3.5 text-primary" />
            </NuxtLink>

            <button
              type="button"
              @click.stop="handleDeleteAsset(asset.id)"
              class="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Delete asset"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Export ZIP Configuration Modal -->
    <div
      v-if="showExportModal"
      class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
      @click.self="showExportModal = false"
    >
      <div class="relative max-w-lg w-full bg-card rounded-3xl border border-border p-6 shadow-2xl space-y-5">
        <div class="flex items-center justify-between pb-3 border-b border-border/80">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Archive class="h-4 w-4" />
            </div>
            <div>
              <h3 class="text-sm font-extrabold text-foreground">Marketplace ZIP Export</h3>
              <p class="text-[11px] text-muted-foreground">High-precision Sharp batch processor</p>
            </div>
          </div>

          <button
            type="button"
            @click="showExportModal = false"
            class="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <div class="space-y-3">
          <label class="block text-xs font-bold text-foreground">
            Select Output Formats ({{ selectedPresetIds.length }} selected):
          </label>

          <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
            <div
              v-for="preset in EXPORT_PRESETS"
              :key="preset.id"
              @click="
                selectedPresetIds.includes(preset.id)
                  ? (selectedPresetIds = selectedPresetIds.filter((p) => p !== preset.id))
                  : selectedPresetIds.push(preset.id)
              "
              class="p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between"
              :class="selectedPresetIds.includes(preset.id) ? 'border-primary bg-primary/10 shadow-xs' : 'border-border bg-card hover:border-primary/40'"
            >
              <div class="min-w-0 pr-2">
                <div class="text-xs font-bold text-foreground flex items-center gap-2">
                  <span>{{ preset.label }}</span>
                  <span class="text-[10px] font-mono font-normal text-muted-foreground">({{ preset.width }}×{{ preset.height }})</span>
                </div>
                <div class="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{{ preset.description }}</div>
              </div>

              <div
                class="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
                :class="selectedPresetIds.includes(preset.id) ? 'bg-primary text-white' : 'border border-border'"
              >
                <PackageCheck v-if="selectedPresetIds.includes(preset.id)" class="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>

        <div class="pt-2 flex items-center justify-between border-t border-border/80">
          <span class="text-xs text-muted-foreground font-mono">
            {{ selectedAssetIds.length }} images × {{ selectedPresetIds.length }} presets = {{ selectedAssetIds.length * selectedPresetIds.length }} files
          </span>

          <button
            type="button"
            @click="handleDownloadZip"
            :disabled="isExporting || selectedPresetIds.length === 0"
            class="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/25"
          >
            <Loader2 v-if="isExporting" class="h-4 w-4 animate-spin" />
            <Download v-else class="h-4 w-4" />
            <span>{{ isExporting ? 'Packaging ZIP...' : 'Download ZIP Bundle' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Lightbox Modal -->
    <div
      v-if="previewAsset"
      class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
      @click.self="previewAsset = null"
    >
      <div class="relative max-w-4xl w-full bg-card rounded-3xl border border-border p-4 shadow-2xl flex flex-col max-h-[92vh]">
        <div class="flex items-center justify-between pb-3 border-b border-border/80">
          <div class="flex items-center gap-2.5">
            <span
              class="text-xs font-bold px-2.5 py-0.5 rounded-full"
              :class="getKindBadge(previewAsset.kind).class"
            >
              {{ getKindBadge(previewAsset.kind).label }}
            </span>
            <span class="text-xs font-mono text-muted-foreground">
              {{ previewAsset.width && previewAsset.height ? `${previewAsset.width}×${previewAsset.height} px` : '' }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <a
              :href="previewAsset.blobUrl"
              target="_blank"
              download
              class="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Download"
            >
              <Download class="h-4 w-4" />
            </a>
            <button
              type="button"
              @click="previewAsset = null"
              class="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X class="h-4 w-4" />
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-hidden flex items-center justify-center p-4 bg-zinc-950/60 bg-checkerboard rounded-2xl my-2">
          <img
            :src="previewAsset.blobUrl"
            :alt="previewAsset.kind"
            class="max-h-[72vh] object-contain rounded-xl shadow-2xl drop-shadow-2xl"
          />
        </div>
      </div>
    </div>
  </div>
</template>
