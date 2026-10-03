<script setup lang="ts">
import {
  Heart,
  Sparkles,
  Layers,
  Scissors,
  Wand2,
  Paintbrush,
  Maximize,
  Clock,
  Loader2,
} from 'lucide-vue-next';

interface Asset {
  id: string;
  blobUrl: string;
  kind: string;
  isFavorite?: boolean;
  createdAt?: string;
  width?: number;
  height?: number;
}

const props = defineProps<{
  assets: Asset[];
  activeAssetId: string | null;
  isRunningJob?: boolean;
  expectedVariationsCount?: number;
}>();

const emit = defineEmits<{
  (e: 'select-asset', asset: Asset): void;
  (e: 'toggle-favorite', assetId: string, currentFav: boolean): void;
}>();

const getKindBadge = (kind: string) => {
  switch (kind) {
    case 'original':
      return { label: 'Original', class: 'bg-zinc-500/20 text-zinc-500' };
    case 'cutout':
      return { label: 'Cut-out', class: 'bg-sky-500/20 text-sky-600 dark:text-sky-400' };
    case 'scene':
      return { label: 'Scene', class: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' };
    case 'edit':
      return { label: 'Magic Edit', class: 'bg-purple-500/20 text-purple-600 dark:text-purple-400' };
    case 'upscale':
      return { label: 'Upscale', class: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' };
    default:
      return { label: kind, class: 'bg-muted text-muted-foreground' };
  }
};
</script>

<template>
  <aside class="w-full lg:w-64 shrink-0 bg-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-sm">
    <div class="p-3.5 border-b border-border flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Layers class="h-4 w-4 text-primary" />
        <h4 class="text-xs font-bold text-foreground">Results Strip</h4>
      </div>
      <span class="text-[11px] font-mono text-muted-foreground">
        {{ assets.length }} {{ assets.length === 1 ? 'asset' : 'assets' }}
      </span>
    </div>

    <div class="p-3 flex-1 overflow-y-auto space-y-3">
      <!-- Running Job Shimmer Placeholder -->
      <div
        v-if="isRunningJob"
        class="rounded-xl border border-primary/40 bg-primary/5 p-3 space-y-2 animate-pulse"
      >
        <div class="flex items-center justify-between text-xs text-primary font-bold">
          <span class="flex items-center gap-1.5">
            <Loader2 class="h-3.5 w-3.5 animate-spin" />
            Generating...
          </span>
          <span class="text-[10px] font-mono">In progress</span>
        </div>

        <div class="grid grid-cols-2 gap-1.5 pt-1">
          <div
            v-for="i in expectedVariationsCount || 4"
            :key="i"
            class="aspect-square rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center"
          >
            <Sparkles class="h-3 w-3 text-primary/40" />
          </div>
        </div>
      </div>

      <!-- Assets List (Newest first) -->
      <div
        v-for="asset in assets"
        :key="asset.id"
        @click="emit('select-asset', asset)"
        class="group relative rounded-xl border p-2 cursor-pointer transition-all flex gap-3 items-center"
        :class="activeAssetId === asset.id ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40'"
      >
        <!-- Thumbnail -->
        <div class="h-16 w-16 shrink-0 rounded-lg bg-muted border border-border overflow-hidden relative">
          <img
            :src="asset.blobUrl"
            :alt="asset.kind"
            class="h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        <!-- Details -->
        <div class="flex-1 min-w-0 pr-1">
          <div class="flex items-center justify-between">
            <span
              class="text-[10px] font-bold px-1.5 py-0.5 rounded"
              :class="getKindBadge(asset.kind).class"
            >
              {{ getKindBadge(asset.kind).label }}
            </span>

            <!-- Favorite button -->
            <button
              type="button"
              @click.stop="emit('toggle-favorite', asset.id, !asset.isFavorite)"
              class="p-1 rounded-md text-muted-foreground hover:text-rose-500 transition-colors"
              :title="asset.isFavorite ? 'Remove from favorites' : 'Add to favorites'"
            >
              <Heart
                class="h-3.5 w-3.5"
                :class="asset.isFavorite ? 'fill-rose-500 text-rose-500' : ''"
              />
            </button>
          </div>

          <div class="text-[11px] font-mono text-muted-foreground mt-1 truncate">
            {{ asset.width && asset.height ? `${asset.width}×${asset.height}` : 'Asset' }}
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="assets.length === 0 && !isRunningJob"
        class="py-12 text-center text-xs text-muted-foreground"
      >
        <Sparkles class="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
        <p>No images yet.</p>
        <p class="text-[11px] mt-0.5">Upload a photo to begin.</p>
      </div>
    </div>
  </aside>
</template>
