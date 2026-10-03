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
  Filter,
  X,
  UploadCloud,
  Loader2,
  Layers,
} from 'lucide-vue-next';
import { useUpload } from '~/composables/useUpload';

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

const { isUploading, uploadProductPhoto } = useUpload();

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
    } catch (err: any) {
      alert(err?.message || 'Upload failed');
    }
    target.value = '';
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

    <!-- Filter Bar -->
    <div class="flex flex-wrap items-center justify-between gap-4 bg-card/80 backdrop-blur-md p-3 rounded-2xl border border-border/80 shadow-xs">
      <!-- Kind filters -->
      <div class="flex flex-wrap items-center gap-1.5 text-xs">
        <button
          v-for="filter in [
            { id: 'all', label: 'All Assets' },
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

      <!-- Favorites & Actions -->
      <div class="flex items-center gap-3">
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
          class="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold cursor-pointer transition-all shadow-md shadow-violet-500/20 hover:scale-[1.02]"
        >
          <Loader2 v-if="isUploading" class="h-3.5 w-3.5 animate-spin" />
          <UploadCloud v-else class="h-3.5 w-3.5" />
          <span>{{ isUploading ? 'Uploading...' : 'Upload Photo' }}</span>
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
        class="group relative rounded-3xl border border-border/80 bg-card overflow-hidden hover:border-primary/50 transition-all hover:shadow-xl flex flex-col"
      >
        <!-- Thumbnail preview with checkerboard background -->
        <div
          class="aspect-square w-full bg-zinc-950 relative overflow-hidden cursor-pointer bg-checkerboard flex items-center justify-center"
          @click="previewAsset = asset"
        >
          <img
            :src="asset.blobUrl"
            :alt="asset.kind"
            class="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />

          <!-- Hover overlay actions -->
          <div class="absolute inset-0 bg-black/50 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              @click.stop="previewAsset = asset"
              class="p-2.5 rounded-full bg-white text-zinc-950 hover:bg-zinc-100 shadow-xl transition-transform hover:scale-110"
              title="Preview full screen"
            >
              <Eye class="h-4 w-4" />
            </button>
            <NuxtLink
              :to="`/projects/${projectId}`"
              class="p-2.5 rounded-full bg-white text-zinc-950 hover:bg-zinc-100 shadow-xl transition-transform hover:scale-110"
              title="Open in Studio"
            >
              <ExternalLink class="h-4 w-4" />
            </NuxtLink>
          </div>

          <!-- Kind badge -->
          <div class="absolute top-2.5 left-2.5 pointer-events-none">
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
            class="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-background/80 backdrop-blur-md hover:bg-background text-muted-foreground hover:text-rose-500 transition-all shadow-sm"
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
            <a
              :href="asset.blobUrl"
              target="_blank"
              download
              class="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Download image"
            >
              <Download class="h-3.5 w-3.5" />
            </a>

            <button
              type="button"
              @click="handleDeleteAsset(asset.id)"
              class="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Delete asset"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </button>
          </div>
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
