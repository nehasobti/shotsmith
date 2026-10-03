<script setup lang="ts">
import { ref } from 'vue';
import {
  SCENE_PRESETS,
  CREDIT_COSTS,
  type ScenePreset,
} from '@shopshot/shared';
import {
  Scissors,
  Wand2,
  Paintbrush,
  Sparkles,
  Coins,
  ArrowUpRight,
  Maximize,
  SlidersHorizontal,
} from 'lucide-vue-next';

type ToolTab = 'remove_bg' | 'scene' | 'edit' | 'upscale';

const props = defineProps<{
  hasActiveAsset: boolean;
  userCredits: number | null;
}>();

const emit = defineEmits<{
  (e: 'start-remove-bg'): void;
  (e: 'start-scene', payload: { presetId?: string; prompt?: string; variationCount: number }): void;
  (e: 'start-magic-edit', payload: { instruction: string; maskUrl?: string }): void;
  (e: 'start-upscale', payload: { scale: 2 | 4 }): void;
}>();

const activeTab = ref<ToolTab>('remove_bg');

// Scene tab state
const selectedPresetId = ref<string>('marble_counter');
const customScenePrompt = ref('');
const variationCount = ref<number>(4);

// Magic edit state
const editInstruction = ref('');
const brushSize = ref(20);
const isEraser = ref(false);

// Upscale state
const upscaleScale = ref<2 | 4>(2);

const handleTriggerRemoveBg = () => {
  emit('start-remove-bg');
};

const handleTriggerScene = () => {
  emit('start-scene', {
    presetId: selectedPresetId.value,
    prompt: customScenePrompt.value.trim() || undefined,
    variationCount: variationCount.value,
  });
};

const handleTriggerUpscale = () => {
  emit('start-upscale', {
    scale: upscaleScale.value,
  });
};
</script>

