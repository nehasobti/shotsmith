<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useSession, signOut } from '~/lib/auth-client';
import { useColorMode } from '~/composables/useColorMode';
import { useCredits } from '~/composables/useCredits';
import {
  Sun,
  Moon,
  Sparkles,
  Coins,
  LogOut,
  FolderKanban,
  User as UserIcon,
} from 'lucide-vue-next';

const sessionData = useSession();
const { isDark, toggleDark } = useColorMode();
const { balance, fetchCredits } = useCredits();

const handleSignOut = async () => {
  await signOut();
  navigateTo('/login');
};

onMounted(() => {
  if (sessionData.value?.data?.user) {
    fetchCredits();
  }
});

watch(
  () => sessionData.value?.data?.user,
  (newUser) => {
    if (newUser) {
      fetchCredits();
    }
  }
);
</script>

<template>
  <header class="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
    <div class="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
      <!-- Brand -->
      <div class="flex items-center gap-6">
        <NuxtLink to="/" class="flex items-center gap-2 font-bold text-lg tracking-tight">
          <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Sparkles class="h-5 w-5" />
          </div>
          <span>ShopShot <span class="text-primary font-extrabold">AI</span></span>
        </NuxtLink>

        <nav v-if="sessionData?.data?.user" class="hidden md:flex items-center gap-4 text-sm font-medium">
          <NuxtLink
            to="/projects"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors hover:text-foreground text-muted-foreground hover:bg-muted"
            active-class="!text-foreground !bg-muted font-semibold"
          >
            <FolderKanban class="h-4 w-4" />
            <span>Projects</span>
          </NuxtLink>
        </nav>
      </div>

      <!-- Right actions -->
      <div class="flex items-center gap-3">
        <!-- Credit Badge -->
        <div
          v-if="sessionData?.data?.user"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-muted border border-border text-foreground transition-all hover:border-primary/50 shadow-sm"
          title="Available Generative AI Credits"
        >
          <Coins class="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
          <span>{{ balance !== null ? `${balance} credits` : '...' }}</span>
        </div>

        <!-- Dark mode toggle -->
        <button
          @click="toggleDark"
          class="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          type="button"
          aria-label="Toggle color mode"
        >
          <Sun v-if="isDark" class="h-4 w-4" />
          <Moon v-else class="h-4 w-4" />
        </button>

        <!-- User Menu / Auth actions -->
        <template v-if="sessionData?.data?.user">
          <div class="flex items-center gap-2 border-l border-border pl-3">
            <div class="flex items-center gap-2">
              <div class="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold border border-border">
                <UserIcon class="h-4 w-4 text-muted-foreground" />
              </div>
              <span class="text-sm font-medium hidden sm:inline-block max-w-[120px] truncate">
                {{ sessionData.data.user.name || sessionData.data.user.email }}
              </span>
            </div>
            <button
              @click="handleSignOut"
              class="p-2 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
              title="Sign Out"
              type="button"
            >
              <LogOut class="h-4 w-4" />
            </button>
          </div>
        </template>
        <template v-else>
          <div class="flex items-center gap-2">
            <NuxtLink
              to="/login"
              class="text-sm font-medium px-3 py-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              Log in
            </NuxtLink>
            <NuxtLink
              to="/register"
              class="text-sm font-medium px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              Sign up
            </NuxtLink>
          </div>
        </template>
      </div>
    </div>
  </header>
</template>
