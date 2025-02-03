import { useEffect } from 'react';
import { usePlannerStore } from '@/store/plannerStore';
import { useAuthStore } from '@/store/authStore';
import { subscribeToPlanChanges } from '@/services/supabasePlanService';
import { logger } from '@/services/loggerService';
import { supabase } from '@/lib/supabase';
import { useSearchParams } from 'react-router-dom';

export const SupabaseProvider = ({ children }: { children: React.ReactNode }) => {
  const { loadStateById } = usePlannerStore();
  const { setUser } = useAuthStore();
  const [searchParams] = useSearchParams();

  // Watch for URL changes
  useEffect(() => {
    const id = searchParams.get('id');

    if (id) {
      logger.info('Loading plan from URL', { id });
      loadStateById(id);

      // Subscribe to changes
      const unsubscribe = subscribeToPlanChanges(id, newState => {
        logger.debug('Received state update from Supabase', { ...newState });
        loadStateById(id);
      });

      return () => {
        unsubscribe();
      };
    } else {
      logger.info('No plan id found in URL');
    }
  }, [searchParams, loadStateById]);

  useEffect(() => {
    const setupAuth = async () => {
      // Set initial user
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      // Listen for auth changes
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
  }, [setUser]);

  return <>{children}</>;
};
