import { Button } from '@/components/ui/button';
import { Feature } from '@/types/resource-planner';
import { FeatureItem } from './FeatureItem';

interface FeatureListProps {
  features: Feature[];
  onFeatureAdd: () => void;
  onFeatureNameChange: (featureId: number, name: string) => void;
  onRequirementChange: (featureId: number, team: string, field: string, value: string) => void;
}

export function FeatureList({
  features,
  onFeatureAdd,
  onFeatureNameChange,
  onRequirementChange,
}: FeatureListProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Features</h3>
        <Button onClick={onFeatureAdd}>Add Feature</Button>
      </div>
      <div className="max-h-[300px] overflow-y-auto pr-2 space-y-4 p-1">
        {features.map(feature => (
          <FeatureItem
            key={feature.id}
            feature={feature}
            onFeatureNameChange={onFeatureNameChange}
            onRequirementChange={onRequirementChange}
          />
        ))}
      </div>
    </div>
  );
}
