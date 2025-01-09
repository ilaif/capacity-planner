import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Feature, TimelineItem, Teams, TeamSizeVariation } from '@/types/resource-planner';
import { calculateTimeline, exportTimelineAsPng } from '@/services/timelineService';
import {
  getInitialState,
  saveToLocalStorage,
  updateURL,
  DEFAULT_STATE,
} from '@/services/stateService';
import { logger } from '@/services/loggerService';
import { TeamConfiguration } from './resource-planner/TeamConfiguration';
import { Features } from './resource-planner/Features';
import { TimelineView } from './resource-planner/TimelineView';
import { PlanningConfiguration } from './resource-planner/PlanningConfiguration';
import { TeamSizeChart } from './resource-planner/TeamSizeChart';

const ResourcePlanner = () => {
  const [features, setFeatures] = useState<Feature[]>(DEFAULT_STATE.features);
  const [teams, setTeams] = useState<Teams>(DEFAULT_STATE.teams);
  const [overheadFactor, setOverheadFactor] = useState(DEFAULT_STATE.overheadFactor);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize state from URL or localStorage
  useEffect(() => {
    logger.info('Initializing ResourcePlanner state');
    const initialState = getInitialState();
    logger.debug('Got initial state', initialState);
    setFeatures(initialState.features);
    setTeams(initialState.teams);
    setOverheadFactor(initialState.overheadFactor);
    setIsInitialized(true);
    logger.info('ResourcePlanner state initialized successfully');
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

  const handleTimelineGenerate = () => {
    logger.info('Generating timeline', {
      featuresCount: features.length,
      teamsCount: Object.keys(teams).length,
    });

    const teamsForTimeline = Object.fromEntries(
      Object.entries(teams).map(([team, size]) => {
        if (Array.isArray(size)) {
          const fullArray = Array(52).fill(size[0]);
          const variationWeeks = size
            .map((s, week) => (s !== undefined && week > 0 ? week : -1))
            .filter(week => week !== -1)
            .sort((a, b) => a - b);

          variationWeeks.forEach((week, index) => {
            const nextVariationWeek = variationWeeks[index + 1] || 52;
            const variationSize = size[week];
            for (let w = week; w < nextVariationWeek; w++) {
              fullArray[w] = variationSize;
            }
          });

          return [team, fullArray];
        }
        return [team, Array(52).fill(size)];
      })
    );

    try {
      const newTimeline = calculateTimeline(features, teamsForTimeline, overheadFactor);
      setTimeline(newTimeline);
      logger.info('Timeline generated successfully', {
        timelineLength: newTimeline.length,
        totalWeeks: newTimeline[newTimeline.length - 1]?.endWeek || 0,
      });
    } catch (error) {
      logger.error('Failed to generate timeline', error as Error, {
        features,
        teamsForTimeline,
        overheadFactor,
      });
    }
  };

  const handleExportPng = () => {
    logger.info('Attempting to export timeline as PNG');
    if (!timelineRef.current || timeline.length === 0) {
      logger.warn('Cannot export PNG: timeline is empty or reference is missing');
      return;
    }
    try {
      exportTimelineAsPng(timeline, overheadFactor);
      logger.info('Timeline exported successfully as PNG');
    } catch (error) {
      logger.error('Failed to export timeline as PNG', error as Error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Resource Planner</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <PlanningConfiguration
            overheadFactor={overheadFactor}
            onOverheadFactorChange={setOverheadFactor}
          />

          <TeamConfiguration
            teams={teams}
            onTeamSizeChange={handleTeamSizeChange}
            onTeamSizeVariationAdd={handleTeamSizeVariationAdd}
            onTeamSizeVariationRemove={handleTeamSizeVariationRemove}
            onTeamAdd={handleTeamAdd}
            onTeamRemove={handleTeamRemove}
            onTeamRename={handleTeamRename}
          />

          <TeamSizeChart teams={teams} />

          <Features
            features={features}
            teams={Object.keys(teams)}
            onFeatureAdd={handleFeatureAdd}
            onFeatureNameChange={handleFeatureNameChange}
            onRequirementChange={handleRequirementChange}
            onFeaturesUploaded={setFeatures}
          />

          <Button onClick={handleTimelineGenerate} className="w-full">
            Generate Timeline
          </Button>

          <TimelineView
            timeline={timeline}
            timelineRef={timelineRef}
            overheadFactor={overheadFactor}
            onExport={handleExportPng}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ResourcePlanner;
