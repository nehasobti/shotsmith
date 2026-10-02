<script setup lang="ts">
import { useSession } from '~/lib/auth-client';
import {
  Sparkles,
  ArrowRight,
  UploadCloud,
  Wand2,
  Download,
  CheckCircle2,
  Layers,
  Zap,
} from 'lucide-vue-next';

const sessionData = useSession();
</script>

<template>
  <div class="relative overflow-hidden">
    <!-- Background glow -->
    <div class="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-primary/15 to-transparent blur-3xl pointer-events-none -z-10"></div>

    <!-- Hero Section -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary text-secondary-foreground border border-border text-xs font-semibold mb-6 shadow-sm">
        <Sparkles class="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
        <span>E-Commerce Generative AI Studio • 30 Free Credits</span>
      </div>

      <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1]">
        Turn one plain product photo into
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
          ready-to-publish marketing assets
        </span>
      </h1>

      <p class="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        Automatic background removal, 3D contextual scene generation, precision magic inpainting, 4× upscaling, and multilingual ad copywriting in one seamless workflow.
      </p>

      <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
        <NuxtLink
          :to="sessionData?.data?.user ? '/projects' : '/register'"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-md hover:scale-[1.02]"
        >
          <span>{{ sessionData?.data?.user ? 'Open Studio' : 'Start Creating Free' }}</span>
          <ArrowRight class="h-4 w-4" />
        </NuxtLink>

        <NuxtLink
          to="/login"
          v-if="!sessionData?.data?.user"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold text-sm border border-border transition-all"
        >
          <span>Live Demo Login</span>
        </NuxtLink>
      </div>

      <!-- Trust highlights -->
      <div class="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-muted-foreground">
        <div class="flex items-center gap-1.5">
          <CheckCircle2 class="h-4 w-4 text-emerald-500" />
          <span>No credit card required</span>
        </div>
        <div class="flex items-center gap-1.5">
          <CheckCircle2 class="h-4 w-4 text-emerald-500" />
          <span>Product identity 100% preserved</span>
        </div>
        <div class="flex items-center gap-1.5">
          <CheckCircle2 class="h-4 w-4 text-emerald-500" />
          <span>30 free credits included</span>
        </div>
      </div>
    </section>

    <!-- 3-Step "Upload -> Generate -> Export" -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-border">
      <div class="text-center max-w-2xl mx-auto mb-16">
        <h2 class="text-xs font-bold uppercase tracking-wider text-primary">How It Works</h2>
        <h3 class="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
          From photo to multichannel campaign in 3 clicks
        </h3>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Step 1 -->
        <div class="relative rounded-2xl border border-border bg-card p-8 shadow-sm hover:border-primary/50 transition-all">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-6">
            <UploadCloud class="h-6 w-6" />
          </div>
          <span class="text-xs font-bold text-muted-foreground uppercase">Step 01</span>
          <h4 class="text-lg font-bold text-foreground mt-1">Upload Product Photo</h4>
          <p class="text-sm text-muted-foreground mt-2">
            Upload any standard phone or catalog photo (JPG, PNG, WebP). Automatic transparent cut-out in 1 click.
          </p>
        </div>

        <!-- Step 2 -->
        <div class="relative rounded-2xl border border-border bg-card p-8 shadow-sm hover:border-primary/50 transition-all">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-6">
            <Wand2 class="h-6 w-6" />
          </div>
          <span class="text-xs font-bold text-muted-foreground uppercase">Step 02</span>
          <h4 class="text-lg font-bold text-foreground mt-1">Generate Scenes & Copy</h4>
          <p class="text-sm text-muted-foreground mt-2">
            Pick from curated studio presets (marble, rustic wood, beach, festive) and generate 4 variations plus high-converting ad copy.
          </p>
        </div>

        <!-- Step 3 -->
        <div class="relative rounded-2xl border border-border bg-card p-8 shadow-sm hover:border-primary/50 transition-all">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-6">
            <Download class="h-6 w-6" />
          </div>
          <span class="text-xs font-bold text-muted-foreground uppercase">Step 03</span>
          <h4 class="text-lg font-bold text-foreground mt-1">Export Marketplace ZIP</h4>
          <p class="text-sm text-muted-foreground mt-2">
            Export ready-to-upload aspect ratios for Amazon, Shopify, Instagram post, and Story in a single packaged ZIP.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
