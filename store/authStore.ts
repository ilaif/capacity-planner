import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isLoggingIn: boolean;
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  login: () => Promise<void>;
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  isLoggingIn: false,
  signInWithMagicLink: async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.href,
      },
    });
    if (error) throw error;
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null });
  },
  setUser: user => set({ user }),
  login: async () => {
    set({ isLoggingIn: true });
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    set({ user: data.session?.user ?? null, isLoggingIn: false });
  },
}));
