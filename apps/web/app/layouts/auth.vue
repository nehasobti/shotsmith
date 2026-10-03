<script setup lang="ts">
import { useColorMode } from '~/composables/useColorMode';
import { Sun, Moon, Sparkles } from 'lucide-vue-next';

const { isDark, toggleDark } = useColorMode();
</script>

<template>
  <div class="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 selection:bg-primary/20 selection:text-primary relative overflow-hidden">
    <!-- Ambient glowing backdrop meshes -->
    <div class="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-violet-600/15 via-indigo-500/10 to-cyan-400/15 blur-[120px] pointer-events-none -z-10"></div>
    <div class="absolute -bottom-32 left-1/4 w-[500px] h-[400px] bg-primary/10 blur-[140px] pointer-events-none -z-10"></div>

    <div class="absolute top-5 right-5 z-20">
      <button
        @click="toggleDark"
        class="p-2.5 rounded-2xl border border-border/80 hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all backdrop-blur-md"
        :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        type="button"
      >
        <Sun v-if="isDark" class="h-4 w-4 text-amber-400" />
        <Moon v-else class="h-4 w-4 text-violet-600" />
      </button>
    </div>

    <!-- Brand Header -->
    <div class="mb-8 text-center">
      <NuxtLink to="/" class="group inline-flex items-center gap-2.5 font-extrabold text-2xl tracking-tight">
        <div class="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 text-white shadow-xl shadow-violet-500/25 group-hover:scale-105 transition-transform duration-200">
          <Sparkles class="h-6 w-6" />
          <div class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-background ring-1 ring-emerald-400/40"></div>
        </div>
        <div class="flex flex-col text-left">
          <span class="leading-none text-foreground flex items-center gap-1">
            ShopShot <span class="bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent font-black">AI</span>
          </span>
          <span class="text-[10px] font-mono tracking-wider uppercase text-muted-foreground mt-0.5">E-Commerce Studio</span>
        </div>
      </NuxtLink>
      <p class="text-xs text-muted-foreground mt-3">Transform product photos into high-converting marketing campaigns</p>
    </div>

    <!-- Main Card Container -->
    <div class="w-full max-w-md bg-card/85 backdrop-blur-2xl border border-border/80 rounded-3xl p-6 sm:p-9 shadow-2xl">
      <slot />
    </div>
  </div>
</template>
