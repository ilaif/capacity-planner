import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlanState } from '@/types/capacity-planner';
import { Plan, listPlans, upsertPlan, deletePlan, sharePlan } from '@/services/supabasePlanService';
import { Save, Trash2, Copy, Loader2, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { logger } from '@/services/loggerService';
import { useAuthStore } from '@/store/authStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PlanManagerProps {
  currentState: PlanState;
  planName: string;
  onPlanLoad: (planId: string) => void;
}

export function PlanManager({ currentState, planName, onPlanLoad }: PlanManagerProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [newPlanName, setNewPlanName] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveAsDialogOpen, setSaveAsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    const loadPlans = async () => {
      if (!user) {
        setPlans([]);
        return;
      }
      logger.info('Loading saved plans');
      const plans = await listPlans();
      setPlans(plans);
    };
    loadPlans();
  }, [user]);

  useEffect(() => {
    const plan = plans.find(p => p.name === planName);
    if (plan) {
      setSelectedPlanId(plan.id);
    }
  }, [planName, plans]);

  useEffect(() => {
    if (saveDialogOpen || saveAsDialogOpen) {
      setNewPlanName(planName || '');
    }
  }, [saveDialogOpen, saveAsDialogOpen, planName]);

  const handleSaveNewPlan = async () => {
    if (!newPlanName) return;
    setIsLoading(true);
    try {
      logger.info(`Saving new plan: ${newPlanName}`);
      const newPlanId = crypto.randomUUID();
      await upsertPlan(newPlanId, { state: currentState, name: newPlanName });
      setNewPlanName('');
      setSaveDialogOpen(false);
      onPlanLoad(newPlanId);
      const updatedPlans = await listPlans();
      setPlans(updatedPlans);
      setSelectedPlanId(newPlanId);
    } catch (error) {
      logger.error('Failed to save new plan', error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlan = async () => {
    setIsLoading(true);
    try {
      logger.info('Deleting plan', { planId: selectedPlanId });
      await deletePlan(selectedPlanId);
      const updatedPlans = await listPlans();
      setPlans(updatedPlans);
      setSelectedPlanId('');
      setDeleteDialogOpen(false);
      logger.info('Plan deleted successfully', { planId: selectedPlanId });
    } catch (error) {
      logger.error('Failed to delete plan', error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelect = (id: string) => {
    logger.info(`Loading plan with id: ${id}`);
    setSelectedPlanId(id);
    onPlanLoad(id);
  };

  const handleSaveAsCopy = async () => {
    if (!newPlanName) return;
    setIsLoading(true);
    try {
      logger.info(`Saving plan as copy: ${newPlanName}`);
      const newPlanId = crypto.randomUUID();
      await upsertPlan(newPlanId, { state: currentState, name: newPlanName });
      setNewPlanName('');
      setSaveAsDialogOpen(false);
      onPlanLoad(newPlanId);
      const updatedPlans = await listPlans();
      setPlans(updatedPlans);
      setSelectedPlanId(newPlanId);
    } catch (error) {
      logger.error('Failed to save plan as copy', error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSharePlan = async () => {
    if (!shareEmail || !selectedPlanId) return;
    setIsLoading(true);
    try {
      await sharePlan(selectedPlanId, shareEmail);
      setShareEmail('');
      setShareDialogOpen(false);
    } catch (error) {
      logger.error('Failed to share plan', error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  return (
    <div className="flex gap-2 items-center">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Select value={selectedPlanId} onValueChange={handlePlanSelect} disabled={!user}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select plan">{selectedPlan?.name}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {plans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      <div className="flex-1">
                        <div className="font-medium">{plan.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Updated {format(new Date(plan.updated_at), 'MMM d, yyyy HH:mm')}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TooltipTrigger>
          {!user && (
            <TooltipContent>
              <p>Sign in to select and save plans</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      {selectedPlanId ? (
        <>
          <Dialog open={saveAsDialogOpen} onOpenChange={setSaveAsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={isLoading || !user}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Plan as Copy</DialogTitle>
                <DialogDescription>Enter a name for the new plan</DialogDescription>
              </DialogHeader>
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Plan name"
                  value={newPlanName}
                  onChange={e => setNewPlanName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSaveAsCopy} disabled={!newPlanName.trim() || isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                disabled={isLoading || !user}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Plan</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete "{selectedPlan?.name}"? This action cannot be
                  undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeletePlan} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={isLoading || !user}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Plan</DialogTitle>
                <DialogDescription>
                  Enter the email address to share "{selectedPlan?.name}" with
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={shareEmail}
                  onChange={e => setShareEmail(e.target.value)}
                />
                <Button
                  onClick={handleSharePlan}
                  disabled={!shareEmail.trim() || isLoading}
                  className="w-full"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Share Plan
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" disabled={isLoading || !user}>
                      <Save className="h-4 w-4 mr-2" />
                      Save New
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Plan</DialogTitle>
                      <DialogDescription>Enter a name for your new plan</DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="Plan name"
                        value={newPlanName}
                        onChange={e => setNewPlanName(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSaveNewPlan}
                        disabled={!newPlanName.trim() || isLoading}
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Save
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </TooltipTrigger>
            {!user && (
              <TooltipContent>
                <p>Sign in to save plans</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
