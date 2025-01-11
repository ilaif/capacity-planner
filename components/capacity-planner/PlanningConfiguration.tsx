import { NumberInput } from '@/components/ui/number-input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface PlanningConfigurationProps {
  overheadFactor: number;
  onOverheadFactorChange: (value: number) => void;
}

export function PlanningConfiguration({
  overheadFactor,
  onOverheadFactorChange,
}: PlanningConfigurationProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="col-span-1">
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium">Overhead Factor</label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  This factor adds a buffer to all time estimations to account for meetings,
                  interruptions, and other overhead. For example, a factor of 1.2 means 20% extra
                  time is added to each estimate.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <NumberInput
          value={overheadFactor}
          onChange={onOverheadFactorChange}
          min={1}
          step={0.1}
          className="w-full"
          inputClassName="w-full"
        />
      </div>
    </div>
  );
}
