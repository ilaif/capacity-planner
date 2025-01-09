import { Button } from '@/components/ui/button';
import { Feature } from '@/types/capacity-planner';
import { FeatureItem } from './FeatureItem';
import { FeatureUpload } from './FeatureUpload';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

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
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = features.findIndex(f => f.id.toString() === active.id);
      const newIndex = features.findIndex(f => f.id.toString() === over.id);

      const newFeatures = arrayMove(features, oldIndex, newIndex);
      onFeaturesUploaded(newFeatures);
    }
  };

  return (
    <div className="space-y-2">
      <FeatureUpload onFeaturesUploaded={onFeaturesUploaded} teams={teams} />
      <Button onClick={onFeatureAdd}>Add Feature</Button>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="max-h-[300px] overflow-y-auto space-y-4 p-1">
          <SortableContext
            items={features.map(f => f.id.toString())}
            strategy={verticalListSortingStrategy}
          >
            {features.map(feature => (
              <FeatureItem
                key={feature.id}
                feature={feature}
                onFeatureNameChange={onFeatureNameChange}
                onRequirementChange={onRequirementChange}
                onFeatureRemove={onFeatureRemove}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>
    </div>
  );
}
