import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Feature, TimelineItem, Teams, TeamSizeVariation } from '@/types/resource-planner';
import { calculateTimeline, exportTimelineAsPng } from '@/services/timelineService';
import { TeamConfiguration } from './resource-planner/TeamConfiguration';
import { Features } from './resource-planner/Features';
import { TimelineView } from './resource-planner/TimelineView';
import { PlanningConfiguration } from './resource-planner/PlanningConfiguration';

const ResourcePlanner = () => {
  const [features, setFeatures] = useState<Feature[]>([
    {
      id: 1,
      name: 'Feature 1',
      requirements: {
        provider: { weeks: 2, parallel: 1 },
        platform: { weeks: 1, parallel: 1 },
      },
    },
  ]);
  const [teams, setTeams] = useState<Teams>({
    provider: 7,
    platform: 6,
  });
  const [overheadFactor, setOverheadFactor] = useState(1.2);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleFeatureAdd = () => {
    setFeatures([
      ...features,
      {
        id: features.length + 1,
        name: `Feature ${features.length + 1}`,
        requirements: {
          provider: { weeks: 0, parallel: 1 },
          platform: { weeks: 0, parallel: 1 },
        },
      },
    ]);
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
    // Convert teams object to have full arrays for timeline calculation
    const teamsForTimeline = Object.fromEntries(
      Object.entries(teams).map(([team, size]) => {
        if (Array.isArray(size)) {
          const fullArray = Array(52).fill(size[0]);
          size.forEach((s, i) => {
            if (s !== undefined) fullArray[i] = s;
          });
          return [team, fullArray];
        }
        return [team, Array(52).fill(size)];
      })
    );

    const newTimeline = calculateTimeline(features, teamsForTimeline, overheadFactor);
    setTimeline(newTimeline);
  };

  const handleExportPng = () => {
    if (!timelineRef.current || timeline.length === 0) return;
    exportTimelineAsPng(timeline, overheadFactor);
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
          />

          <Features
            features={features}
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
