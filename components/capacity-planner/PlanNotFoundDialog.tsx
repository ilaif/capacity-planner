import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PlanNotFoundDialogProps {
  open: boolean;
  onClose: () => void;
}

export function PlanNotFoundDialog({ open, onClose }: PlanNotFoundDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Plan Not Found</DialogTitle>
          <DialogDescription>
            The requested plan could not be found. You will be redirected to create a new plan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
