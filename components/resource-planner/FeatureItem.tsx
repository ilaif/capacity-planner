import { Input } from '@/components/ui/input';
import { Feature } from '@/types/resource-planner';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import React from 'react';

interface FeatureItemProps {
  feature: Feature;
  onFeatureNameChange: (featureId: number, name: string) => void;
  onRequirementChange: (featureId: number, team: string, field: string, value: string) => void;
  onFeatureRemove: (featureId: number) => void;
}

export function FeatureItem({
  feature,
  onFeatureNameChange,
  onRequirementChange,
  onFeatureRemove,
}: FeatureItemProps) {
  return (
    <div className="space-y-2">
      <div className="flex gap-4">
        <div className="w-8 text-sm font-medium pt-2">{feature.id}.</div>
        <div className="flex-1 flex gap-2">
          <Input
            value={feature.name}
            onChange={e => onFeatureNameChange(feature.id, e.target.value)}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFeatureRemove(feature.id)}
            className="h-10 px-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {Object.entries(feature.requirements).map(([team, requirement]) => (
          <React.Fragment key={team}>
            <div className="flex items-center gap-2">
              <label className="text-xs whitespace-nowrap">{team} weeks</label>
              <Input
                type="number"
                value={requirement.weeks}
                onChange={e => onRequirementChange(feature.id, team, 'weeks', e.target.value)}
                min="0"
                className="h-7 max-w-16"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs whitespace-nowrap">{team} parallel</label>
              <Input
                type="number"
                value={requirement.parallel}
                onChange={e => onRequirementChange(feature.id, team, 'parallel', e.target.value)}
                min="1"
                className="h-7 max-w-16"
              />
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
