<script setup lang="ts">
import { ref } from 'vue';
import { signIn } from '~/lib/auth-client';
import { LogIn, Loader2, Sparkles } from 'lucide-vue-next';

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
      <h1 class="text-xl font-bold tracking-tight">Welcome back</h1>
      <p class="text-xs text-muted-foreground mt-1">Sign in to your account to continue creating</p>
    </div>

    <div v-if="errorMessage" class="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="handleLogin" class="space-y-4">
      <div>
        <label for="email" class="block text-xs font-medium text-foreground mb-1.5">Email address</label>
        <input
          id="email"
          v-model="email"
          type="email"
          required
          placeholder="you@company.com"
          class="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
      </div>

      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label for="password" class="block text-xs font-medium text-foreground">Password</label>
        </div>
        <input
          id="password"
          v-model="password"
          type="password"
          required
          placeholder="••••••••"
          class="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
      </div>

      <button
        type="submit"
        :disabled="isLoading"
        class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
      >
        <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
        <LogIn v-else class="h-4 w-4" />
        <span>{{ isLoading ? 'Signing in...' : 'Sign in' }}</span>
      </button>

      <div class="relative my-4">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-border"></div>
        </div>
        <div class="relative flex justify-center text-xs uppercase">
          <span class="bg-card px-2 text-muted-foreground font-medium">Or</span>
        </div>
      </div>

      <button
        type="button"
        @click="handleDemoLogin"
        :disabled="isLoading"
        class="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-secondary-foreground text-xs font-semibold transition-colors"
      >
        <Sparkles class="h-3.5 w-3.5 text-amber-500" />
        <span>Quick Demo Login (30 Credits)</span>
      </button>
    </form>

    <p class="mt-6 text-center text-xs text-muted-foreground">
      Don't have an account?
      <NuxtLink to="/register" class="font-semibold text-primary hover:underline ml-1">
        Sign up
      </NuxtLink>
    </p>
  </div>
</template>
