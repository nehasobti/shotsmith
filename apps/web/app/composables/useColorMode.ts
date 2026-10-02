import { ref, onMounted } from 'vue';

const isDark = ref(false);

export function useColorMode() {
  const toggleDark = () => {
    isDark.value = !isDark.value;
    updateTheme();
  };

  const setDark = (val: boolean) => {
    isDark.value = val;
    updateTheme();
  };

  const updateTheme = () => {
    if (typeof window === 'undefined') return;
    if (isDark.value) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('shotsmith_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('shotsmith_theme', 'light');
    }
  };

  onMounted(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shotsmith_theme');
      if (saved) {
        isDark.value = saved === 'dark';
      } else {
        isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      updateTheme();
    }
  });

  return {
    isDark,
    toggleDark,
    setDark,
  };
}
