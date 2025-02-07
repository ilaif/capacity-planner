import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { logger } from '@/services/loggerService';

type AuthState = {
  user: User | null;
  loadingAuthSession: boolean;
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  loadAuthSession: () => Promise<void>;
};

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  loadingAuthSession: false,
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
  loadAuthSession: async () => {
    set({ loadingAuthSession: true });
    logger.info('Getting auth session');
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    set({ user: data.session?.user ?? null, loadingAuthSession: false });
  },
}));
