import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { useAuthStore } from '@/store/authStore';
import { usePlannerStore } from '@/store/plannerStore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { generatePlanId, getCurrentPlanId, setCurrentPlanId } from '@/services/planIdService';

export function SaveStateButton() {
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuthStore();
  const { saveState } = usePlannerStore();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      let planId = getCurrentPlanId();
      if (!planId) {
        planId = generatePlanId();
      }
      await saveState(planId);
      setCurrentPlanId(planId);

      toast({
        title: 'Configuration saved',
        description: 'Your configuration has been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error saving configuration',
        description: error instanceof Error ? error.message : 'An error occurred while saving',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <AuthDialog mode="save" trigger={<Button variant="default">Save Configuration</Button>} />
    );
  }

  return (
    <Button variant="default" onClick={handleSave} disabled={isSaving}>
      {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Save Configuration
    </Button>
  );
}
