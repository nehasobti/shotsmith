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
              {{ balance !== null ? `${balance} credits` : '...' }}
            </span>
          </div>
        </div>

        <button
          type="button"
          @click="isModalOpen = true"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
        >
          <Plus class="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="py-24 text-center">
      <Loader2 class="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
      <p class="text-xs text-muted-foreground">Loading projects...</p>
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
          @click="isModalOpen = true"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all shadow-md"
        >
          <Plus class="h-4 w-4" />
          <span>Create your first project</span>
        </button>
      </div>
    </div>

    <!-- Projects Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      <div
        v-for="proj in projectsList"
        :key="proj.id"
        class="group relative rounded-2xl border border-border bg-card p-5 hover:border-primary/50 transition-all hover:shadow-md flex flex-col justify-between"
      >
        <div>
          <!-- Cover Thumbnail -->
          <NuxtLink :to="`/projects/${proj.id}`" class="block aspect-video w-full rounded-xl bg-muted overflow-hidden mb-4 border border-border relative">
            <img
              v-if="proj.coverAssetUrl"
              :src="proj.coverAssetUrl"
              :alt="proj.name"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-muted-foreground">
              <ImageIcon class="h-8 w-8" />
            </div>

            <div class="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-xs text-[10px] font-mono">
              {{ proj.imageCount }} {{ proj.imageCount === 1 ? 'image' : 'images' }}
            </div>
          </NuxtLink>

          <div class="flex items-start justify-between gap-2">
            <NuxtLink :to="`/projects/${proj.id}`" class="font-bold text-foreground group-hover:text-primary transition-colors text-base truncate">
              {{ proj.name }}
            </NuxtLink>

            <button
              type="button"
              @click="handleDeleteProject(proj.id, proj.name)"
              class="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete project"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>

          <p class="text-xs text-muted-foreground line-clamp-2 mt-1">
            {{ proj.productDescription || 'No description provided' }}
          </p>
        </div>

        <div class="flex items-center justify-between mt-5 pt-3 border-t border-border text-xs text-muted-foreground">
          <span>Updated {{ new Date(proj.updatedAt).toLocaleDateString() }}</span>
          <NuxtLink
            :to="`/projects/${proj.id}`"
            class="inline-flex items-center gap-1 font-semibold text-primary group-hover:translate-x-1 transition-transform"
          >
            Open Studio <ArrowRight class="h-3.5 w-3.5" />
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Create Project Modal Dialog -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
      @click.self="isModalOpen = false"
    >
      <div class="relative max-w-lg w-full bg-card rounded-3xl border border-border p-6 shadow-2xl space-y-5">
        <div class="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h2 class="text-lg font-bold text-foreground">Create New Project</h2>
            <p class="text-xs text-muted-foreground">Start a creative workspace for your product</p>
          </div>
          <button
            type="button"
            @click="isModalOpen = false"
            class="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <div v-if="modalError" class="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
          {{ modalError }}
        </div>

        <form @submit.prevent="handleCreateProject" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-foreground mb-1.5">Project Name *</label>
            <input
              v-model="newProjectName"
              type="text"
              required
              placeholder="e.g. Minimalist Ceramic Mug"
              class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-foreground mb-1.5">Product Description (Optional)</label>
            <textarea
              v-model="newProjectDescription"
              rows="2"
              placeholder="e.g. Matte black ceramic mug with ergonomic bamboo handle..."
              class="w-full text-xs p-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            ></textarea>
          </div>

          <div>
            <label class="block text-xs font-semibold text-foreground mb-1.5">Initial Product Photo (Optional)</label>
            <label
              class="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-colors bg-muted/20"
            >
              <UploadCloud class="h-6 w-6 text-muted-foreground mb-1.5" />
              <span class="text-xs font-medium text-foreground">
                {{ selectedInitialFile ? selectedInitialFile.name : 'Click to select photo (JPG, PNG, WebP)' }}
              </span>
              <span class="text-[10px] text-muted-foreground mt-0.5">Up to 10 MB</span>
              <input
                type="file"
                class="hidden"
                accept="image/jpeg,image/png,image/webp"
                @change="handleInitialFileSelected"
              />
            </label>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              @click="isModalOpen = false"
              class="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-muted text-muted-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all disabled:opacity-50 shadow-md"
            >
              <Loader2 v-if="isSubmitting" class="h-3.5 w-3.5 animate-spin" />
              <span>{{ isSubmitting ? 'Creating...' : 'Create Project' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
