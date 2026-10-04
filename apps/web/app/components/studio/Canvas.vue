<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  SplitSquareVertical,
  UploadCloud,
  Loader2,
  Sparkles,
  MousePointer,
  RotateCcw,
} from 'lucide-vue-next';

interface Asset {
  id: string;
  blobUrl: string;
  kind: string;
  width?: number;
  height?: number;
}

const props = defineProps<{
  activeAsset: Asset | null;
  originalAsset: Asset | null;
  isUploading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'upload-file', file: File): void;
}>();

// Pan & Zoom state
const scale = ref(1);
const translateX = ref(0);
const translateY = ref(0);
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });

// Compare mode (Before / After slider)
const isCompareMode = ref(false);
const compareSliderPosition = ref(50); // percentage 0 - 100

const zoomIn = () => {
  scale.value = Math.min(scale.value * 1.25, 5);
};

const zoomOut = () => {
  scale.value = Math.max(scale.value / 1.25, 0.2);
};

const resetView = () => {
  scale.value = 1;
  translateX.value = 0;
  translateY.value = 0;
};

// Mouse wheel zoom
const handleWheel = (e: WheelEvent) => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  scale.value = Math.min(Math.max(scale.value * delta, 0.2), 5);
};

// Pan dragging
const handleMouseDown = (e: MouseEvent) => {
  if (isCompareMode.value) return;
  isDragging.value = true;
  dragStart.value = {
    x: e.clientX - translateX.value,
    y: e.clientY - translateY.value,
  };
};

const handleMouseMove = (e: MouseEvent) => {
  if (isDragging.value) {
    translateX.value = e.clientX - dragStart.value.x;
    translateY.value = e.clientY - dragStart.value.y;
  }
};

const handleMouseUp = () => {
  isDragging.value = false;
};

// Drag and drop upload
const isDragOver = ref(false);
const handleDrop = (e: DragEvent) => {
  isDragOver.value = false;
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    emit('upload-file', e.dataTransfer.files[0]);
  }
};

const handleFileInputChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    emit('upload-file', target.files[0]);
    target.value = '';
  }
};

watch(
  () => props.activeAsset?.id,
  () => {
    resetView();
  }
);
</script>

