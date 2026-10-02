import { ref } from 'vue';

export function useCredits() {
  const balance = ref<number | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchCredits = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const data = await $fetch<{ balance: number; recentTransactions: any[] }>('/api/credits');
      balance.value = data.balance;
    } catch (err: any) {
      error.value = err?.data?.message || err?.message || 'Failed to fetch credits';
      balance.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    balance,
    isLoading,
    error,
    fetchCredits,
  };
}
