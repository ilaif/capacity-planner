import { Button } from '@/components/ui/button';
import { importStateFromJSON, PlannerState } from '@/services/stateService';
import { Upload } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ImportButton({
  setPlannerState,
}: {
  setPlannerState: (state: PlannerState) => void;
}) {
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importStateFromJSON(file, setPlannerState);
    } catch (error) {
      console.error('Failed to import configuration:', error);
      alert(error instanceof Error ? error.message : 'Failed to import configuration');
    } finally {
      // Reset the input
      event.target.value = '';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild variant="outline" size="sm" className="h-full">
            <label className="flex items-center cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Import JSON
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="sr-only"
                aria-label="Import JSON configuration file"
              />
            </label>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[300px]">
          <p>
            Load a previously exported configuration file to restore your features, teams, and
            settings
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
