import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

export const useAuth = () => {
  const { setUser, user, login, isLoggingIn } = useAuthStore();

  useEffect(() => {
    login();

    const setupAuth = async () => {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
      return () => {
        subscription.unsubscribe();
      };
    };

    const cleanup = setupAuth();
    return () => {
      cleanup.then(unsubscribe => unsubscribe?.());
    };
  }, [setUser, login]);

  return { user, isLoggingIn };
};
