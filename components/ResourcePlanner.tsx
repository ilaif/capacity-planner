import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Feature, TimelineItem, Teams } from '@/types/resource-planner';
import { calculateTimeline, exportTimelineAsPng } from '@/services/timelineService';
import { FeatureUpload } from './resource-planner/FeatureUpload';
import { TeamConfiguration } from './resource-planner/TeamConfiguration';
import { FeatureList } from './resource-planner/FeatureList';
import { TimelineView } from './resource-planner/TimelineView';

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
    setTeams({
      ...teams,
      [team]: parseInt(value) || 0,
    });
  };

  const handleTimelineGenerate = () => {
    const newTimeline = calculateTimeline(features, teams, overheadFactor);
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
          <FeatureUpload onFeaturesUploaded={setFeatures} />

          <TeamConfiguration
            teams={teams}
            overheadFactor={overheadFactor}
            onTeamSizeChange={handleTeamSizeChange}
            onOverheadFactorChange={setOverheadFactor}
          />

          <FeatureList
            features={features}
            onFeatureAdd={handleFeatureAdd}
            onFeatureNameChange={handleFeatureNameChange}
            onRequirementChange={handleRequirementChange}
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
