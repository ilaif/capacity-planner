import { useAuth } from '@/hooks/useSupabaseAuth';
import { usePlanLoader } from '@/hooks/usePlanLoader';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { Button } from '@/components/ui/button';
import { PlanNotFoundDialog } from '@/components/capacity-planner/PlanNotFoundDialog';
import { Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';

export const SupabaseProvider = ({ children }: { children: React.ReactNode }) => {
  const [searchParams] = useSearchParams();
  const { user, loadingAuthSession } = useAuth();
  const navigate = useNavigate();
  const [showNotFoundDialog, setShowNotFoundDialog] = useState(false);
  const planId = searchParams.get('id');
  const { isLoading, showAuthDialog } = usePlanLoader(planId, user, setShowNotFoundDialog);

  if (loadingAuthSession) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Authenticating...</p>
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
