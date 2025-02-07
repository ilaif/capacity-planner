import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Features, FeaturesHandle } from './Features';
import { TeamConfiguration } from './TeamConfiguration';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ExportButton } from './ExportButton';
import { ImportButton } from './ImportButton';
import { PlanManager } from './PlanManager';
import { usePlannerStore } from '@/store/plannerStore';
import { logger } from '@/services/loggerService';
import { useSearchParams } from 'react-router-dom';

type ConfigurationSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type ConfigurationSheetHandle = {
  focusFeature: (featureName: string) => void;
};

export const ConfigurationSheet = forwardRef<ConfigurationSheetHandle, ConfigurationSheetProps>(
  ({ open, onOpenChange }, ref) => {
    const featuresRef = useRef<FeaturesHandle>(null);
    const [searchParams, setSearchParams] = useSearchParams();

    useImperativeHandle(ref, () => ({
      focusFeature: (featureName: string) => {
        featuresRef.current?.focusFeature(featureName);
      },
    }));

    const { planState, setOverheadFactor, setStartDate, planName } = usePlannerStore();

    const handlePlanLoad = async (planId: string) => {
      logger.info('Loading plan', { planId });
      const newParams = new URLSearchParams(searchParams);
      newParams.set('id', planId);
      setSearchParams(newParams);
    };

    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="pr-1">
          <SheetHeader>
            <SheetTitle>Configuration</SheetTitle>
            <div className="flex gap-2 mt-2 mr-6">
              <div className="flex-1">
                <PlanManager
                  currentState={planState}
                  planName={planName}
                  onPlanLoad={handlePlanLoad}
                />
              </div>
              <div className="flex gap-2">
                <ExportButton state={planState} />
                <ImportButton onImport={handlePlanLoad} />
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
                    value={planState.startDate.toISOString().split('T')[0]}
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
                    value={planState.overheadFactor}
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
