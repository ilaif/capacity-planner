import { Button } from '@/components/ui/button';
import { Feature } from '@/types/resource-planner';
import { FeatureItem } from './FeatureItem';
import { FeatureUpload } from './FeatureUpload';

interface FeatureListProps {
  features: Feature[];
  teams: string[];
  onFeatureAdd: () => void;
  onFeatureNameChange: (featureId: number, name: string) => void;
  onRequirementChange: (featureId: number, team: string, field: string, value: string) => void;
  onFeaturesUploaded: (features: Feature[]) => void;
  onFeatureRemove: (featureId: number) => void;
}

export function Features({
  features,
  teams,
  onFeatureAdd,
  onFeatureNameChange,
  onRequirementChange,
  onFeaturesUploaded,
  onFeatureRemove,
}: FeatureListProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Features</h3>
        <div className="flex gap-2">
          <Button onClick={onFeatureAdd}>Add Feature</Button>
        </div>
      </div>
      <FeatureUpload onFeaturesUploaded={onFeaturesUploaded} teams={teams} />
      <div className="max-h-[300px] overflow-y-auto space-y-4 p-1">
        {features.map(feature => (
          <FeatureItem
            key={feature.id}
            feature={feature}
            onFeatureNameChange={onFeatureNameChange}
            onRequirementChange={onRequirementChange}
            onFeatureRemove={onFeatureRemove}
          />
        ))}
      </div>
    </div>
  );
}