<template>
  <aside class="w-full lg:w-80 shrink-0 bg-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-sm">
    <!-- Header Tabs -->
    <div class="grid grid-cols-4 border-b border-border bg-muted/30 p-1 text-xs font-semibold">
      <button
        type="button"
        @click="activeTab = 'remove_bg'"
        class="py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all"
        :class="activeTab === 'remove_bg' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'"
      >
        <Scissors class="h-3.5 w-3.5" />
        <span class="truncate">Cut Out</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'scene'"
        class="py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all"
        :class="activeTab === 'scene' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'"
      >
        <Wand2 class="h-3.5 w-3.5" />
        <span class="truncate">Scene</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'edit'"
        class="py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all"
        :class="activeTab === 'edit' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'"
      >
        <Paintbrush class="h-3.5 w-3.5" />
        <span class="truncate">Magic Edit</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'upscale'"
        class="py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all"
        :class="activeTab === 'upscale' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'"
      >
        <Maximize class="h-3.5 w-3.5" />
        <span class="truncate">Upscale</span>
      </button>
    </div>

    <!-- Content Panel -->
    <div class="p-4 flex-1 flex flex-col overflow-y-auto space-y-4">
      <!-- 1. Remove Background Tab -->
      <div v-if="activeTab === 'remove_bg'" class="space-y-4 flex-1 flex flex-col">
        <div>
          <h4 class="text-sm font-bold text-foreground">Background Removal</h4>
          <p class="text-xs text-muted-foreground mt-1">
            Instantly isolate the product and extract a clean, transparent PNG cut-out.
          </p>
        </div>

        <div class="rounded-xl bg-muted/50 border border-border p-3 space-y-2 text-xs text-muted-foreground">
          <div class="flex items-center gap-2 text-foreground font-semibold">
            <Sparkles class="h-4 w-4 text-primary" />
            <span>AI Edge Refinement</span>
          </div>
          <p>
            Precision mask delineation ensures sharp borders around fine details like glassware, jewelry, and hair.
          </p>
        </div>

        <div class="mt-auto pt-4 border-t border-border">
          <button
            type="button"
            @click="handleTriggerRemoveBg"
            :disabled="!hasActiveAsset || (userCredits !== null && userCredits < CREDIT_COSTS.remove_bg)"
            class="w-full flex items-center justify-between py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all disabled:opacity-50 shadow-sm"
          >
            <span class="flex items-center gap-1.5">
              <Scissors class="h-4 w-4" />
              Remove Background
            </span>
            <span class="flex items-center gap-1 bg-primary-foreground/20 px-2 py-0.5 rounded-full text-[11px]">
              <Coins class="h-3 w-3" />
              {{ CREDIT_COSTS.remove_bg }} credit
            </span>
          </button>
        </div>
      </div>

      <!-- 2. Scene Generation Tab -->
      <div v-else-if="activeTab === 'scene'" class="space-y-4 flex-1 flex flex-col">
        <div>
          <h4 class="text-sm font-bold text-foreground">Scene Presets</h4>
          <p class="text-xs text-muted-foreground mt-1">
            Place your cut-out into contextual 3D studio and lifestyle environments.
          </p>
        </div>

        <!-- Presets Grid -->
        <div class="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
          <div
            v-for="preset in SCENE_PRESETS"
            :key="preset.id"
            @click="selectedPresetId = preset.id"
            class="group p-2 rounded-xl border cursor-pointer transition-all text-left"
            :class="selectedPresetId === preset.id ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/40'"
          >
            <div class="aspect-4/3 rounded-lg bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground mb-1.5 overflow-hidden">
              <span class="text-[10px] text-center px-1 font-medium">{{ preset.label }}</span>
            </div>
            <div class="text-[11px] font-bold text-foreground truncate">{{ preset.label }}</div>
          </div>
        </div>

        <!-- Custom Prompt Box -->
        <div>
          <label class="block text-xs font-medium text-foreground mb-1">
            Or describe custom background (optional)
          </label>
          <textarea
            v-model="customScenePrompt"
            rows="2"
            maxlength="500"
            placeholder="e.g. Set on a sunlit balcony with terracotta tiles..."
            class="w-full text-xs p-2.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          ></textarea>
        </div>

        <!-- Variations count -->
        <div class="flex items-center justify-between text-xs">
          <span class="text-muted-foreground font-medium">Variations</span>
          <div class="flex items-center gap-1 bg-muted p-0.5 rounded-lg">
            <button
              v-for="n in [1, 2, 4]"
              :key="n"
              type="button"
              @click="variationCount = n"
              class="px-2 py-0.5 rounded text-xs font-semibold transition-colors"
              :class="variationCount === n ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'"
            >
              {{ n }}
            </button>
          </div>
        </div>

        <div class="mt-auto pt-4 border-t border-border">
          <button
            type="button"
            @click="handleTriggerScene"
            :disabled="!hasActiveAsset || (userCredits !== null && userCredits < CREDIT_COSTS.scene)"
            class="w-full flex items-center justify-between py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all disabled:opacity-50 shadow-sm"
          >
            <span class="flex items-center gap-1.5">
              <Wand2 class="h-4 w-4" />
              Generate Scene
            </span>
            <span class="flex items-center gap-1 bg-primary-foreground/20 px-2 py-0.5 rounded-full text-[11px]">
              <Coins class="h-3 w-3" />
              {{ CREDIT_COSTS.scene }} credits
            </span>
          </button>
        </div>
      </div>

      <!-- 3. Magic Edit Tab -->
      <div v-else-if="activeTab === 'edit'" class="space-y-4 flex-1 flex flex-col">
        <div>
          <h4 class="text-sm font-bold text-foreground">Magic Inpainting Edit</h4>
          <p class="text-xs text-muted-foreground mt-1">
            Paint over any region and describe what to replace or remove.
          </p>
        </div>

        <div>
          <label class="block text-xs font-medium text-foreground mb-1">Instruction</label>
          <textarea
            v-model="editInstruction"
            rows="2"
            maxlength="500"
            placeholder="e.g. remove reflection, replace cable with leaves..."
            class="w-full text-xs p-2.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          ></textarea>
        </div>

        <div class="rounded-xl bg-muted/40 border border-border p-3 text-xs text-muted-foreground space-y-1">
          <div class="font-semibold text-foreground">Keyboard shortcuts</div>
          <div class="flex justify-between text-[11px]">
            <span>Brush / Eraser</span>
            <kbd class="px-1.5 py-0.5 rounded bg-card border border-border">B / E</kbd>
          </div>
          <div class="flex justify-between text-[11px]">
            <span>Brush Size</span>
            <kbd class="px-1.5 py-0.5 rounded bg-card border border-border">[ / ]</kbd>
          </div>
          <div class="flex justify-between text-[11px]">
            <span>Undo Mask</span>
            <kbd class="px-1.5 py-0.5 rounded bg-card border border-border">Ctrl + Z</kbd>
          </div>
        </div>

        <div class="mt-auto pt-4 border-t border-border">
          <button
            type="button"
            :disabled="!hasActiveAsset || !editInstruction.trim() || (userCredits !== null && userCredits < CREDIT_COSTS.edit)"
            class="w-full flex items-center justify-between py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all disabled:opacity-50 shadow-sm"
          >
            <span class="flex items-center gap-1.5">
              <Paintbrush class="h-4 w-4" />
              Apply Magic Edit
            </span>
            <span class="flex items-center gap-1 bg-primary-foreground/20 px-2 py-0.5 rounded-full text-[11px]">
              <Coins class="h-3 w-3" />
              {{ CREDIT_COSTS.edit }} credit
            </span>
          </button>
        </div>
      </div>

      <!-- 4. Upscale Tab -->
      <div v-else-if="activeTab === 'upscale'" class="space-y-4 flex-1 flex flex-col">
        <div>
          <h4 class="text-sm font-bold text-foreground">AI Image Upscaler</h4>
          <p class="text-xs text-muted-foreground mt-1">
            Enhance clarity, eliminate blur, and upscale to ultra-high 4K resolution.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            @click="upscaleScale = 2"
            class="p-4 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all"
            :class="upscaleScale === 2 ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-border bg-card text-muted-foreground hover:border-primary/40'"
          >
            <span class="text-xl font-extrabold">2×</span>
            <span class="text-[11px]">Standard High-Res</span>
          </button>

          <button
            type="button"
            @click="upscaleScale = 4"
            class="p-4 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all"
            :class="upscaleScale === 4 ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-border bg-card text-muted-foreground hover:border-primary/40'"
          >
            <span class="text-xl font-extrabold">4×</span>
            <span class="text-[11px]">Ultra 4K Print-Ready</span>
          </button>
        </div>

        <div class="mt-auto pt-4 border-t border-border">
          <button
            type="button"
            @click="handleTriggerUpscale"
            :disabled="!hasActiveAsset || (userCredits !== null && userCredits < CREDIT_COSTS.upscale)"
            class="w-full flex items-center justify-between py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all disabled:opacity-50 shadow-sm"
          >
            <span class="flex items-center gap-1.5">
              <Maximize class="h-4 w-4" />
              Upscale Image
            </span>
            <span class="flex items-center gap-1 bg-primary-foreground/20 px-2 py-0.5 rounded-full text-[11px]">
              <Coins class="h-3 w-3" />
              {{ CREDIT_COSTS.upscale }} credits
            </span>
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>
