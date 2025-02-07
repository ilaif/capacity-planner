import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { logger } from '@/services/loggerService';

export const useAuth = () => {
  const { setUser, user, loadingAuthSession } = useAuthStore();

  useEffect(() => {
    const setupAuth = async () => {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        logger.info('Auth state changed', { session });
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
  }, [setUser]);

  return { user, loadingAuthSession };
};
