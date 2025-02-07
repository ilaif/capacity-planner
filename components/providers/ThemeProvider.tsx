'use client';

import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Theme = 'dark' | 'light';

type ThemeStore = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    set => ({
      theme: getSystemTheme(),
      setTheme: theme => {
        set({ theme });
        // Directly update the class to avoid any delay
        document.documentElement.classList.toggle('dark', theme === 'dark');
      },
    }),
    {
      name: 'theme-store',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => state => {
        // When the store is rehydrated, ensure the theme is applied
        if (state) {
          document.documentElement.classList.toggle('dark', state.theme === 'dark');
        }
      },
    }
  )
);

type ThemeProviderProps = {
  children: React.ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);
  const { setTheme } = useThemeStore();

  // Set initial theme only if there's no stored theme
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme-store');
    if (!storedTheme) {
      setTheme(getSystemTheme());
    }
  }, [setTheme]);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <>{children}</>;
}
