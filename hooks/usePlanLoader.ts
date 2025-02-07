import { useEffect, useState } from 'react';
import { usePlannerStore } from '@/store/plannerStore';
import { subscribeToPlanChanges } from '@/services/supabasePlanService';
import { logger } from '@/services/loggerService';
import { DEFAULT_STATE } from '@/types/capacity-planner';
import { User } from '@supabase/supabase-js';

export const usePlanLoader = (
  id: string | null,
  user: User | null,
  setShowNotFoundDialog: (show: boolean) => void
) => {
  const { loadPlanById, isLoading, setState } = usePlannerStore();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  useEffect(() => {
    const loadPlan = async () => {
      if (id) {
        if (!user) {
          logger.info('Plan ID found but user not authenticated, showing auth dialog');
          setShowAuthDialog(true);
          return;
        }

        logger.info('Loading plan from URL', { id });
        const isPlanLoaded = await loadPlanById(id, { showLoading: true });
        if (!isPlanLoaded) {
          logger.warn('Plan not found', { id });
          setShowNotFoundDialog(true);
        }

        // Subscribe to changes
        const unsubscribe = subscribeToPlanChanges(id, newState => {
          logger.debug('Received state update', { ...newState });
          loadPlanById(id, { showLoading: false });
        });

        return () => {
          unsubscribe();
        };
      } else {
        setState(DEFAULT_STATE);
        logger.info('No plan id found in URL, loading default state');
      }
    };

    loadPlan();
  }, [id, user, loadPlanById, setState, setShowNotFoundDialog]);

  return {
    isLoading,
    showAuthDialog,
  };
};
