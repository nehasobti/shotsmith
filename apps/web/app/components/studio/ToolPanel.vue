<script setup lang="ts">
import { ref } from 'vue';
import {
  SCENE_PRESETS,
  CREDIT_COSTS,
} from '@shopshot/shared';
import {
  Scissors,
  Wand2,
  Paintbrush,
  Sparkles,
  Coins,
  Maximize,
  Check,
  Plus,
  Zap,
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

// Upscale state
const upscaleScale = ref<2 | 4>(2);

const promptChips = [
  'Morning Sunlight',
  'Soft Shadow',
  'Pedestal Reflection',
  'Organic Leaves',
  'Blurred Luxury Kitchen',
];

const appendChip = (chip: string) => {
  if (customScenePrompt.value) {
    customScenePrompt.value += `, with ${chip.toLowerCase()}`;
  } else {
    customScenePrompt.value = `Placed with ${chip.toLowerCase()}`;
  }
};

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

const handleTriggerMagicEdit = () => {
  emit('start-magic-edit', {
    instruction: editInstruction.value.trim(),
  });
};
</script>

<template>
  <aside class="w-full lg:w-84 shrink-0 bg-card border border-border/80 rounded-3xl flex flex-col overflow-hidden shadow-sm">
    <!-- Header Tabs -->
    <div class="grid grid-cols-4 p-1.5 bg-muted/40 border-b border-border/80 text-xs font-semibold gap-1">
      <button
        type="button"
        @click="activeTab = 'remove_bg'"
        class="py-2.5 px-1 rounded-2xl flex flex-col items-center gap-1 transition-all"
        :class="activeTab === 'remove_bg' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'"
      >
        <Scissors class="h-3.5 w-3.5 text-sky-500" />
        <span class="text-[11px] truncate">Cut Out</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'scene'"
        class="py-2.5 px-1 rounded-2xl flex flex-col items-center gap-1 transition-all"
        :class="activeTab === 'scene' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'"
      >
        <Wand2 class="h-3.5 w-3.5 text-violet-500" />
        <span class="text-[11px] truncate">Scene</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'edit'"
        class="py-2.5 px-1 rounded-2xl flex flex-col items-center gap-1 transition-all"
        :class="activeTab === 'edit' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'"
      >
        <Paintbrush class="h-3.5 w-3.5 text-purple-500" />
        <span class="text-[11px] truncate">Magic Edit</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'upscale'"
        class="py-2.5 px-1 rounded-2xl flex flex-col items-center gap-1 transition-all"
        :class="activeTab === 'upscale' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'"
      >
        <Maximize class="h-3.5 w-3.5 text-amber-500" />
        <span class="text-[11px] truncate">Upscale</span>
      </button>
    </div>

    <!-- Content Panel -->
    <div class="p-4 flex-1 flex flex-col overflow-y-auto space-y-4">
      <!-- 1. Remove Background Tab -->
      <div v-if="activeTab === 'remove_bg'" class="space-y-4 flex-1 flex flex-col">
        <div>
          <div class="flex items-center gap-1.5 text-sm font-bold text-foreground">
            <Scissors class="h-4 w-4 text-sky-500" />
            <span>AI Background Removal</span>
          </div>
          <p class="text-xs text-muted-foreground mt-1">
            Extract a clean, transparent PNG cut-out of your product in one click.
          </p>
        </div>

        <div class="rounded-2xl bg-gradient-to-tr from-sky-500/10 to-indigo-500/10 border border-sky-500/20 p-4 space-y-2 text-xs">
          <div class="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold">
            <Sparkles class="h-4 w-4" />
            <span>Sub-pixel BiRefNet Engine</span>
          </div>
          <p class="text-muted-foreground leading-relaxed">
            Preserves intricate product contours, fine glass edges, and label typography with zero manual rotoscoping.
          </p>
        </div>

        <div class="mt-auto pt-4 border-t border-border/80">
          <button
            type="button"
            @click="handleTriggerRemoveBg"
            :disabled="!hasActiveAsset || (userCredits !== null && userCredits < CREDIT_COSTS.remove_bg)"
            class="w-full flex items-center justify-between py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-indigo-500/20"
          >
            <span class="flex items-center gap-2">
              <Scissors class="h-4 w-4" />
              Remove Background
            </span>
            <span class="flex items-center gap-1 bg-white/20 px-2.5 py-0.5 rounded-full text-[11px] font-mono">
              <Coins class="h-3 w-3 text-amber-300" />
              {{ CREDIT_COSTS.remove_bg }} credit
            </span>
          </button>
        </div>
      </div>

      <!-- 2. Scene Generation Tab -->
      <div v-else-if="activeTab === 'scene'" class="space-y-4 flex-1 flex flex-col">
        <div>
          <div class="flex items-center gap-1.5 text-sm font-bold text-foreground">
            <Wand2 class="h-4 w-4 text-violet-500" />
            <span>Curated Scene Presets</span>
          </div>
          <p class="text-xs text-muted-foreground mt-1">
            Place your cut-out into contextual lifestyle and commercial environments.
          </p>
        </div>

        <!-- Presets Grid -->
        <div class="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
          <div
            v-for="preset in SCENE_PRESETS"
            :key="preset.id"
            @click="selectedPresetId = preset.id"
            class="group p-2.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between"
            :class="selectedPresetId === preset.id ? 'border-primary bg-primary/10 shadow-xs' : 'border-border bg-card hover:border-primary/40'"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <div
                class="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600/20 to-indigo-500/20 border border-primary/20 flex items-center justify-center shrink-0"
              >
                <Sparkles class="h-4 w-4 text-primary" />
              </div>
              <div class="min-w-0">
                <div class="text-xs font-bold text-foreground truncate">{{ preset.label }}</div>
                <div class="text-[10px] text-muted-foreground truncate">{{ preset.description }}</div>
              </div>
            </div>

            <div
              v-if="selectedPresetId === preset.id"
              class="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0"
            >
              <Check class="h-3 w-3" />
            </div>
          </div>
        </div>

        <!-- Custom Prompt Box with Suggestion Chips -->
        <div class="space-y-2">
          <label class="block text-xs font-bold text-foreground">
            Custom Environment Prompt
          </label>
          <textarea
            v-model="customScenePrompt"
            rows="2"
            maxlength="500"
            placeholder="e.g. Set on a sunlit balcony with terracotta tiles..."
            class="w-full text-xs p-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none shadow-xs"
          ></textarea>

          <!-- Prompt Chips -->
          <div class="flex flex-wrap gap-1 pt-1">
            <button
              v-for="chip in promptChips"
              :key="chip"
              type="button"
              @click="appendChip(chip)"
              class="px-2 py-0.5 rounded-lg bg-muted text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors flex items-center gap-1"
            >
              <Plus class="h-2.5 w-2.5" />
              <span>{{ chip }}</span>
            </button>
          </div>
        </div>

        <!-- Variations count -->
        <div class="flex items-center justify-between text-xs pt-1">
          <span class="text-muted-foreground font-semibold">Variations</span>
          <div class="flex items-center gap-1 bg-muted p-1 rounded-xl">
            <button
              v-for="n in [1, 2, 4]"
              :key="n"
              type="button"
              @click="variationCount = n"
              class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
              :class="variationCount === n ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'"
            >
              {{ n }}
            </button>
          </div>
        </div>

        <div class="mt-auto pt-4 border-t border-border/80">
          <button
            type="button"
            @click="handleTriggerScene"
            :disabled="!hasActiveAsset || (userCredits !== null && userCredits < CREDIT_COSTS.scene)"
            class="w-full flex items-center justify-between py-3 px-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-indigo-500/20"
          >
            <span class="flex items-center gap-2">
              <Wand2 class="h-4 w-4" />
              Generate Scene
            </span>
            <span class="flex items-center gap-1 bg-white/20 px-2.5 py-0.5 rounded-full text-[11px] font-mono">
              <Coins class="h-3 w-3 text-amber-300" />
              {{ CREDIT_COSTS.scene }} credits
            </span>
          </button>
        </div>
      </div>

      <!-- 3. Magic Edit Tab -->
      <div v-else-if="activeTab === 'edit'" class="space-y-4 flex-1 flex flex-col">
        <div>
          <div class="flex items-center gap-1.5 text-sm font-bold text-foreground">
            <Paintbrush class="h-4 w-4 text-purple-500" />
            <span>Magic Inpainting</span>
          </div>
          <p class="text-xs text-muted-foreground mt-1">
            Paint over any region and describe what to replace or modify.
          </p>
        </div>

        <div>
          <label class="block text-xs font-bold text-foreground mb-1">Instruction</label>
          <textarea
            v-model="editInstruction"
            rows="2"
            maxlength="500"
            placeholder="e.g. remove reflection, replace cable with green leaves..."
            class="w-full text-xs p-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none shadow-xs"
          ></textarea>
        </div>

        <div class="rounded-2xl bg-muted/40 border border-border/80 p-3.5 text-xs text-muted-foreground space-y-2">
          <div class="font-bold text-foreground">Keyboard shortcuts</div>
          <div class="flex justify-between text-[11px]">
            <span>Brush / Eraser</span>
            <kbd class="px-2 py-0.5 rounded-lg bg-card border border-border font-mono">B / E</kbd>
          </div>
          <div class="flex justify-between text-[11px]">
            <span>Brush Size</span>
            <kbd class="px-2 py-0.5 rounded-lg bg-card border border-border font-mono">[ / ]</kbd>
          </div>
          <div class="flex justify-between text-[11px]">
            <span>Undo Mask</span>
            <kbd class="px-2 py-0.5 rounded-lg bg-card border border-border font-mono">Ctrl + Z</kbd>
          </div>
        </div>

        <div class="mt-auto pt-4 border-t border-border/80">
          <button
            type="button"
            @click="handleTriggerMagicEdit"
            :disabled="!hasActiveAsset || !editInstruction.trim() || (userCredits !== null && userCredits < CREDIT_COSTS.edit)"
            class="w-full flex items-center justify-between py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-indigo-500/20"
          >
            <span class="flex items-center gap-2">
              <Paintbrush class="h-4 w-4" />
              Apply Magic Edit
            </span>
            <span class="flex items-center gap-1 bg-white/20 px-2.5 py-0.5 rounded-full text-[11px] font-mono">
              <Coins class="h-3 w-3 text-amber-300" />
              {{ CREDIT_COSTS.edit }} credit
            </span>
          </button>
        </div>
      </div>

      <!-- 4. Upscale Tab -->
      <div v-else-if="activeTab === 'upscale'" class="space-y-4 flex-1 flex flex-col">
        <div>
          <div class="flex items-center gap-1.5 text-sm font-bold text-foreground">
            <Maximize class="h-4 w-4 text-amber-500" />
            <span>AI Super-Resolution</span>
          </div>
          <p class="text-xs text-muted-foreground mt-1">
            Enhance micro-textures and upscale to crisp print-ready 4K resolution.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            @click="upscaleScale = 2"
            class="p-4 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all"
            :class="upscaleScale === 2 ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs' : 'border-border bg-card text-muted-foreground hover:border-primary/40'"
          >
            <span class="text-2xl font-black">2×</span>
            <span class="text-[11px]">HD Listing</span>
          </button>

          <button
            type="button"
            @click="upscaleScale = 4"
            class="p-4 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all"
            :class="upscaleScale === 4 ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs' : 'border-border bg-card text-muted-foreground hover:border-primary/40'"
          >
            <span class="text-2xl font-black">4×</span>
            <span class="text-[11px]">Ultra 4K Print</span>
          </button>
        </div>

        <div class="mt-auto pt-4 border-t border-border/80">
          <button
            type="button"
            @click="handleTriggerUpscale"
            :disabled="!hasActiveAsset || (userCredits !== null && userCredits < CREDIT_COSTS.upscale)"
            class="w-full flex items-center justify-between py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-600 to-violet-600 hover:from-amber-500 hover:to-violet-500 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-violet-500/20"
          >
            <span class="flex items-center gap-2">
              <Maximize class="h-4 w-4" />
              Upscale Image
            </span>
            <span class="flex items-center gap-1 bg-white/20 px-2.5 py-0.5 rounded-full text-[11px] font-mono">
              <Coins class="h-3 w-3 text-amber-300" />
              {{ CREDIT_COSTS.upscale }} credits
            </span>
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>
