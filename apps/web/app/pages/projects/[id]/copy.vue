<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useCredits } from '~/composables/useCredits';
import type { CopyOutput, CopyTone } from '@shopshot/shared';
import {
  Sparkles,
  ArrowLeft,
  Images,
  FileText,
  Copy,
  Check,
  Coins,
  Loader2,
  Wand2,
  Globe,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
} from 'lucide-vue-next';

interface Asset {
  id: string;
  blobUrl: string;
  kind: string;
}

interface Project {
  id: string;
  name: string;
  productDescription?: string | null;
  coverAssetId?: string | null;
}

interface CopyGenerationItem {
  id: string;
  tone: CopyTone;
  language: string;
  output: CopyOutput;
  tokens: number;
  createdAt: string;
}

const route = useRoute();
const projectId = computed(() => route.params.id as string);

const project = ref<Project | null>(null);
const assetsList = ref<Asset[]>([]);
const originalAsset = computed(() => {
  return assetsList.value.find((a) => a.kind === 'original') || assetsList.value[0] || null;
});

const { balance, fetchCredits } = useCredits();

const isLoading = ref(true);
const isGenerating = ref(false);
const isDescribing = ref(false);

const productName = ref('');
const productDescription = ref('');
const selectedTone = ref<CopyTone>('professional');
const selectedLanguage = ref('en');

const currentCopy = ref<CopyOutput | null>(null);
const copyHistory = ref<CopyGenerationItem[]>([]);

const toastMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null);
const copiedField = ref<string | null>(null);

const tones: Array<{ id: CopyTone; label: string; desc: string }> = [
  { id: 'professional', label: 'Professional', desc: 'Trustworthy, authoritative & conversion-oriented' },
  { id: 'luxury', label: 'Luxury', desc: 'Elevated, prestigious & sophisticated appeal' },
  { id: 'playful', label: 'Playful', desc: 'Energetic, engaging & warm viral tone' },
  { id: 'minimal', label: 'Minimal', desc: 'Concise, design-forward & modern simplicity' },
];

const languages = [
  { code: 'en', label: 'English (US/UK)' },
  { code: 'it', label: 'Italian (Italiano)' },
  { code: 'hi', label: 'Hindi (हिंदी)' },
  { code: 'es', label: 'Spanish (Español)' },
  { code: 'de', label: 'German (Deutsch)' },
  { code: 'fr', label: 'French (Français)' },
];

const showToast = (type: 'success' | 'error', text: string) => {
  toastMessage.value = { type, text };
  setTimeout(() => {
    toastMessage.value = null;
  }, 4000);
};

const copyToClipboard = async (text: string, fieldKey: string) => {
  try {
    await navigator.clipboard.writeText(text);
    copiedField.value = fieldKey;
    showToast('success', 'Copied to clipboard!');
    setTimeout(() => {
      if (copiedField.value === fieldKey) copiedField.value = null;
    }, 2500);
  } catch {
    showToast('error', 'Failed to copy to clipboard.');
  }
};

const fetchProjectData = async () => {
  isLoading.value = true;
  try {
    const data = await $fetch<{ project: Project; assets: Asset[] }>(`/api/projects/${projectId.value}`);
    project.value = data.project;
    assetsList.value = data.assets;
    productName.value = data.project.name;
    productDescription.value = data.project.productDescription || '';

    // Fetch previous copy generations
    const historyRes = await $fetch<{ generations: CopyGenerationItem[] }>(`/api/projects/${projectId.value}/copy`);
    copyHistory.value = historyRes.generations;
    if (historyRes.generations.length > 0 && historyRes.generations[0]) {
      currentCopy.value = historyRes.generations[0].output;
    }
  } catch (err: any) {
    showToast('error', err?.message || 'Failed to load project details');
  } finally {
    isLoading.value = false;
  }
};

