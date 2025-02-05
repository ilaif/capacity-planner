import { useEffect, useState } from 'react';
import { usePlannerStore } from '@/store/plannerStore';
import { useAuthStore } from '@/store/authStore';
import { subscribeToPlanChanges } from '@/services/supabasePlanService';
import { logger } from '@/services/loggerService';
import { supabase } from '@/lib/supabase';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { Button } from '@/components/ui/button';
import { PlanNotFoundDialog } from '@/components/capacity-planner/PlanNotFoundDialog';
import { Loader2 } from 'lucide-react';
import { DEFAULT_STATE } from '@/types/capacity-planner';

export const SupabaseProvider = ({ children }: { children: React.ReactNode }) => {
  const { loadPlanById, isLoading, setState } = usePlannerStore();
  const { setUser, user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showNotFoundDialog, setShowNotFoundDialog] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const setupAuth = async () => {
      try {
        setIsAuthLoading(true);
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
      } finally {
        setIsAuthLoading(false);
      }
    };

    const cleanup = setupAuth();
    return () => {
      cleanup.then(unsubscribe => unsubscribe?.());
    };
  }, [setUser]);

  useEffect(() => {
    // Don't proceed if auth is still loading
    if (isAuthLoading) return;

    const loadPlan = async () => {
      const id = searchParams.get('id');

      if (id) {
        if (!user) {
          logger.info('Plan ID found but user not authenticated, showing auth dialog');
          setShowAuthDialog(true);
          return;
        }

        logger.info('Loading plan from URL', { id });
        const isPlanLoaded = await loadPlanById(id);
        if (!isPlanLoaded) {
          logger.warn('Plan not found', { id });
          setShowNotFoundDialog(true);
        }

        // Subscribe to changes
        const unsubscribe = subscribeToPlanChanges(id, newState => {
          logger.debug('Received state update from Supabase', { ...newState });
          loadPlanById(id);
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
  }, [searchParams, loadPlanById, user, setState, isAuthLoading]);

  if (isAuthLoading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading plan...</p>
          </div>
        </div>
      )}
      {showAuthDialog && !user && (
        <AuthDialog
          trigger={<Button className="hidden">Sign in</Button>}
          mode="default"
          defaultOpen={true}
        />
      )}
      <PlanNotFoundDialog
        open={showNotFoundDialog}
        onClose={() => {
          setShowNotFoundDialog(false);
          navigate('/');
        }}
      />
      {children}
    </>
  );
};
