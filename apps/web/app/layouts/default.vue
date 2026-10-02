<script setup lang="ts">
import Navbar from '~/components/Navbar.vue';
</script>

<template>
  <div class="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-primary-foreground">
    <Navbar />
    <main class="flex-1">
      <slot />
    </main>
    <footer class="border-t border-border py-6 text-center text-xs text-muted-foreground">
      <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>&copy; {{ new Date().getFullYear() }} ShopShot AI. All rights reserved.</p>
        <p class="text-xs">Turn product photos into studio-grade marketing assets.</p>
      </div>
    </footer>
  </div>
</template>
