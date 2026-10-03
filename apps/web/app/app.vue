<script setup lang="ts">
import { useColorMode } from '~/composables/useColorMode';

useColorMode();

useHead({
  title: 'ShopShot AI – E-Commerce Generative AI Creative Studio',
  meta: [
    {
      name: 'description',
      content: 'Turn one plain product photo into ready-to-publish marketing images and copy with generative AI.',
    },
    {
      name: 'theme-color',
      content: '#0b0d14',
    },
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=JetBrains+Mono:wght@400;500;600&display=swap',
    },
  ],
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
body {
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
code, kbd, samp, pre {
  font-family: 'JetBrains Mono', monospace;
}
</style>
