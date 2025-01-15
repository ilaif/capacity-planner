import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { importStateFromJSON } from '@/services/stateService';
import { ImportHandlers, Teams } from '@/types/capacity-planner';

interface ImportButtonProps {
  currentTeams: Teams;
  handlers: ImportHandlers;
}

export function ImportButton({ currentTeams, handlers }: ImportButtonProps) {
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importStateFromJSON(file, currentTeams, handlers);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to import file');
    }

    // Reset the input
    event.target.value = '';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild variant="outline" size="sm">
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
