import { useState, useRef, useEffect } from 'react';
import { Feature, Teams, TeamSizeVariation } from '@/types/capacity-planner';
import { getInitialState, updateURL, DEFAULT_STATE } from '@/services/stateService';
import { logger } from '@/services/loggerService';
import { TimelineView } from './capacity-planner/TimelineView';
import { ConfigurationSheet } from './capacity-planner/ConfigurationSheet';
import { startOfWeek } from 'date-fns';

const CapacityPlanner = () => {
  const [features, setFeatures] = useState<Feature[]>(DEFAULT_STATE.features);
  const [teams, setTeams] = useState<Teams>(DEFAULT_STATE.teams);
  const [overheadFactor, setOverheadFactor] = useState(DEFAULT_STATE.overheadFactor);
  const [startDate, setStartDate] = useState<Date>(startOfWeek(new Date()));
  const [openConfigurationSheet, setOpenConfigurationSheet] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize state from URL
  useEffect(() => {
    logger.info('Initializing CapacityPlanner state');
    const initialState = getInitialState();
    logger.debug('Got initial state', {
      features: initialState.features,
      teams: initialState.teams,
      overheadFactor: initialState.overheadFactor,
    });
    setFeatures(initialState.features);
    setTeams(initialState.teams);
    setOverheadFactor(initialState.overheadFactor);
    setIsInitialized(true);
    logger.info('CapacityPlanner state initialized successfully');
  }, []);

  // Update URL whenever state changes
  useEffect(() => {
    if (!isInitialized) return;

    const state = { features, teams, overheadFactor };
    logger.debug('Updating state in URL and localStorage', {
      features,
      teams,
      overheadFactor,
    });
    updateURL(state);
    logger.debug('State updated successfully');
  }, [features, teams, overheadFactor, isInitialized]);

  // Activate keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only trigger if no input/textarea is focused
      if (
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        event.key.toLowerCase() === 's'
      ) {
        setOpenConfigurationSheet(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleTeamAdd = (teamName: string) => {
    logger.info(`Adding new team: ${teamName}`);
    if (!teams[teamName]) {
      setTeams(prev => ({
        ...prev,
        [teamName]: { sizes: [{ week: 0, size: 1 }], wipLimit: 1 },
      }));
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

  const handleTeamSizeChange = (team: string, value: number) => {
    setTeams(prevTeams => {
      const currentTeam = prevTeams[team];
      const currentSize = currentTeam.sizes;
      const newSizes = [...currentSize];
      newSizes[0] = { week: 0, size: value };
      return {
        ...prevTeams,
        [team]: {
          ...currentTeam,
          sizes: newSizes,
        },
      };
    });
  };

  const handleTeamSizeVariationAdd = (variation: TeamSizeVariation) => {
    setTeams(prevTeams => {
      logger.info(
        `Adding size variation for team ${variation.team} at week ${variation.week} with size ${variation.size}`
      );
      const currentTeam = prevTeams[variation.team];
      const currentSizes = currentTeam.sizes;
      let newSizes = [...currentSizes];
      newSizes = newSizes.filter(size => size.week !== variation.week);
      newSizes.push({ week: variation.week, size: variation.size });
      newSizes.sort((a, b) => a.week - b.week);
      return {
        ...prevTeams,
        [variation.team]: {
          ...currentTeam,
          sizes: newSizes,
        },
      };
    });
  };

  const handleTeamSizeVariationRemove = (team: string, week: number) => {
    setTeams(prevTeams => {
      const currentTeam = prevTeams[team];
      const currentSizes = currentTeam.sizes;
      const newSizes = currentSizes.filter(size => size.week !== week);
      return {
        ...prevTeams,
        [team]: {
          ...currentTeam,
          sizes: newSizes,
        },
      };
    });
  };

  const handleWipLimitChange = (team: string, value: number) => {
    setTeams(prevTeams => ({
      ...prevTeams,
      [team]: {
        ...prevTeams[team],
        wipLimit: value,
      },
    }));
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

  return (
    <div className="fixed inset-0 flex flex-col h-screen">
      <div className="flex-1 overflow-hidden relative">
        <h2 className="text-2xl font-medium p-4">Capacity Planner</h2>

        <p className="px-4 py-2 text-sm text-muted-foreground border-b">
          A visual planning tool that helps you estimate project timelines by mapping team capacity
          against feature requirements. Adjust team sizes, WIP limits, and feature specifications to
          optimize your delivery schedule.
        </p>

        <TimelineView
          features={features}
          teams={teams}
          timelineRef={timelineRef}
          overheadFactor={overheadFactor}
          startDate={startDate}
        />

        <ConfigurationSheet
          open={openConfigurationSheet}
          onOpenChange={setOpenConfigurationSheet}
          features={features}
          teams={teams}
          overheadFactor={overheadFactor}
          startDate={startDate}
          onStartDateChange={setStartDate}
          onOverheadFactorChange={setOverheadFactor}
          onTeamAdd={handleTeamAdd}
          onTeamRemove={handleTeamRemove}
          onTeamRename={handleTeamRename}
          onTeamSizeChange={handleTeamSizeChange}
          onWipLimitChange={handleWipLimitChange}
          onTeamSizeVariationAdd={handleTeamSizeVariationAdd}
          onTeamSizeVariationRemove={handleTeamSizeVariationRemove}
          onFeatureAdd={handleFeatureAdd}
          onFeatureNameChange={handleFeatureNameChange}
          onRequirementChange={handleRequirementChange}
          onFeaturesUploaded={setFeatures}
          onFeatureRemove={handleFeatureRemove}
        />
      </div>
    </div>
  );
};

export default CapacityPlanner;