// 1. Auto-Describe Image (Free)
const handleAutoDescribe = async () => {
  if (!originalAsset.value) {
    showToast('error', 'Please upload a product photo first to use auto-describe.');
    return;
  }

  isDescribing.value = true;
  try {
    const res = await $fetch<{ productName: string; productDescription: string }>(
      `/api/assets/${originalAsset.value.id}/describe`,
      { method: 'POST' }
    );

    if (res.productName) productName.value = res.productName;
    if (res.productDescription) productDescription.value = res.productDescription;

    showToast('success', 'Product details auto-suggested by Gemini Vision!');
  } catch (err: any) {
    showToast('error', err?.data?.error?.message || err?.message || 'Auto-describe failed');
  } finally {
    isDescribing.value = false;
  }
};

// 2. Generate Ad Copy (1 Credit)
const handleGenerateCopy = async () => {
  if (!productName.value.trim()) {
    showToast('error', 'Product name is required.');
    return;
  }

  isGenerating.value = true;
  try {
    const res = await $fetch<{ copy: CopyGenerationItem; remainingCredits: number }>(
      `/api/projects/${projectId.value}/copy`,
      {
        method: 'POST',
        body: {
          productName: productName.value.trim(),
          productDescription: productDescription.value.trim(),
          tone: selectedTone.value,
          language: selectedLanguage.value,
          assetId: originalAsset.value?.id,
        },
      }
    );

    currentCopy.value = res.copy.output;
    copyHistory.value.unshift(res.copy);
    if (balance.value !== null) {
      balance.value = res.remainingCredits;
    }
    await fetchCredits();
    showToast('success', 'E-Commerce Ad Copy generated!');
  } catch (err: any) {
    showToast('error', err?.data?.error?.message || err?.message || 'Failed to generate ad copy');
  } finally {
    isGenerating.value = false;
  }
};

onMounted(async () => {
  await Promise.all([fetchCredits(), fetchProjectData()]);
});
</script>

