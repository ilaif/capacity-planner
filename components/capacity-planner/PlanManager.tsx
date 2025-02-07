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
import {
  Plan,
  PlanShare,
  listPlans,
  upsertPlan,
  deletePlan,
  sharePlan,
  getPlanShares,
  removePlanShare,
} from '@/services/supabasePlanService';
import { Save, Trash2, Copy, Loader2, Share2, X } from 'lucide-react';
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

type PlanManagerProps = {
  currentState: PlanState;
  planName: string;
  onPlanLoad: (planId: string) => void;
};

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
  const [planShares, setPlanShares] = useState<PlanShare[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    const loadPlans = async () => {
      if (!user) {
        setPlans([]);
        return;
      }
      const plans = await listPlans(user);
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

  useEffect(() => {
    const loadShares = async () => {
      if (selectedPlanId && user) {
        const shares = await getPlanShares(selectedPlanId, user);
        setPlanShares(shares);
      } else {
        setPlanShares([]);
      }
    };
    loadShares();
  }, [selectedPlanId, user]);

  const handleSaveNewPlan = async () => {
    if (!newPlanName || !user) return;
    setIsLoading(true);
    try {
      logger.info(`Saving new plan: ${newPlanName}`);
      const newPlanId = crypto.randomUUID();
      await upsertPlan(newPlanId, { state: currentState, name: newPlanName }, false, user);
      setNewPlanName('');
      setSaveDialogOpen(false);
      onPlanLoad(newPlanId);
      const updatedPlans = await listPlans(user);
      setPlans(updatedPlans);
      setSelectedPlanId(newPlanId);
    } catch (error) {
      logger.error('Failed to save new plan', error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      logger.info('Deleting plan', { planId: selectedPlanId });
      await deletePlan(selectedPlanId, user);
      const updatedPlans = await listPlans(user);
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
    if (!newPlanName || !user) return;
    setIsLoading(true);
    try {
      logger.info(`Saving plan as copy: ${newPlanName}`);
      const newPlanId = crypto.randomUUID();
      await upsertPlan(newPlanId, { state: currentState, name: newPlanName }, false, user);
      setNewPlanName('');
      setSaveAsDialogOpen(false);
      onPlanLoad(newPlanId);
      const updatedPlans = await listPlans(user);
      setPlans(updatedPlans);
      setSelectedPlanId(newPlanId);
    } catch (error) {
      logger.error('Failed to save plan as copy', error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSharePlan = async () => {
    if (!shareEmail || !selectedPlanId || !user) return;
    setIsLoading(true);
    try {
      await sharePlan(selectedPlanId, shareEmail, user);
      setShareEmail('');
      const shares = await getPlanShares(selectedPlanId, user);
      setPlanShares(shares);
    } catch (error) {
      logger.error('Failed to share plan', error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveShare = async (email: string) => {
    if (!selectedPlanId || !user) return;
    setIsLoading(true);
    try {
      await removePlanShare(selectedPlanId, email, user);
      const shares = await getPlanShares(selectedPlanId, user);
      setPlanShares(shares);
    } catch (error) {
      logger.error('Failed to remove share', error as Error);
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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" disabled={isLoading || !user}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Save a copy of this plan</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
            <TooltipProvider>
              <Tooltip>
                <DialogTrigger asChild>
                  <TooltipTrigger asChild>
                    <Button variant="outline" disabled={isLoading || !user}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                </DialogTrigger>
                <TooltipContent side="bottom">
                  <p>Share this plan with other users</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Plan</DialogTitle>
                <DialogDescription>Share "{selectedPlan?.name}" with other users</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={shareEmail}
                    onChange={e => setShareEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleSharePlan} disabled={!shareEmail.trim() || isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Share
                  </Button>
                </div>
                {planShares.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className="text-sm font-medium">Shared with:</div>
                    <div className="flex flex-col gap-2">
                      {planShares.map(share => (
                        <div
                          key={share.shared_with_email}
                          className="flex items-center justify-between bg-secondary p-2 rounded-md"
                        >
                          <span className="text-sm">{share.shared_with_email}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveShare(share.shared_with_email)}
                            disabled={isLoading}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
