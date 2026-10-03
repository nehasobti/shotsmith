<script setup lang="ts">
import { ref } from 'vue';
import { useSession } from '~/lib/auth-client';
import {
  Sparkles,
  ArrowRight,
  UploadCloud,
  Wand2,
  Download,
  CheckCircle2,
  Scissors,
  Maximize,
  ShieldCheck,
  Zap,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Layers,
} from 'lucide-vue-next';

const sessionData = useSession();

// Interactive Hero Before/After Slider
const heroSliderPos = ref(52); // percentage

const sampleTransformations = [
  {
    name: 'Artisan Ceramic Tumbler',
    category: 'Home & Kitchen',
    scene: 'Carrara Marble Countertop',
    beforeUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    afterUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Minimalist Chrono Watch',
    category: 'Accessories',
    scene: 'Dark Volcanic Slate with Rim Light',
    beforeUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
    afterUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Hydrating Botanical Serum',
    category: 'Beauty & Skincare',
    scene: 'Sunlit Tropical Palm Shadow',
    beforeUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
    afterUrl: 'https://images.unsplash.com/photo-1608248597359-2e38c7f3956d?auto=format&fit=crop&w=800&q=80',
  },
];
</script>

<template>
  <div class="relative overflow-hidden selection:bg-primary/20 selection:text-primary">
    <!-- Ambient glowing backdrop meshes -->
    <div class="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-tr from-violet-600/15 via-indigo-500/10 to-cyan-400/15 blur-[120px] pointer-events-none -z-10"></div>
    <div class="absolute top-[40rem] -left-40 w-[600px] h-[600px] bg-primary/10 blur-[140px] pointer-events-none -z-10"></div>
    <div class="absolute top-[60rem] -right-40 w-[600px] h-[600px] bg-indigo-500/10 blur-[140px] pointer-events-none -z-10"></div>

    <!-- Hero Section -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20 text-center">
      <!-- Announcement Pill -->
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/80 backdrop-blur-md border border-border/80 text-xs font-bold text-foreground mb-8 shadow-xs hover:border-primary/50 transition-all cursor-pointer">
        <span class="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span class="text-primary font-black">ShopShot 2.0</span>
        <span class="text-border">|</span>
        <span class="text-muted-foreground font-normal">Next-Gen Commercial E-Commerce Studio</span>
        <ChevronRight class="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      <!-- Main Headline -->
      <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-5xl mx-auto leading-[1.08] text-foreground">
        Turn one plain product photo into
        <span class="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400">
          luxury commercial assets
        </span>
      </h1>

      <!-- Subheadline -->
      <p class="mt-6 text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed">
        Automatic background removal, 3D lifestyle scene generation, magic inpainting, 4K upscaling, and multilingual ad copywriting in one seamless workflow.
      </p>

      <!-- Primary Actions -->
      <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
        <NuxtLink
          :to="sessionData?.data?.user ? '/projects' : '/register'"
          class="group relative inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <span>{{ sessionData?.data?.user ? 'Open Studio Workspace' : 'Claim 30 Free Credits' }}</span>
          <ArrowRight class="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </NuxtLink>

        <NuxtLink
          to="/login"
          v-if="!sessionData?.data?.user"
          class="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-card hover:bg-muted/70 text-foreground font-bold text-sm border border-border shadow-xs hover:border-primary/40 transition-all"
        >
          <Sparkles class="h-4 w-4 text-amber-500 fill-amber-500" />
          <span>Quick Demo Login</span>
        </NuxtLink>
      </div>

      <!-- Value Pillars Strip -->
      <div class="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-muted-foreground">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 class="h-3.5 w-3.5" />
          </div>
          <span>30 Free Credits on Sign-up</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 class="h-3.5 w-3.5" />
          </div>
          <span>Product Shape & Label 100% Preserved</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 class="h-3.5 w-3.5" />
          </div>
          <span>Amazon & Shopify Ready Exports</span>
        </div>
      </div>

      <!-- Interactive Hero Before / After Slider Showcase -->
      <div class="mt-16 relative max-w-4xl mx-auto rounded-3xl p-2 sm:p-3 bg-gradient-to-b from-border/80 via-border/30 to-border/10 border border-border/80 shadow-2xl">
        <div class="relative aspect-16/9 w-full rounded-2xl overflow-hidden bg-black select-none shadow-inner">
          <!-- After (Studio Scene Transformation) -->
          <img
            src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=85"
            alt="AI Generated Studio Scene"
            class="absolute inset-0 w-full h-full object-cover"
          />

          <!-- Before (Plain Cut-out Photo) clipped by slider -->
          <div
            class="absolute inset-0 overflow-hidden"
            :style="{ clipPath: `inset(0 ${100 - heroSliderPos}% 0 0)` }"
          >
            <div class="absolute inset-0 bg-zinc-950/90 bg-checkerboard flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=85"
                alt="Original Plain Photo"
                class="max-h-[85%] object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          <!-- Divider Handle -->
          <div
            class="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(0,0,0,0.8)] z-20 pointer-events-none"
            :style="{ left: `${heroSliderPos}%` }"
          >
            <div class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-zinc-900 shadow-xl flex items-center justify-center text-xs font-black">
              ↔
            </div>
          </div>

          <!-- Slider control range input over entire image -->
          <input
            v-model="heroSliderPos"
            type="range"
            min="5"
            max="95"
            class="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
          />

          <!-- Corner labels -->
          <div class="absolute bottom-4 left-4 z-20 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-mono font-bold flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
            Before: Plain Cut-out
          </div>
          <div class="absolute bottom-4 right-4 z-20 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-mono font-bold flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-indigo-400"></span>
            After: Marble Studio Scene
          </div>
        </div>
      </div>
      <p class="text-xs text-muted-foreground mt-3 font-mono">
        Drag slider left and right to inspect precision lighting and reflection generation
      </p>
    </section>

    <!-- 3-Step "Upload -> Generate -> Export" -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-border/80">
      <div class="text-center max-w-2xl mx-auto mb-16">
        <span class="text-xs font-extrabold uppercase tracking-widest text-primary">The Creative Pipeline</span>
        <h2 class="text-3xl sm:text-4xl font-black tracking-tight mt-2 text-foreground">
          From single phone photo to multi-channel launch in 3 steps
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Step 1 -->
        <div class="group relative rounded-3xl border border-border/80 bg-card p-8 shadow-xs hover:border-primary/50 transition-all hover:shadow-lg">
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white mb-6 shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
            <UploadCloud class="h-7 w-7" />
          </div>
          <span class="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider">Step 01</span>
          <h3 class="text-lg font-bold text-foreground mt-1">Instant Cut-Out Extraction</h3>
          <p class="text-xs text-muted-foreground mt-2 leading-relaxed">
            Upload any catalog or smartphone photo. The AI edge-detection model instantly generates a clean transparent PNG cut-out with sub-pixel precision.
          </p>
        </div>

        <!-- Step 2 -->
        <div class="group relative rounded-3xl border border-border/80 bg-card p-8 shadow-xs hover:border-primary/50 transition-all hover:shadow-lg">
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white mb-6 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Wand2 class="h-7 w-7" />
          </div>
          <span class="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider">Step 02</span>
          <h3 class="text-lg font-bold text-foreground mt-1">Contextual Scene Generation</h3>
          <p class="text-xs text-muted-foreground mt-2 leading-relaxed">
            Select luxury marble, organic rustic oak, tropical beach, or custom text prompts. Get 4 hyper-realistic variations with matching cast shadows and reflections.
          </p>
        </div>

        <!-- Step 3 -->
        <div class="group relative rounded-3xl border border-border/80 bg-card p-8 shadow-xs hover:border-primary/50 transition-all hover:shadow-lg">
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-500 text-white mb-6 shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Download class="h-7 w-7" />
          </div>
          <span class="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider">Step 03</span>
          <h3 class="text-lg font-bold text-foreground mt-1">Marketplace ZIP Bundle</h3>
          <p class="text-xs text-muted-foreground mt-2 leading-relaxed">
            Batch-crop and export for Amazon (pure white #ffffff), Shopify square, Instagram 1:1 post, and 9:16 vertical stories in a single compressed ZIP download.
          </p>
        </div>
      </div>
    </section>

    <!-- Preset Showcase Section -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-border/80">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <span class="text-xs font-extrabold uppercase tracking-widest text-primary">Pre-Engineered Presets</span>
          <h2 class="text-3xl font-black tracking-tight mt-1 text-foreground">
            Commercial environments tuned for high conversion
          </h2>
        </div>
        <NuxtLink
          :to="sessionData?.data?.user ? '/projects' : '/register'"
          class="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
        >
          <span>Explore in Studio</span>
          <ArrowRight class="h-3.5 w-3.5" />
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="item in sampleTransformations"
          :key="item.name"
          class="group rounded-3xl border border-border/80 bg-card overflow-hidden hover:border-primary/50 transition-all hover:shadow-md"
        >
          <div class="aspect-4/3 overflow-hidden relative bg-muted">
            <img
              :src="item.afterUrl"
              :alt="item.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div class="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
              {{ item.category }}
            </div>
          </div>
          <div class="p-5">
            <h4 class="font-bold text-foreground text-sm">{{ item.name }}</h4>
            <p class="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <Sparkles class="h-3 w-3 text-primary" />
              <span>Scene: {{ item.scene }}</span>
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Bottom CTA Banner -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div class="relative rounded-3xl overflow-hidden bg-gradient-to-tr from-violet-900/60 via-indigo-950/80 to-zinc-950 border border-violet-500/30 p-8 sm:p-14 text-center text-white shadow-2xl">
        <div class="absolute -top-32 -left-32 w-80 h-80 bg-violet-500/20 blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-32 -right-32 w-80 h-80 bg-cyan-500/20 blur-3xl pointer-events-none"></div>

        <div class="relative z-10 max-w-2xl mx-auto space-y-5">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold">
            <Sparkles class="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            <span>Instant Access • 30 Free Credits Included</span>
          </div>

          <h2 class="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Ready to transform your product catalog?
          </h2>

          <p class="text-xs sm:text-sm text-zinc-300 max-w-lg mx-auto leading-relaxed">
            Join modern e-commerce brands creating studio-grade product imagery without expensive photoshoots.
          </p>

          <div class="pt-4 flex flex-wrap items-center justify-center gap-4">
            <NuxtLink
              :to="sessionData?.data?.user ? '/projects' : '/register'"
              class="px-8 py-3.5 rounded-2xl bg-white text-zinc-950 font-bold text-sm hover:bg-zinc-100 transition-all shadow-xl hover:scale-105"
            >
              Start Creating Free
            </NuxtLink>
            <NuxtLink
              to="/login"
              v-if="!sessionData?.data?.user"
              class="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm backdrop-blur-md border border-white/20 transition-all"
            >
              Live Demo Login
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
