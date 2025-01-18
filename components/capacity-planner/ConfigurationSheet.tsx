import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Features, FeaturesHandle } from './Features';
import { TeamConfiguration } from './TeamConfiguration';
import { Feature, Teams, TeamSizeVariation } from '@/types/capacity-planner';
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

interface ConfigurationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  features: Feature[];
  teams: Teams;
  overheadFactor: number;
  startDate: Date;
  configurationName?: string;
  onPlannerStateChange: (state: PlannerState) => void;
  onStartDateChange: (date: Date) => void;
  onOverheadFactorChange: (value: number) => void;
  onTeamAdd: (teamName: string) => void;
  onTeamRemove: (teamName: string) => void;
  onTeamRename: (oldName: string, newName: string) => void;
  onTeamSizeChange: (team: string, value: number) => void;
  onWipLimitChange: (team: string, value: number) => void;
  onTeamSizeVariationAdd: (variation: TeamSizeVariation) => void;
  onTeamSizeVariationRemove: (team: string, week: number) => void;
  onFeatureAdd: () => void;
  onFeatureNameChange: (featureId: number, name: string) => void;
  onRequirementChange: (featureId: number, team: string, field: string, value: string) => void;
  onFeaturesChange: (features: Feature[]) => void;
  onFeatureRemove: (featureId: number) => void;
}

export interface ConfigurationSheetHandle {
  focusFeature: (featureName: string) => void;
}

export const ConfigurationSheet = forwardRef<ConfigurationSheetHandle, ConfigurationSheetProps>(
  (
    {
      open,
      onOpenChange,
      features,
      teams,
      overheadFactor,
      startDate,
      configurationName,
      onPlannerStateChange,
      onStartDateChange,
      onOverheadFactorChange,
      onFeaturesChange,
      onTeamAdd,
      onTeamRemove,
      onTeamRename,
      onTeamSizeChange,
      onWipLimitChange,
      onTeamSizeVariationAdd,
      onTeamSizeVariationRemove,
      onFeatureAdd,
      onFeatureNameChange,
      onRequirementChange,
      onFeatureRemove,
    },
    ref
  ) => {
    const featuresRef = useRef<FeaturesHandle>(null);

    useImperativeHandle(ref, () => ({
      focusFeature: (featureName: string) => {
        featuresRef.current?.focusFeature(featureName);
      },
    }));

    const currentState: PlannerState = {
      features,
      teams,
      overheadFactor,
      startDate,
      configurationName,
    };

    const handleConfigurationLoad = (state: PlannerState) => {
      logger.info('Loading configuration state', { state });
      onPlannerStateChange(state);
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
                  onConfigurationLoad={handleConfigurationLoad}
                />
              </div>
              <div className="flex gap-2">
                <ExportButton state={currentState} />
                <ImportButton setPlannerState={onPlannerStateChange} />
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
                    onChange={e => onStartDateChange(new Date(e.target.value))}
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
                    onChange={e => onOverheadFactorChange(parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium">Teams</h3>
              <div className="mt-2">
                <TeamConfiguration
                  teams={teams}
                  onTeamAdd={onTeamAdd}
                  onTeamRemove={onTeamRemove}
                  onTeamRename={onTeamRename}
                  onTeamSizeChange={onTeamSizeChange}
                  onWipLimitChange={onWipLimitChange}
                  onTeamSizeVariationAdd={onTeamSizeVariationAdd}
                  onTeamSizeVariationRemove={onTeamSizeVariationRemove}
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium">Features</h3>
              <div className="mt-2">
                <Features
                  ref={featuresRef}
                  features={features}
                  teams={Object.keys(teams)}
                  onFeatureAdd={onFeatureAdd}
                  onFeatureNameChange={onFeatureNameChange}
                  onRequirementChange={onRequirementChange}
                  onFeaturesUploaded={onFeaturesChange}
                  onFeatureRemove={onFeatureRemove}
                />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }
);

ConfigurationSheet.displayName = 'ConfigurationSheet';
