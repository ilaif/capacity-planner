import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { PlanningConfiguration } from './PlanningConfiguration';
import { TeamConfiguration } from './TeamConfiguration';
import { Features } from './Features';
import { Feature, Teams, TeamSizeVariation } from '@/types/capacity-planner';

interface ConfigurationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  features: Feature[];
  teams: Teams;
  overheadFactor: number;
  startDate: Date;
  onStartDateChange: (date: Date) => void;
  onOverheadFactorChange: (value: number) => void;
  onTeamAdd: (teamName: string) => void;
  onTeamRemove: (teamName: string) => void;
  onTeamRename: (oldName: string, newName: string) => void;
  onTeamSizeChange: (team: string, value: string) => void;
  onWipLimitChange: (team: string, value: number) => void;
  onTeamSizeVariationAdd: (variation: TeamSizeVariation) => void;
  onTeamSizeVariationRemove: (team: string, week: number) => void;
  onFeatureAdd: () => void;
  onFeatureNameChange: (featureId: number, name: string) => void;
  onRequirementChange: (featureId: number, team: string, field: string, value: string) => void;
  onFeaturesUploaded: (features: Feature[]) => void;
  onFeatureRemove: (featureId: number) => void;
}

export function ConfigurationSheet({
  open,
  onOpenChange,
  features,
  teams,
  overheadFactor,
  startDate,
  onStartDateChange,
  onOverheadFactorChange,
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
  onFeaturesUploaded,
  onFeatureRemove,
}: ConfigurationSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="absolute top-4 right-4 z-50">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="pr-1">
        <SheetHeader>
          <SheetTitle>Configuration</SheetTitle>
        </SheetHeader>
        <div className="pr-6 space-y-4 mt-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
          <h3 className="text-lg font-medium">Planning</h3>
          <PlanningConfiguration
            overheadFactor={overheadFactor}
            onOverheadFactorChange={onOverheadFactorChange}
            startDate={startDate}
            onStartDateChange={onStartDateChange}
          />

          <h3 className="text-lg font-medium">Teams</h3>
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

          <h3 className="text-lg font-medium">Features</h3>
          <Features
            features={features}
            teams={Object.keys(teams)}
            onFeatureAdd={onFeatureAdd}
            onFeatureNameChange={onFeatureNameChange}
            onRequirementChange={onRequirementChange}
            onFeaturesUploaded={onFeaturesUploaded}
            onFeatureRemove={onFeatureRemove}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
