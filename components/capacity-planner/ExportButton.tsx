import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { exportPlanStateToJSON } from '@/services/jsonStateService';
import { PlanState } from '@/types/capacity-planner';

type ExportButtonProps = {
  state: PlanState;
};

export function ExportButton({ state }: ExportButtonProps) {
  const handleExport = () => {
    try {
      exportPlanStateToJSON(state);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to export file');
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" onClick={handleExport} className="h-full">
            <Upload />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[300px]">
          <p>
            Save your current configuration, including all features, teams, and settings to a JSON
            file
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
