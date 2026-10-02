<script setup lang="ts">
import { useColorMode } from '~/composables/useColorMode';
import { Sun, Moon, Sparkles } from 'lucide-vue-next';

const { isDark, toggleDark } = useColorMode();
</script>

<template>
  <div class="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 selection:bg-primary selection:text-primary-foreground relative">
    <div class="absolute top-4 right-4">
      <button
        @click="toggleDark"
        class="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        type="button"
      >
        <Sun v-if="isDark" class="h-4 w-4" />
        <Moon v-else class="h-4 w-4" />
      </button>
    </div>

    <div class="mb-8 text-center">
      <NuxtLink to="/" class="inline-flex items-center gap-2 font-bold text-2xl tracking-tight">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Sparkles class="h-6 w-6" />
        </div>
        <span>ShopShot <span class="text-primary font-extrabold">AI</span></span>
      </NuxtLink>
      <p class="text-sm text-muted-foreground mt-2">Studio-grade e-commerce visuals in seconds</p>
    </div>

    <div class="w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
      <slot />
    </div>
  </div>
</template>
