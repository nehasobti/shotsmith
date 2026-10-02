<script setup lang="ts">
import { ref } from 'vue';
import { signUp } from '~/lib/auth-client';
import { UserPlus, Loader2, Sparkles } from 'lucide-vue-next';

definePageMeta({
  layout: 'auth',
});

const name = ref('');
const email = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref('');

const handleRegister = async () => {
  if (!name.value || !email.value || !password.value) {
    errorMessage.value = 'Please fill out all fields';
    return;
  }

  if (password.value.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters long';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const res = await signUp.email({
      name: name.value,
      email: email.value,
      password: password.value,
    });

    if (res.error) {
      errorMessage.value = res.error.message || 'Registration failed';
    } else {
      await navigateTo('/projects');
    }
  } catch (err: any) {
    errorMessage.value = err?.message || 'Registration failed. Please try again.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-xl font-bold tracking-tight">Create your account</h1>
      <p class="text-xs text-muted-foreground mt-1">Get started with your free e-commerce studio</p>
    </div>

    <!-- Free credits badge -->
    <div class="mb-5 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-2.5 text-xs text-primary">
      <Sparkles class="h-4 w-4 shrink-0 text-amber-500 fill-amber-500" />
      <div>
        <span class="font-bold">30 Free Credits</span> will be instantly added to your account upon registration.
      </div>
    </div>

    <div v-if="errorMessage" class="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="handleRegister" class="space-y-4">
      <div>
        <label for="name" class="block text-xs font-medium text-foreground mb-1.5">Your Name</label>
        <input
          id="name"
          v-model="name"
          type="text"
          required
          placeholder="Jane Doe"
          class="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
      </div>

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
        <label for="password" class="block text-xs font-medium text-foreground mb-1.5">Password (8+ chars)</label>
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
        class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm mt-2"
      >
        <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
        <UserPlus v-else class="h-4 w-4" />
        <span>{{ isLoading ? 'Creating account...' : 'Create account & claim 30 credits' }}</span>
      </button>
    </form>

    <p class="mt-6 text-center text-xs text-muted-foreground">
      Already have an account?
      <NuxtLink to="/login" class="font-semibold text-primary hover:underline ml-1">
        Sign in
      </NuxtLink>
    </p>
  </div>
</template>