<template>
  <div
    class="relative w-full h-full min-h-[360px] flex-1 bg-zinc-950/95 dark:bg-black/90 rounded-3xl border border-border/80 overflow-hidden select-none flex items-center justify-center cursor-grab active:cursor-grabbing shadow-inner transition-colors order-1 md:order-2"
    @wheel="handleWheel"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
    @dragover.prevent="isDragOver = true"
    @dragleave="isDragOver = false"
    @drop.prevent="handleDrop"
  >
    <!-- Background studio grid & transparency checkerboard pattern -->
    <div class="absolute inset-0 pointer-events-none opacity-40 bg-checkerboard"></div>

    <!-- Empty state: Upload Dropzone when no active asset -->
    <div
      v-if="!activeAsset"
      class="relative z-10 flex flex-col items-center justify-center p-10 max-w-md text-center"
    >
      <div
        class="h-20 w-20 rounded-3xl bg-gradient-to-tr from-violet-600/20 to-indigo-500/20 border border-violet-500/30 flex items-center justify-center text-primary mb-5 shadow-lg shadow-violet-500/10 transition-transform hover:scale-105"
      >
        <UploadCloud class="h-10 w-10 text-primary" />
      </div>
      <h3 class="text-lg font-bold text-white tracking-tight">Upload your product photo</h3>
      <p class="text-xs text-zinc-400 mt-2 max-w-xs leading-relaxed">
        Drop your smartphone or catalog photo here. Supports high-resolution JPG, PNG, and WebP up to 10 MB.
      </p>

      <label
        class="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold cursor-pointer hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-indigo-500/25 hover:scale-105"
      >
        <UploadCloud class="h-4 w-4" />
        <span>Select photo to begin</span>
        <input
          type="file"
          class="hidden"
          accept="image/jpeg,image/png,image/webp"
          @change="handleFileInputChange"
        />
      </label>
    </div>

    <!-- Active Image Viewport -->
    <div
      v-else
      class="relative transition-transform duration-75 ease-out"
      :style="{
        transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
        transformOrigin: 'center center',
      }"
    >
      <!-- Standard Single View -->
      <template v-if="!isCompareMode || !originalAsset || originalAsset.id === activeAsset.id">
        <div class="relative group">
          <img
            :src="activeAsset.blobUrl"
            :alt="activeAsset.kind"
            class="max-w-[85vw] md:max-w-[45vw] lg:max-w-[50vw] max-h-[65vh] object-contain rounded-xl shadow-2xl pointer-events-none drop-shadow-2xl"
            draggable="false"
          />
        </div>
      </template>

      <!-- Before / After Compare Split View -->
      <template v-else>
        <div class="relative max-w-[85vw] md:max-w-[45vw] lg:max-w-[50vw] max-h-[65vh] overflow-hidden rounded-xl shadow-2xl select-none">
          <!-- After (Current active generation) -->
          <img
            :src="activeAsset.blobUrl"
            class="max-w-full max-h-[65vh] object-contain pointer-events-none"
            draggable="false"
          />

          <!-- Before (Original asset), clipped by compareSliderPosition -->
          <div
            class="absolute inset-0 overflow-hidden"
            :style="{ clipPath: `inset(0 ${100 - compareSliderPosition}% 0 0)` }"
          >
            <img
              :src="originalAsset.blobUrl"
              class="max-w-full max-h-[65vh] object-contain pointer-events-none"
              draggable="false"
            />
          </div>

          <!-- Slider Line -->
          <div
            class="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.8)] cursor-ew-resize z-20 pointer-events-none"
            :style="{ left: `${compareSliderPosition}%` }"
          >
            <div
              class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-zinc-950 shadow-2xl flex items-center justify-center text-xs font-black"
            >
              ↔
            </div>
          </div>

          <!-- Slider input trigger -->
          <input
            v-model="compareSliderPosition"
            type="range"
            min="0"
            max="100"
            class="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
          />
        </div>
      </template>
    </div>

    <!-- Drag-over overlay -->
    <div
      v-if="isDragOver"
      class="absolute inset-0 bg-violet-600/20 backdrop-blur-xs border-2 border-dashed border-violet-500 flex items-center justify-center z-30 pointer-events-none"
    >
      <div class="bg-card px-5 py-2.5 rounded-2xl shadow-xl border border-border text-xs font-bold text-primary flex items-center gap-2">
        <UploadCloud class="h-4 w-4" />
        <span>Drop to upload into Studio</span>
      </div>
    </div>

    <!-- Uploading indicator -->
    <div
      v-if="isUploading"
      class="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center z-30"
    >
      <Loader2 class="h-9 w-9 animate-spin text-primary mb-2" />
      <p class="text-xs font-bold text-white">Uploading product asset...</p>
    </div>

    <!-- Floating Studio Toolbar at Bottom -->
    <div
      v-if="activeAsset"
      class="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 backdrop-blur-xl border border-white/10 text-white shadow-2xl"
    >
      <!-- Zoom Out -->
      <button
        type="button"
        @click.stop="zoomOut"
        class="p-1.5 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
        title="Zoom Out"
      >
        <ZoomOut class="h-4 w-4" />
      </button>

      <!-- Zoom display -->
      <span class="text-xs font-mono font-bold px-1 text-zinc-300 min-w-[44px] text-center">
        {{ Math.round(scale * 100) }}%
      </span>

      <!-- Zoom In -->
      <button
        type="button"
        @click.stop="zoomIn"
        class="p-1.5 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
        title="Zoom In"
      >
        <ZoomIn class="h-4 w-4" />
      </button>

      <div class="w-px h-4 bg-white/20 mx-0.5"></div>

      <!-- Reset / Fit -->
      <button
        type="button"
        @click.stop="resetView"
        class="p-1.5 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
        title="Fit to screen"
      >
        <RotateCcw class="h-3.5 w-3.5" />
      </button>

      <!-- Before / After Compare Toggle -->
      <template v-if="originalAsset && originalAsset.id !== activeAsset.id">
        <div class="w-px h-4 bg-white/20 mx-0.5"></div>
        <button
          type="button"
          @click.stop="isCompareMode = !isCompareMode"
          class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all"
          :class="isCompareMode ? 'bg-primary text-white shadow-md shadow-primary/30' : 'hover:bg-white/10 text-zinc-300'"
          title="Toggle Before / After Split Compare"
        >
          <SplitSquareVertical class="h-3.5 w-3.5" />
          <span>Compare</span>
        </button>
      </template>
    </div>
  </div>
</template>
