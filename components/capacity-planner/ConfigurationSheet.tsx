import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Features, FeaturesHandle } from './Features';
import { TeamConfiguration } from './TeamConfiguration';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ExportButton } from './ExportButton';
import { ImportButton } from './ImportButton';
import { ConfigurationManager } from './ConfigurationManager';
import { PlannerState } from '@/services/stateService';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { logger } from '@/services/loggerService';
import { usePlannerStore } from '@/store/plannerStore';

interface ConfigurationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface ConfigurationSheetHandle {
  focusFeature: (featureName: string) => void;
}

export const ConfigurationSheet = forwardRef<ConfigurationSheetHandle, ConfigurationSheetProps>(
  ({ open, onOpenChange }, ref) => {
    const featuresRef = useRef<FeaturesHandle>(null);

    useImperativeHandle(ref, () => ({
      focusFeature: (featureName: string) => {
        featuresRef.current?.focusFeature(featureName);
      },
    }));

    const {
      features,
      teams,
      overheadFactor,
      startDate,
      configurationName,
      setState,
      setOverheadFactor,
      setStartDate,
    } = usePlannerStore();

    const currentState: PlannerState = {
      features,
      teams,
      overheadFactor,
      startDate,
      configurationName,
    };

    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="absolute top-4 right-4 z-50">
                  <Menu className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Open Configuration (⌘K)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </SheetTrigger>
        <SheetContent className="pr-1">
          <SheetHeader>
            <SheetTitle>Configuration</SheetTitle>
            <div className="flex gap-2 mt-2 mr-6">
              <div className="flex-1">
                <ConfigurationManager
                  currentState={currentState}
                  onConfigurationLoad={(state: PlannerState) => {
                    logger.info('Loading configuration state', { state });
                    setState(state);
                  }}
                />
              </div>
              <div className="flex gap-2">
                <ExportButton state={currentState} />
                <ImportButton setPlannerState={setState} />
              </div>
            </div>
          </SheetHeader>

          <div className="pr-6 space-y-4 mt-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
            <div>
              <h3 className="text-lg font-medium">Planning</h3>
              <div className="flex gap-2 mt-2">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate.toISOString().split('T')[0]}
                    onChange={e => setStartDate(new Date(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="overhead">Overhead Factor</Label>
                  <Input
                    id="overhead"
                    type="number"
                    min="1"
                    step="0.1"
                    value={overheadFactor}
                    onChange={e => setOverheadFactor(parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium">Teams</h3>
              <div className="mt-2">
                <TeamConfiguration />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium">Features</h3>
              <div className="mt-2">
                <Features ref={featuresRef} />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }
);

ConfigurationSheet.displayName = 'ConfigurationSheet';
