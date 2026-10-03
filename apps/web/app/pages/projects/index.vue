<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSession } from '~/lib/auth-client';
import { useCredits } from '~/composables/useCredits';
import { useUpload } from '~/composables/useUpload';
import {
  FolderKanban,
  Plus,
  Sparkles,
  Coins,
  ArrowRight,
  Trash2,
  UploadCloud,
  X,
  Loader2,
  Image as ImageIcon,
  Zap,
} from 'lucide-vue-next';

interface ProjectItem {
  id: string;
  name: string;
  productDescription?: string | null;
  coverAssetId?: string | null;
  coverAssetUrl?: string | null;
  imageCount: number;
  createdAt: string;
  updatedAt: string;
}

const sessionData = useSession();
const { balance, fetchCredits } = useCredits();
const { isUploading, uploadProductPhoto } = useUpload();

const projectsList = ref<ProjectItem[]>([]);
const isLoading = ref(true);

// Modal state
const isModalOpen = ref(false);
const newProjectName = ref('');
const newProjectDescription = ref('');
const selectedInitialFile = ref<File | null>(null);
const isSubmitting = ref(false);
const modalError = ref<string | null>(null);

const fetchProjects = async () => {
  isLoading.value = true;
  try {
    const data = await $fetch<{ projects: ProjectItem[] }>('/api/projects');
    projectsList.value = data.projects;
  } catch (err) {
    console.error('Failed to load projects', err);
  } finally {
    isLoading.value = false;
  }
};

const handleInitialFileSelected = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectedInitialFile.value = target.files[0];
  }
};

const handleCreateProject = async () => {
  if (!newProjectName.value.trim()) {
    modalError.value = 'Please provide a project name.';
    return;
  }

  isSubmitting.value = true;
  modalError.value = null;

  try {
    // 1. Create project
    const res = await $fetch<{ project: { id: string } }>('/api/projects', {
      method: 'POST',
      body: {
        name: newProjectName.value.trim(),
        product_description: newProjectDescription.value.trim() || null,
      },
    });

    const projectId = res.project.id;

    // 2. Upload initial photo if selected
    if (selectedInitialFile.value) {
      await uploadProductPhoto(selectedInitialFile.value, projectId);
    }

    isModalOpen.value = false;
    newProjectName.value = '';
    newProjectDescription.value = '';
    selectedInitialFile.value = null;

    // 3. Navigate into studio
    await navigateTo(`/projects/${projectId}`);
  } catch (err: any) {
    modalError.value = err?.data?.message || err?.message || 'Failed to create project.';
  } finally {
    isSubmitting.value = false;
  }
};

const handleDeleteProject = async (id: string, name: string) => {
  if (!confirm(`Are you sure you want to delete project "${name}" and all its photos?`)) return;

  try {
    await $fetch(`/api/projects/${id}`, { method: 'DELETE' });
    projectsList.value = projectsList.value.filter((p) => p.id !== id);
  } catch (err) {
    console.error('Failed to delete project', err);
  }
};

