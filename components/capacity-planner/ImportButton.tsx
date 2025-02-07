import { Button } from '@/components/ui/button';
import { importPlanStateFromJSON } from '@/services/jsonStateService';
import { Download } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { upsertPlan } from '@/services/supabasePlanService';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/services/loggerService';

type ImportButtonProps = {
  onImport: (planId: string) => void;
};

export function ImportButton({ onImport }: ImportButtonProps) {
  const { toast } = useToast();

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const state = await importPlanStateFromJSON(file);
      const planId = crypto.randomUUID();
      await upsertPlan(planId, { state, name: file.name.replace('.json', '') }, false);
      onImport(planId);
      toast({
        title: 'Import successful',
        description: 'The configuration has been imported and saved.',
      });
    } catch (error) {
      logger.error('Failed to import configuration:', error as Error);
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Failed to import configuration',
        variant: 'destructive',
      });
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
              <Download className="h-4 w-4 mr-2" />
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
