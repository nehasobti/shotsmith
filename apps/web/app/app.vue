<script setup lang="ts">
import { useColorMode } from '~/composables/useColorMode';

useColorMode();

useHead({
  title: 'ShopShot AI – E-Commerce Generative AI Studio',
  meta: [
    {
      name: 'description',
      content: 'Turn one plain product photo into ready-to-publish marketing images and copy with generative AI.',
    },
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
  ],
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