onMounted(async () => {
  await Promise.all([fetchCredits(), fetchProjects()]);
});
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/80">
      <div>
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold uppercase tracking-wider mb-2">
          <FolderKanban class="h-3 w-3" />
          <span>Studio Projects</span>
        </div>
        <h1 class="text-3xl font-black tracking-tight text-foreground">Projects Workspace</h1>
        <p class="text-xs sm:text-sm text-muted-foreground mt-1">
          Organize your product photo shoots, AI lifestyle scenes, and marketing campaigns
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Credit Summary Card -->
        <div class="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-card border border-border/80 text-foreground shadow-xs">
          <div class="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-500">
            <Zap class="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
          </div>
          <div class="text-xs">
            <span class="text-muted-foreground block text-[10px] uppercase font-mono">Available Balance</span>
            <span class="font-bold text-foreground">
              {{ balance !== null ? `${balance} credits` : '...' }}
            </span>
          </div>
        </div>

        <button
          type="button"
          @click="isModalOpen = true"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-violet-500/20 hover:scale-[1.02]"
        >
          <Plus class="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="py-24 text-center">
      <Loader2 class="h-9 w-9 animate-spin text-primary mx-auto mb-2" />
      <p class="text-xs font-bold text-muted-foreground">Loading your projects...</p>
    </div>

    <!-- Empty Projects State -->
    <div
      v-else-if="projectsList.length === 0"
      class="my-12 rounded-3xl border border-dashed border-border/80 bg-card/40 p-12 text-center max-w-2xl mx-auto shadow-xs"
    >
      <div class="mx-auto flex h-18 w-18 items-center justify-center rounded-3xl bg-gradient-to-tr from-violet-600/15 to-indigo-500/15 border border-primary/20 text-primary mb-5 shadow-inner">
        <FolderKanban class="h-9 w-9 text-primary" />
      </div>
      <h3 class="text-xl font-black text-foreground tracking-tight">No projects created yet</h3>
      <p class="text-xs text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
        Upload your first plain product photo to automatically extract clean cut-outs, generate 3D lifestyle scenes, and create ad copy.
      </p>

      <div class="mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/80 border border-border/80 text-xs font-bold text-secondary-foreground shadow-xs">
        <Sparkles class="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
        <span>{{ balance !== null ? `${balance} credits ready to use` : '30 credits ready to use' }}</span>
      </div>

      <div class="mt-8">
        <button
          type="button"
          @click="isModalOpen = true"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-500/25 hover:scale-105"
        >
          <Plus class="h-4 w-4" />
          <span>Create your first project</span>
        </button>
      </div>
    </div>

    <!-- Projects Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="proj in projectsList"
        :key="proj.id"
        class="group relative rounded-3xl border border-border/80 bg-card p-5 hover:border-primary/50 transition-all hover:shadow-xl flex flex-col justify-between"
      >
        <div>
          <!-- Cover Thumbnail -->
          <NuxtLink :to="`/projects/${proj.id}`" class="block aspect-video w-full rounded-2xl bg-zinc-950/80 overflow-hidden mb-4 border border-border/80 relative bg-checkerboard">
            <img
              v-if="proj.coverAssetUrl"
              :src="proj.coverAssetUrl"
              :alt="proj.name"
              class="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-muted-foreground">
              <ImageIcon class="h-8 w-8" />
            </div>

            <div class="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-black/70 text-white backdrop-blur-md text-[10px] font-mono font-bold flex items-center gap-1 border border-white/10">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>{{ proj.imageCount }} {{ proj.imageCount === 1 ? 'asset' : 'assets' }}</span>
            </div>
          </NuxtLink>

          <div class="flex items-start justify-between gap-2">
            <NuxtLink :to="`/projects/${proj.id}`" class="font-extrabold text-foreground group-hover:text-primary transition-colors text-base truncate">
              {{ proj.name }}
            </NuxtLink>

            <button
              type="button"
              @click="handleDeleteProject(proj.id, proj.name)"
              class="p-1.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete project"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>

          <p class="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
            {{ proj.productDescription || 'No description provided yet.' }}
          </p>
        </div>

        <div class="flex items-center justify-between mt-6 pt-3.5 border-t border-border/80 text-xs text-muted-foreground">
          <span class="font-mono text-[11px]">Updated {{ new Date(proj.updatedAt).toLocaleDateString() }}</span>
          <NuxtLink
            :to="`/projects/${proj.id}`"
            class="inline-flex items-center gap-1 font-bold text-primary group-hover:translate-x-1 transition-transform"
          >
            <span>Open Studio</span>
            <ArrowRight class="h-3.5 w-3.5" />
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Create Project Modal Dialog -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      @click.self="isModalOpen = false"
    >
      <div class="relative max-w-lg w-full bg-card rounded-3xl border border-border p-6 sm:p-7 shadow-2xl space-y-6">
        <div class="flex items-center justify-between pb-3 border-b border-border/80">
          <div>
            <h2 class="text-xl font-black text-foreground tracking-tight">Create New Studio Project</h2>
            <p class="text-xs text-muted-foreground mt-0.5">Start a dedicated creative workspace for your product</p>
          </div>
          <button
            type="button"
            @click="isModalOpen = false"
            class="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <div v-if="modalError" class="p-3.5 rounded-2xl bg-destructive/10 text-destructive text-xs font-bold border border-destructive/20">
          {{ modalError }}
        </div>

        <form @submit.prevent="handleCreateProject" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-foreground mb-1.5">Project / Product Name *</label>
            <input
              v-model="newProjectName"
              type="text"
              required
              placeholder="e.g. Minimalist Ceramic Mug"
              class="w-full text-xs px-4 py-3 rounded-2xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-foreground mb-1.5">Product Description (Optional)</label>
            <textarea
              v-model="newProjectDescription"
              rows="2"
              placeholder="e.g. Matte black ceramic mug with ergonomic bamboo handle..."
              class="w-full text-xs p-3.5 rounded-2xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none shadow-xs"
            ></textarea>
          </div>

          <div>
            <label class="block text-xs font-bold text-foreground mb-1.5">Initial Product Photo (Optional)</label>
            <label
              class="flex flex-col items-center justify-center border-2 border-dashed border-border/80 rounded-2xl p-5 cursor-pointer hover:border-primary/50 transition-colors bg-muted/20"
            >
              <UploadCloud class="h-7 w-7 text-primary mb-2" />
              <span class="text-xs font-bold text-foreground text-center">
                {{ selectedInitialFile ? selectedInitialFile.name : 'Click to upload your product photo' }}
              </span>
              <span class="text-[10px] text-muted-foreground mt-0.5">JPG, PNG, or WebP up to 10 MB</span>
              <input
                type="file"
                class="hidden"
                accept="image/jpeg,image/png,image/webp"
                @change="handleInitialFileSelected"
              />
            </label>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-border/80">
            <button
              type="button"
              @click="isModalOpen = false"
              class="px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-muted text-muted-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-violet-500/25"
            >
              <Loader2 v-if="isSubmitting" class="h-3.5 w-3.5 animate-spin" />
              <span>{{ isSubmitting ? 'Creating Project...' : 'Launch Project Studio' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
