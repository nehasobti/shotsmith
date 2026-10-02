<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSession } from '~/lib/auth-client';
import { useCredits } from '~/composables/useCredits';
import {
  FolderKanban,
  Plus,
  Sparkles,
  Coins,
  ArrowRight,
  Layers,
  Image as ImageIcon,
} from 'lucide-vue-next';

const sessionData = useSession();
const { balance, fetchCredits } = useCredits();

const projectsList = ref<any[]>([]);
const isLoading = ref(true);

const fetchProjects = async () => {
  isLoading.value = true;
  try {
    const data = await $fetch<{ projects: any[] }>('/api/projects');
    projectsList.value = data.projects;
  } catch (err) {
    console.error('Failed to load projects', err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  // Give session moment to resolve or redirect
  await fetchCredits();
  await fetchProjects();
});
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Your Projects</h1>
        <p class="text-sm text-muted-foreground mt-1">
          Manage product visual assets, AI scenes, and marketing campaigns
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Credit summary card -->
        <div class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-card border border-border text-card-foreground shadow-sm">
          <Coins class="h-4 w-4 text-amber-500 fill-amber-500" />
          <div class="text-xs">
            <span class="text-muted-foreground">Available balance: </span>
            <span class="font-bold text-foreground">
              {{ balance !== null ? `${balance} credits` : 'Loading...' }}
            </span>
          </div>
        </div>

        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all shadow-sm"
          title="New project creation will be available in Phase 2"
        >
          <Plus class="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="py-24 text-center">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p class="text-sm text-muted-foreground mt-3">Loading projects...</p>
    </div>

    <!-- Empty Projects State -->
    <div
      v-else-if="projectsList.length === 0"
      class="my-12 rounded-3xl border border-dashed border-border bg-card/50 p-12 text-center max-w-2xl mx-auto"
    >
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
        <FolderKanban class="h-8 w-8" />
      </div>
      <h3 class="text-lg font-bold text-foreground">No projects yet</h3>
      <p class="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">
        Upload your first plain product photo to generate background cut-outs, lifestyle scenes, and marketing copy.
      </p>

      <div class="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 border border-border text-xs font-semibold text-secondary-foreground">
        <Sparkles class="h-3.5 w-3.5 text-amber-500" />
        <span>{{ balance !== null ? `${balance} credits ready to use` : '30 credits ready to use' }}</span>
      </div>

      <div class="mt-8">
        <button
          type="button"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all shadow-md"
        >
          <Plus class="h-4 w-4" />
          <span>Create your first project</span>
        </button>
      </div>
    </div>

    <!-- Projects Grid (When populated) -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      <div
        v-for="project in projectsList"
        :key="project.id"
        class="group relative rounded-2xl border border-border bg-card p-5 hover:border-primary/50 transition-all hover:shadow-md cursor-pointer"
      >
        <div class="aspect-video w-full rounded-xl bg-muted overflow-hidden flex items-center justify-center mb-4 border border-border">
          <ImageIcon class="h-8 w-8 text-muted-foreground" />
        </div>
        <h4 class="font-bold text-foreground group-hover:text-primary transition-colors">
          {{ project.name }}
        </h4>
        <p class="text-xs text-muted-foreground line-clamp-2 mt-1">
          {{ project.productDescription || 'No description provided' }}
        </p>
        <div class="flex items-center justify-between mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
          <span>{{ project.imageCount || 0 }} images</span>
          <span class="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Open Studio <ArrowRight class="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
