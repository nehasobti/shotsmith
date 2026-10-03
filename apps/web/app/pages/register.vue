<script setup lang="ts">
import { ref } from 'vue';
import { signUp } from '~/lib/auth-client';
import { UserPlus, Loader2, Sparkles, CheckCircle2 } from 'lucide-vue-next';

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
    <div class="mb-5">
      <h1 class="text-2xl font-black tracking-tight text-foreground">Create your account</h1>
      <p class="text-xs text-muted-foreground mt-1">Get started with your free e-commerce studio</p>
    </div>

    <!-- Free credits badge -->
    <div class="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-violet-600/15 via-indigo-600/10 to-transparent border border-violet-500/30 flex items-center gap-3 text-xs text-foreground">
      <div class="w-8 h-8 rounded-xl bg-violet-600/20 text-violet-500 flex items-center justify-center shrink-0">
        <Sparkles class="h-4 w-4 text-amber-500 fill-amber-500 animate-pulse" />
      </div>
      <div>
        <span class="font-extrabold text-foreground">30 Free AI Credits</span>
        <p class="text-[11px] text-muted-foreground">Instantly credited to your ledger upon sign-up.</p>
      </div>
    </div>

    <div v-if="errorMessage" class="mb-4 p-3.5 rounded-2xl bg-destructive/10 text-destructive text-xs font-bold border border-destructive/20">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="handleRegister" class="space-y-4">
      <div>
        <label for="name" class="block text-xs font-bold text-foreground mb-1.5">Full Name</label>
        <input
          id="name"
          v-model="name"
          type="text"
          required
          placeholder="Jane Doe"
          class="w-full px-4 py-3 text-xs bg-background border border-input rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary shadow-xs transition-all"
        />
      </div>

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
        <label for="password" class="block text-xs font-bold text-foreground mb-1.5">Password (8+ chars)</label>
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
        class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/25 hover:scale-[1.01] mt-2"
      >
        <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
        <UserPlus v-else class="h-4 w-4" />
        <span>{{ isLoading ? 'Creating account...' : 'Create Account & Claim 30 Credits' }}</span>
      </button>
    </form>

    <p class="mt-6 text-center text-xs text-muted-foreground">
      Already have an account?
      <NuxtLink to="/login" class="font-bold text-primary hover:underline ml-1">
        Sign in
      </NuxtLink>
    </p>
  </div>
</template>