<template>
  <div class="flex flex-col min-h-[calc(100vh-4rem)] bg-background">
    <!-- Sub-Header -->
    <header class="h-16 border-b border-border/80 bg-card/60 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-4 min-w-0">
        <NuxtLink
          to="/projects"
          class="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all border border-border/60 hover:border-border"
        >
          <ArrowLeft class="h-4 w-4" />
        </NuxtLink>

        <div class="min-w-0">
          <h1 class="text-sm font-extrabold text-foreground truncate tracking-tight">
            {{ project?.name || 'Ad Copy Studio' }}
          </h1>
          <p class="text-[11px] text-muted-foreground truncate">
            AI Marketing Copywriter & Multilingual Listing Engine
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
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all text-muted-foreground hover:text-foreground"
        >
          <Images class="h-3.5 w-3.5" />
          <span>Gallery</span>
        </NuxtLink>

        <NuxtLink
          :to="`/projects/${projectId}/copy`"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all bg-card text-foreground shadow-xs font-black"
        >
          <FileText class="h-3.5 w-3.5 text-primary" />
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

    <!-- Main Content -->
    <div class="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Left Configuration Panel -->
      <div class="lg:col-span-5 space-y-5">
        <div class="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold text-foreground flex items-center gap-2">
              <Wand2 class="h-4 w-4 text-primary" />
              <span>Copy Parameters</span>
            </h2>

            <button
              type="button"
              @click="handleAutoDescribe"
              :disabled="isDescribing || !originalAsset"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all disabled:opacity-50"
              title="Automatically detect product details using Gemini Vision"
            >
              <Loader2 v-if="isDescribing" class="h-3.5 w-3.5 animate-spin" />
              <Sparkles v-else class="h-3.5 w-3.5" />
              <span>Auto-Describe (Free)</span>
            </button>
          </div>

          <!-- Product Name -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-foreground">Product Title</label>
            <input
              v-model="productName"
              type="text"
              placeholder="e.g. Matte Ceramic Pour-Over Dripper"
              class="w-full text-xs p-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            />
          </div>

          <!-- Product Description -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-foreground">Core Features / Highlights</label>
            <textarea
              v-model="productDescription"
              rows="3"
              placeholder="e.g. Ergonomic handle, heat-resistant stoneware, minimal Scandinavian finish..."
              class="w-full text-xs p-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none shadow-xs"
            ></textarea>
          </div>

          <!-- Tone Selector -->
          <div class="space-y-2 pt-1">
            <label class="block text-xs font-bold text-foreground">Brand Tone</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="tone in tones"
                :key="tone.id"
                type="button"
                @click="selectedTone = tone.id"
                class="p-2.5 rounded-2xl border text-left transition-all"
                :class="selectedTone === tone.id ? 'border-primary bg-primary/10 font-bold shadow-xs' : 'border-border bg-card hover:border-primary/40'"
              >
                <div class="text-xs font-bold text-foreground capitalize">{{ tone.label }}</div>
                <div class="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{{ tone.desc }}</div>
              </button>
            </div>
          </div>

          <!-- Language Selector -->
          <div class="space-y-2 pt-1">
            <label class="block text-xs font-bold text-foreground flex items-center gap-1.5">
              <Globe class="h-3.5 w-3.5 text-muted-foreground" />
              <span>Output Language</span>
            </label>
            <select
              v-model="selectedLanguage"
              class="w-full text-xs p-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            >
              <option v-for="lang in languages" :key="lang.code" :value="lang.code">
                {{ lang.label }}
              </option>
            </select>
          </div>

          <!-- Generate Button -->
          <button
            type="button"
            @click="handleGenerateCopy"
            :disabled="isGenerating || !productName.trim() || (balance !== null && balance < 1)"
            class="w-full mt-2 flex items-center justify-between py-3.5 px-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-violet-500/25"
          >
            <span class="flex items-center gap-2">
              <Loader2 v-if="isGenerating" class="h-4 w-4 animate-spin" />
              <Wand2 v-else class="h-4 w-4" />
              <span>Generate Conversion Copy</span>
            </span>
            <span class="flex items-center gap-1 bg-white/20 px-2.5 py-0.5 rounded-full text-[11px] font-mono">
              <Coins class="h-3 w-3 text-amber-300" />
              1 credit
            </span>
          </button>
        </div>

        <!-- History Selector -->
        <div v-if="copyHistory.length > 0" class="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-3">
          <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Clock class="h-3.5 w-3.5 text-muted-foreground" />
            <span>Generation History ({{ copyHistory.length }})</span>
          </h3>

          <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
            <div
              v-for="item in copyHistory"
              :key="item.id"
              @click="currentCopy = item.output"
              class="p-2.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between"
              :class="currentCopy?.title === item.output.title ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'"
            >
              <div class="min-w-0 pr-2">
                <div class="text-xs font-bold text-foreground truncate">{{ item.output.title }}</div>
                <div class="text-[10px] text-muted-foreground capitalize">{{ item.tone }} · {{ item.language.toUpperCase() }}</div>
              </div>
              <span class="text-[10px] font-mono text-muted-foreground">{{ item.tokens }} toks</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Output Cards -->
      <div class="lg:col-span-7 space-y-4">
        <!-- Empty State -->
        <div
          v-if="!currentCopy && !isGenerating"
          class="h-full min-h-[400px] bg-card border border-dashed border-border rounded-3xl p-10 flex flex-col items-center justify-center text-center"
        >
          <div class="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
            <FileText class="h-7 w-7" />
          </div>
          <h3 class="text-base font-bold text-foreground">No Copy Generated Yet</h3>
          <p class="text-xs text-muted-foreground max-w-sm mt-1.5 leading-relaxed">
            Fill in your product name, pick a brand tone and target language, and generate ready-to-publish e-commerce listings in seconds.
          </p>
        </div>

        <!-- Loading Shimmer State -->
        <div
          v-else-if="isGenerating"
          class="bg-card border border-primary/30 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[400px] space-y-3 animate-pulse"
        >
          <Loader2 class="h-8 w-8 animate-spin text-primary" />
          <p class="text-sm font-bold text-foreground">Drafting High-Conversion Ad Copy...</p>
          <p class="text-xs text-muted-foreground">Synthesizing commercial hooks, Amazon bullets & Instagram hashtags</p>
        </div>

        <!-- Generated Output Cards -->
        <div v-else-if="currentCopy" class="space-y-4">
          <!-- 1. Title Card -->
          <div class="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-muted-foreground uppercase tracking-wider">Listing Title</span>
              <button
                type="button"
                @click="copyToClipboard(currentCopy.title, 'title')"
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted hover:bg-muted/80 text-xs font-semibold text-foreground transition-all"
              >
                <Check v-if="copiedField === 'title'" class="h-3.5 w-3.5 text-emerald-500" />
                <Copy v-else class="h-3.5 w-3.5 text-muted-foreground" />
                <span>{{ copiedField === 'title' ? 'Copied' : 'Copy Title' }}</span>
              </button>
            </div>
            <textarea
              v-model="currentCopy.title"
              rows="2"
              class="w-full text-sm font-bold p-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary shadow-xs resize-none"
            ></textarea>
          </div>

          <!-- 2. Description Card -->
          <div class="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-muted-foreground uppercase tracking-wider">Product Narrative</span>
              <button
                type="button"
                @click="copyToClipboard(currentCopy.description, 'description')"
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted hover:bg-muted/80 text-xs font-semibold text-foreground transition-all"
              >
                <Check v-if="copiedField === 'description'" class="h-3.5 w-3.5 text-emerald-500" />
                <Copy v-else class="h-3.5 w-3.5 text-muted-foreground" />
                <span>{{ copiedField === 'description' ? 'Copied' : 'Copy Description' }}</span>
              </button>
            </div>
            <textarea
              v-model="currentCopy.description"
              rows="3"
              class="w-full text-xs p-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary shadow-xs resize-none"
            ></textarea>
          </div>

          <!-- 3. Five Amazon Bullets -->
          <div class="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-muted-foreground uppercase tracking-wider">5 Selling Bullet Points</span>
              <button
                type="button"
                @click="copyToClipboard(currentCopy.bullets.join('\n• '), 'bullets_all')"
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted hover:bg-muted/80 text-xs font-semibold text-foreground transition-all"
              >
                <Check v-if="copiedField === 'bullets_all'" class="h-3.5 w-3.5 text-emerald-500" />
                <Copy v-else class="h-3.5 w-3.5 text-muted-foreground" />
                <span>{{ copiedField === 'bullets_all' ? 'Copied' : 'Copy All Bullets' }}</span>
              </button>
            </div>

            <div class="space-y-2">
              <div
                v-for="(_, idx) in currentCopy.bullets"
                :key="idx"
                class="flex items-start gap-2"
              >
                <span class="text-xs font-mono font-bold text-primary px-2 py-2 shrink-0">#{{ idx + 1 }}</span>
                <input
                  v-model="currentCopy.bullets[idx]"
                  type="text"
                  class="flex-1 text-xs p-2.5 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                />
              </div>
            </div>
          </div>

          <!-- 4. Social Caption -->
          <div class="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-muted-foreground uppercase tracking-wider">Instagram / Social Caption</span>
              <button
                type="button"
                @click="copyToClipboard(currentCopy.caption, 'caption')"
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted hover:bg-muted/80 text-xs font-semibold text-foreground transition-all"
              >
                <Check v-if="copiedField === 'caption'" class="h-3.5 w-3.5 text-emerald-500" />
                <Copy v-else class="h-3.5 w-3.5 text-muted-foreground" />
                <span>{{ copiedField === 'caption' ? 'Copied' : 'Copy Caption' }}</span>
              </button>
            </div>
            <textarea
              v-model="currentCopy.caption"
              rows="2"
              class="w-full text-xs p-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary shadow-xs resize-none"
            ></textarea>
          </div>

          <!-- 5. Hashtags -->
          <div class="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-muted-foreground uppercase tracking-wider">Targeted Hashtags</span>
              <button
                type="button"
                @click="copyToClipboard(currentCopy.hashtags.join(' '), 'hashtags')"
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted hover:bg-muted/80 text-xs font-semibold text-foreground transition-all"
              >
                <Check v-if="copiedField === 'hashtags'" class="h-3.5 w-3.5 text-emerald-500" />
                <Copy v-else class="h-3.5 w-3.5 text-muted-foreground" />
                <span>{{ copiedField === 'hashtags' ? 'Copied' : 'Copy Hashtags' }}</span>
              </button>
            </div>

            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="(tag, idx) in currentCopy.hashtags"
                :key="idx"
                class="px-2.5 py-1 rounded-xl bg-muted text-[11px] font-mono text-muted-foreground"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
