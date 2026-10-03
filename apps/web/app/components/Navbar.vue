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
  ChevronRight,
  Zap,
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
  <header class="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl transition-all">
    <div class="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
      <!-- Brand & Navigation -->
      <div class="flex items-center gap-8">
        <NuxtLink to="/" class="group flex items-center gap-2.5 font-extrabold text-lg tracking-tight">
          <div class="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 text-white shadow-lg shadow-violet-500/25 group-hover:scale-105 transition-transform duration-200">
            <Sparkles class="h-5 w-5" />
            <div class="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background ring-1 ring-emerald-400/40"></div>
          </div>
          <div class="flex flex-col">
            <span class="leading-none text-foreground flex items-center gap-1">
              ShopShot <span class="bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent font-black">AI</span>
            </span>
            <span class="text-[9px] font-mono tracking-wider uppercase text-muted-foreground mt-0.5">Creative Studio</span>
          </div>
        </NuxtLink>

        <nav v-if="sessionData?.data?.user" class="hidden md:flex items-center gap-1.5 text-xs font-semibold">
          <NuxtLink
            to="/projects"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all hover:text-foreground text-muted-foreground hover:bg-muted/60"
            active-class="!text-foreground !bg-muted/90 shadow-2xs font-bold"
          >
            <FolderKanban class="h-3.5 w-3.5 text-primary" />
            <span>Projects Hub</span>
          </NuxtLink>
        </nav>
      </div>

      <!-- Right actions: Credits, Theme, User Profile -->
      <div class="flex items-center gap-3">
        <!-- Credit Pill Badge -->
        <div
          v-if="sessionData?.data?.user"
          class="relative flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-muted/80 hover:bg-muted border border-border/80 text-foreground transition-all shadow-xs cursor-pointer group"
          title="Generative AI Available Balance"
          @click="fetchCredits"
        >
          <div class="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/15 text-amber-500">
            <Zap class="h-3 w-3 fill-amber-500 text-amber-500 animate-pulse" />
          </div>
          <span class="font-mono text-xs">
            {{ balance !== null ? balance : '...' }}
          </span>
          <span class="text-muted-foreground text-[11px] font-medium hidden sm:inline">credits</span>
        </div>

        <!-- Dark/Light mode toggle -->
        <button
          @click="toggleDark"
          class="p-2 rounded-xl border border-border/60 hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all"
          :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          type="button"
          aria-label="Toggle color mode"
        >
          <Sun v-if="isDark" class="h-4 w-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
          <Moon v-else class="h-4 w-4 text-violet-600 transition-transform rotate-0 hover:-rotate-12" />
        </button>

        <!-- User Menu / Auth actions -->
        <template v-if="sessionData?.data?.user">
          <div class="flex items-center gap-2 border-l border-border/80 pl-3">
            <div class="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-muted/50 transition-colors">
              <div class="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {{ (sessionData.data.user.name || sessionData.data.user.email || 'U').charAt(0).toUpperCase() }}
              </div>
              <span class="text-xs font-bold hidden sm:inline-block max-w-[110px] truncate text-foreground">
                {{ sessionData.data.user.name || sessionData.data.user.email.split('@')[0] }}
              </span>
            </div>

            <button
              @click="handleSignOut"
              class="p-2 rounded-xl hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
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
              class="text-xs font-semibold px-3 py-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </NuxtLink>
            <NuxtLink
              to="/register"
              class="text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-500/20 transition-all hover:scale-[1.02]"
            >
              Get Started Free
            </NuxtLink>
          </div>
        </template>
      </div>
    </div>
  </header>
</template>
