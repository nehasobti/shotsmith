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
</script>

<template>
  <aside class="w-full lg:w-72 shrink-0 bg-card border border-border/80 rounded-3xl flex flex-col overflow-hidden shadow-sm">
    <div class="p-4 border-b border-border/80 flex items-center justify-between bg-muted/20">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Layers class="h-3.5 w-3.5" />
        </div>
        <h4 class="text-xs font-bold text-foreground">Project Filmstrip</h4>
      </div>
      <span class="text-[11px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
        {{ assets.length }}
      </span>
    </div>

    <div class="p-3 flex-1 overflow-y-auto space-y-2.5">
      <!-- Running Job Shimmer Placeholder -->
      <div
        v-if="isRunningJob"
        class="rounded-2xl border border-primary/40 bg-primary/5 p-3.5 space-y-2.5 animate-shimmer"
      >
        <div class="flex items-center justify-between text-xs text-primary font-bold">
          <span class="flex items-center gap-1.5">
            <Loader2 class="h-3.5 w-3.5 animate-spin" />
            Generating AI Scene...
          </span>
          <span class="text-[10px] font-mono bg-primary/15 px-2 py-0.5 rounded-full">Queued</span>
        </div>

        <div class="grid grid-cols-2 gap-2 pt-1">
          <div
            v-for="i in expectedVariationsCount || 4"
            :key="i"
            class="aspect-square rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center"
          >
            <Sparkles class="h-4 w-4 text-primary/40 animate-pulse" />
          </div>
        </div>
      </div>

      <!-- Assets List (Newest first) -->
      <div
        v-for="asset in assets"
        :key="asset.id"
        @click="emit('select-asset', asset)"
        class="group relative rounded-2xl border p-2 cursor-pointer transition-all flex gap-3 items-center"
        :class="activeAssetId === asset.id ? 'border-primary ring-2 ring-primary/40 bg-primary/5 shadow-xs' : 'border-border/80 bg-card hover:border-primary/40 hover:bg-muted/30'"
      >
        <!-- Thumbnail -->
        <div class="h-16 w-16 shrink-0 rounded-xl bg-zinc-950/80 border border-border/80 overflow-hidden relative bg-checkerboard flex items-center justify-center">
          <img
            :src="asset.blobUrl"
            :alt="asset.kind"
            class="h-full w-full object-contain"
            loading="lazy"
          />
        </div>

        <!-- Details -->
        <div class="flex-1 min-w-0 pr-1">
          <div class="flex items-center justify-between">
            <span
              class="text-[10px] font-bold px-2 py-0.5 rounded-full"
              :class="getKindBadge(asset.kind).class"
            >
              {{ getKindBadge(asset.kind).label }}
            </span>

            <!-- Favorite toggle button -->
            <button
              type="button"
              @click.stop="emit('toggle-favorite', asset.id, !asset.isFavorite)"
              class="p-1 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              :title="asset.isFavorite ? 'Remove from favorites' : 'Add to favorites'"
            >
              <Heart
                class="h-3.5 w-3.5"
                :class="asset.isFavorite ? 'fill-rose-500 text-rose-500' : ''"
              />
            </button>
          </div>

          <div class="text-[11px] font-mono text-muted-foreground mt-1.5 flex items-center justify-between">
            <span>{{ asset.width && asset.height ? `${asset.width}×${asset.height}` : 'Asset' }}</span>
            <span v-if="activeAssetId === asset.id" class="text-[10px] font-bold text-primary">Active</span>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="assets.length === 0 && !isRunningJob"
        class="py-16 text-center text-xs text-muted-foreground px-4"
      >
        <div class="w-10 h-10 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-3">
          <Sparkles class="h-5 w-5 text-muted-foreground/60" />
        </div>
        <p class="font-bold text-foreground">No images yet</p>
        <p class="text-[11px] mt-1 text-muted-foreground">Upload a photo to populate the filmstrip.</p>
      </div>
    </div>
  </aside>
</template>
