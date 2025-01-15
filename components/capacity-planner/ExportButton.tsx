import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PlannerState, exportStateToJSON } from '@/services/stateService';

interface ExportButtonProps {
  state: PlannerState;
}

export function ExportButton({ state }: ExportButtonProps) {
  const handleExport = () => {
    try {
      exportStateToJSON(state);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to export file');
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
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
