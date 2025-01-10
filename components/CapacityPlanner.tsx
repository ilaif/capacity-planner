import { useState, useRef, useEffect } from 'react';
import { Feature, Teams, TeamSizeVariation } from '@/types/capacity-planner';
import { getInitialState, updateURL, DEFAULT_STATE } from '@/services/stateService';
import { logger } from '@/services/loggerService';
import { TeamConfiguration } from './capacity-planner/TeamConfiguration';
import { Features } from './capacity-planner/Features';
import { TimelineView } from './capacity-planner/TimelineView';
import { PlanningConfiguration } from './capacity-planner/PlanningConfiguration';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const CapacityPlanner = () => {
  const [features, setFeatures] = useState<Feature[]>(DEFAULT_STATE.features);
  const [teams, setTeams] = useState<Teams>(DEFAULT_STATE.teams);
  const [overheadFactor, setOverheadFactor] = useState(DEFAULT_STATE.overheadFactor);
  const [open, setOpen] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize state from URL or localStorage
  useEffect(() => {
    logger.info('Initializing CapacityPlanner state');
    const initialState = getInitialState();
    logger.debug('Got initial state', initialState);
    setFeatures(initialState.features);
    setTeams(initialState.teams);
    setOverheadFactor(initialState.overheadFactor);
    setIsInitialized(true);
    logger.info('CapacityPlanner state initialized successfully');
  }, []);

  // Save to localStorage and update URL whenever state changes
  useEffect(() => {
    if (!isInitialized) return;

    const state = { features, teams, overheadFactor };
    logger.debug('Updating state in URL and localStorage', state);
    updateURL(state);
    logger.debug('State updated successfully');
  }, [features, teams, overheadFactor, isInitialized]);

  const handleTeamAdd = (teamName: string) => {
    logger.info(`Adding new team: ${teamName}`);
    if (!teams[teamName]) {
      setTeams(prev => ({ ...prev, [teamName]: 0 }));
      // Update all existing features to include the new team
      setFeatures(prev =>
        prev.map(feature => ({
          ...feature,
          requirements: {
            ...feature.requirements,
            [teamName]: { weeks: 0, parallel: 1 },
          },
        }))
      );
      logger.info(`Team ${teamName} added successfully`);
    } else {
      logger.warn(`Team ${teamName} already exists`);
    }
  };

  const handleTeamRemove = (teamName: string) => {
    logger.info(`Removing team: ${teamName}`);
    setTeams(prev => {
      const newTeams = { ...prev };
      delete newTeams[teamName];
      return newTeams;
    });
    setFeatures(prev =>
      prev.map(feature => {
        const newRequirements = { ...feature.requirements };
        delete newRequirements[teamName];
        return { ...feature, requirements: newRequirements };
      })
    );
    logger.info(`Team ${teamName} removed successfully`);
  };

  const handleTeamRename = (oldName: string, newName: string) => {
    logger.info(`Renaming team from ${oldName} to ${newName}`);
    if (!teams[newName] && oldName !== newName) {
      setTeams(prev => {
        const newTeams = { ...prev };
        newTeams[newName] = newTeams[oldName];
        delete newTeams[oldName];
        return newTeams;
      });
      setFeatures(prev =>
        prev.map(feature => {
          const newRequirements = { ...feature.requirements };
          if (newRequirements[oldName]) {
            newRequirements[newName] = newRequirements[oldName];
            delete newRequirements[oldName];
          }
          return { ...feature, requirements: newRequirements };
        })
      );
      logger.info(`Team renamed successfully from ${oldName} to ${newName}`);
    } else {
      logger.warn(`Cannot rename team: new name ${newName} already exists or names are identical`);
    }
  };

  const handleFeatureAdd = () => {
    logger.info('Adding new feature');
    const newFeature = {
      id: features.length + 1,
      name: `Feature ${features.length + 1}`,
      requirements: Object.keys(teams).reduce(
        (acc, team) => ({
          ...acc,
          [team]: { weeks: 0, parallel: 1 },
        }),
        {}
      ),
    };
    setFeatures([...features, newFeature]);
    logger.debug('New feature added', newFeature);
  };

  const handleFeatureRemove = (featureId: number) => {
    setFeatures(features.filter(f => f.id !== featureId));
    logger.debug('Feature removed', { featureId });
  };

  const handleFeatureNameChange = (featureId: number, name: string) => {
    setFeatures(features.map(f => (f.id === featureId ? { ...f, name } : f)));
  };

  const handleRequirementChange = (
    featureId: number,
    team: string,
    field: string,
    value: string
  ) => {
    setFeatures(
      features.map(feature =>
        feature.id === featureId
          ? {
              ...feature,
              requirements: {
                ...feature.requirements,
                [team]: {
                  ...feature.requirements[team],
                  [field]: parseInt(value) || 0,
                },
              },
            }
          : feature
      )
    );
  };

  const handleTeamSizeChange = (team: string, value: string) => {
    const size = parseInt(value) || 0;
    setTeams(prevTeams => {
      const currentSize = prevTeams[team];
      // If it's already an array, update the base size while preserving variations
      if (Array.isArray(currentSize)) {
        const newSizes = [...currentSize];
        newSizes[0] = size;
        return {
          ...prevTeams,
          [team]: newSizes,
        };
      }
      // Otherwise, just set the new size
      return {
        ...prevTeams,
        [team]: size,
      };
    });
  };

  const handleTeamSizeVariationAdd = (variation: TeamSizeVariation) => {
    setTeams(prevTeams => {
      const currentSize = prevTeams[variation.team];
      const baseSize = Array.isArray(currentSize) ? currentSize[0] : currentSize;
      const newSizes = Array.isArray(currentSize) ? [...currentSize] : [baseSize];

      // Only set the specific week that has a variation
      newSizes[variation.week] = variation.size;

      return {
        ...prevTeams,
        [variation.team]: newSizes,
      };
    });
  };

  const handleTeamSizeVariationRemove = (team: string, week: number) => {
    setTeams(prevTeams => {
      const currentSize = prevTeams[team];
      if (!Array.isArray(currentSize)) return prevTeams;

      const newSizes = [...currentSize];
      const baseSize = newSizes[0];

      // Only remove the specific variation
      if (week === 0) {
        // If removing variation from week 0, update all existing variations to use the new base size
        newSizes.forEach((size, i) => {
          if (size !== undefined && i !== 0) {
            newSizes[i] = size;
          }
        });
        newSizes[0] = baseSize;
      } else {
        // For other weeks, just remove that specific variation
        delete newSizes[week];
      }

      // If no variations left, convert back to simple number
      const hasVariations = newSizes.some(
        (size, i) => i > 0 && size !== undefined && size !== baseSize
      );
      return {
        ...prevTeams,
        [team]: hasVariations ? newSizes : baseSize,
      };
    });
  };

  return (
    <div className="fixed inset-0 flex flex-col h-screen">
      {/* Timeline View */}
      <div className="flex-1 overflow-hidden relative">
        <h2 className="text-2xl font-medium p-4 border-b">Capacity Planner</h2>

        <TimelineView
          features={features}
          teams={teams}
          timelineRef={timelineRef}
          overheadFactor={overheadFactor}
        />

        {/* Controls Toggle Button */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="absolute top-4 right-4 z-50">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent className="pr-1">
            <SheetHeader>
              <SheetTitle>Configuration</SheetTitle>
            </SheetHeader>
            <div className="pl-1 pr-6 space-y-4 mt-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
              <h3 className="text-lg font-medium">Planning</h3>
              <PlanningConfiguration
                overheadFactor={overheadFactor}
                onOverheadFactorChange={setOverheadFactor}
              />

              <h3 className="text-lg font-medium">Teams</h3>
              <TeamConfiguration
                teams={teams}
                onTeamAdd={handleTeamAdd}
                onTeamRemove={handleTeamRemove}
                onTeamRename={handleTeamRename}
                onTeamSizeChange={handleTeamSizeChange}
                onTeamSizeVariationAdd={handleTeamSizeVariationAdd}
                onTeamSizeVariationRemove={handleTeamSizeVariationRemove}
              />

              <h3 className="text-lg font-medium">Features</h3>
              <Features
                features={features}
                teams={Object.keys(teams)}
                onFeatureAdd={handleFeatureAdd}
                onFeatureNameChange={handleFeatureNameChange}
                onRequirementChange={handleRequirementChange}
                onFeaturesUploaded={setFeatures}
                onFeatureRemove={handleFeatureRemove}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default CapacityPlanner;
