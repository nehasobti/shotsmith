<script setup lang="ts">
import { ref } from 'vue';
import { signIn } from '~/lib/auth-client';
import { LogIn, Loader2, Sparkles, ArrowRight } from 'lucide-vue-next';

definePageMeta({
  layout: 'auth',
});

const email = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref('');

const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = 'Please provide both email and password';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const res = await signIn.email({
      email: email.value,
      password: password.value,
    });

    if (res.error) {
      errorMessage.value = res.error.message || 'Invalid email or password';
    } else {
      await navigateTo('/projects');
    }
  } catch (err: any) {
    errorMessage.value = err?.message || 'Login failed. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const handleDemoLogin = async () => {
  email.value = 'demo@shopshot.dev';
  password.value = 'demo123456';
  await handleLogin();
};
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-black tracking-tight text-foreground">Welcome back</h1>
      <p class="text-xs text-muted-foreground mt-1">Sign in to your studio to continue creating</p>
    </div>

    <div v-if="errorMessage" class="mb-4 p-3.5 rounded-2xl bg-destructive/10 text-destructive text-xs font-bold border border-destructive/20">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="handleLogin" class="space-y-4">
      <div>
        <label for="email" class="block text-xs font-bold text-foreground mb-1.5">Email address</label>
        <input
          id="email"
          v-model="email"
          type="email"
          required
          placeholder="you@company.com"
          class="w-full px-4 py-3 text-xs bg-background border border-input rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary shadow-xs transition-all"
        />
      </div>

      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label for="password" class="block text-xs font-bold text-foreground">Password</label>
        </div>
        <input
          id="password"
          v-model="password"
          type="password"
          required
          placeholder="••••••••"
          class="w-full px-4 py-3 text-xs bg-background border border-input rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary shadow-xs transition-all"
        />
      </div>

      <button
        type="submit"
        :disabled="isLoading"
        class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/25 hover:scale-[1.01]"
      >
        <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
        <LogIn v-else class="h-4 w-4" />
        <span>{{ isLoading ? 'Signing in...' : 'Sign in to Workspace' }}</span>
      </button>

      <div class="relative my-4">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-border/80"></div>
        </div>
        <div class="relative flex justify-center text-[11px] uppercase font-mono">
          <span class="bg-card px-2.5 text-muted-foreground font-semibold">Or Instant Access</span>
        </div>
      </div>

      <button
        type="button"
        @click="handleDemoLogin"
        :disabled="isLoading"
        class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-border/80 bg-secondary/60 hover:bg-secondary text-secondary-foreground text-xs font-bold transition-all hover:border-primary/50 shadow-xs"
      >
        <Sparkles class="h-4 w-4 text-amber-500 fill-amber-500" />
        <span>Quick Demo Login (30 Free Credits)</span>
      </button>
    </form>

    <p class="mt-6 text-center text-xs text-muted-foreground">
      Don't have an account yet?
      <NuxtLink to="/register" class="font-bold text-primary hover:underline ml-1">
        Sign up for free
      </NuxtLink>
    </p>
  </div>
</template>
