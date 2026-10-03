<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  SplitSquareVertical,
  UploadCloud,
  Loader2,
  Sparkles,
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
const isDraggingSlider = ref(false);

const containerRef = ref<HTMLElement | null>(null);

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
  const newScale = Math.min(Math.max(scale.value * delta, 0.2), 5);
  scale.value = newScale;
};

// Pan dragging
const handleMouseDown = (e: MouseEvent) => {
  if (isDraggingSlider.value) return;
  // Dragging enabled on middle click or left click on container
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
    ref="containerRef"
    class="relative w-full h-full min-h-[500px] flex-1 bg-muted/40 rounded-2xl border border-border overflow-hidden select-none flex items-center justify-center cursor-grab active:cursor-grabbing"
    @wheel="handleWheel"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
    @dragover.prevent="isDragOver = true"
    @dragleave="isDragOver = false"
    @drop.prevent="handleDrop"
  >
    <!-- Checkerboard pattern for transparent PNG backgrounds -->
    <div
      class="absolute inset-0 pointer-events-none opacity-25 dark:opacity-10"
      style="
        background-image: linear-gradient(45deg, #888 25%, transparent 25%),
          linear-gradient(-45deg, #888 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #888 75%),
          linear-gradient(-45deg, transparent 75%, #888 75%);
        background-size: 20px 20px;
        background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
      "
    ></div>

    <!-- Empty state: Upload Dropzone when no active asset -->
    <div
      v-if="!activeAsset"
      class="relative z-10 flex flex-col items-center justify-center p-8 max-w-md text-center"
    >
      <div
        class="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 transition-transform hover:scale-105"
      >
        <UploadCloud class="h-8 w-8" />
      </div>
      <h3 class="text-base font-bold text-foreground">Upload your product photo</h3>
      <p class="text-xs text-muted-foreground mt-1.5 max-w-xs">
        Drag and drop your JPG, PNG, or WebP image here (up to 10 MB).
      </p>

      <label
        class="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold cursor-pointer hover:bg-primary/90 transition-all shadow-sm"
      >
        <UploadCloud class="h-4 w-4" />
        <span>Select photo</span>
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
        <img
          :src="activeAsset.blobUrl"
          :alt="activeAsset.kind"
          class="max-w-[70vw] max-h-[65vh] object-contain rounded-lg shadow-lg pointer-events-none drop-shadow-md"
          draggable="false"
        />
      </template>

      <!-- Before / After Compare Split View -->
      <template v-else>
        <div class="relative max-w-[70vw] max-h-[65vh] overflow-hidden rounded-lg shadow-lg">
          <!-- After (Current active generation) -->
          <img
            :src="activeAsset.blobUrl"
            class="max-w-[70vw] max-h-[65vh] object-contain pointer-events-none"
            draggable="false"
          />

          <!-- Before (Original asset), clipped by compareSliderPosition -->
          <div
            class="absolute inset-0 overflow-hidden"
            :style="{ clipPath: `inset(0 ${100 - compareSliderPosition}% 0 0)` }"
          >
            <img
              :src="originalAsset.blobUrl"
              class="max-w-[70vw] max-h-[65vh] object-contain pointer-events-none"
              draggable="false"
            />
          </div>

          <!-- Slider Line -->
          <div
            class="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)] cursor-ew-resize z-20 pointer-events-none"
            :style="{ left: `${compareSliderPosition}%` }"
          >
            <div
              class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white text-black shadow-md flex items-center justify-center text-[10px] font-bold"
            >
              ↔
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Drag-over overlay -->
    <div
      v-if="isDragOver"
      class="absolute inset-0 bg-primary/20 backdrop-blur-xs border-2 border-dashed border-primary flex items-center justify-center z-30 pointer-events-none"
    >
      <div class="bg-card px-4 py-2 rounded-xl shadow-lg border border-border text-xs font-bold text-primary flex items-center gap-2">
        <UploadCloud class="h-4 w-4" />
        <span>Drop to upload product photo</span>
      </div>
    </div>

    <!-- Uploading indicator -->
    <div
      v-if="isUploading"
      class="absolute inset-0 bg-background/60 backdrop-blur-xs flex flex-col items-center justify-center z-30"
    >
      <Loader2 class="h-8 w-8 animate-spin text-primary mb-2" />
      <p class="text-xs font-semibold text-foreground">Uploading original photo...</p>
    </div>

    <!-- Floating Canvas Controls -->
    <div
      v-if="activeAsset"
      class="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-md border border-border shadow-md"
    >
      <!-- Zoom Out -->
      <button
        type="button"
        @click.stop="zoomOut"
        class="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Zoom Out"
      >
        <ZoomOut class="h-4 w-4" />
      </button>

      <!-- Zoom display -->
      <span class="text-xs font-mono font-medium px-1 text-muted-foreground min-w-[42px] text-center">
        {{ Math.round(scale * 100) }}%
      </span>

      <!-- Zoom In -->
      <button
        type="button"
        @click.stop="zoomIn"
        class="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Zoom In"
      >
        <ZoomIn class="h-4 w-4" />
      </button>

      <div class="w-px h-4 bg-border mx-1"></div>

      <!-- Reset / Fit -->
      <button
        type="button"
        @click.stop="resetView"
        class="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Reset Zoom & Pan"
      >
        <Maximize2 class="h-4 w-4" />
      </button>

      <!-- Before / After Toggle (only available if we have original asset) -->
      <template v-if="originalAsset && originalAsset.id !== activeAsset.id">
        <div class="w-px h-4 bg-border mx-1"></div>
        <button
          type="button"
          @click.stop="isCompareMode = !isCompareMode"
          class="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors"
          :class="isCompareMode ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'"
          title="Toggle Before / After Split Compare"
        >
          <SplitSquareVertical class="h-3.5 w-3.5" />
          <span>Compare</span>
        </button>

        <input
          v-if="isCompareMode"
          v-model="compareSliderPosition"
          type="range"
          min="0"
          max="100"
          class="w-20 accent-primary cursor-pointer"
        />
      </template>
    </div>
  </div>
</template>
