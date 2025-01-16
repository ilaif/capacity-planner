import { Button } from '@/components/ui/button';
import { Feature } from '@/types/capacity-planner';
import { FeatureItem, FeatureItemHandle } from './FeatureItem';
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
import { useRef, useImperativeHandle, forwardRef } from 'react';

interface FeaturesProps {
  features: Feature[];
  teams: string[];
  onFeatureAdd: () => void;
  onFeatureNameChange: (featureId: number, name: string) => void;
  onRequirementChange: (featureId: number, team: string, field: string, value: string) => void;
  onFeaturesUploaded: (features: Feature[]) => void;
  onFeatureRemove: (featureId: number) => void;
}

export interface FeaturesHandle {
  focusFeature: (featureName: string) => void;
}

export const Features = forwardRef<FeaturesHandle, FeaturesProps>(
  (
    {
      features,
      teams,
      onFeatureAdd,
      onFeatureNameChange,
      onRequirementChange,
      onFeaturesUploaded,
      onFeatureRemove,
    },
    ref
  ) => {
    const featureRefs = useRef<Map<number, FeatureItemHandle>>(new Map());

    useImperativeHandle(ref, () => ({
      focusFeature: (featureName: string) => {
        const feature = features.find(f => f.name === featureName);
        if (feature) {
          const featureRef = featureRefs.current.get(feature.id);
          featureRef?.focus();
        }
      },
    }));

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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="space-y-4 p-1">
            <SortableContext
              items={features.map(f => f.id.toString())}
              strategy={verticalListSortingStrategy}
            >
              {features.map(feature => (
                <FeatureItem
                  key={feature.id}
                  ref={ref => {
                    if (ref) {
                      featureRefs.current.set(feature.id, ref);
                    } else {
                      featureRefs.current.delete(feature.id);
                    }
                  }}
                  feature={feature}
                  onFeatureNameChange={onFeatureNameChange}
                  onRequirementChange={onRequirementChange}
                  onFeatureRemove={onFeatureRemove}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>
        <Button onClick={onFeatureAdd}>Add Feature</Button>
      </div>
    );
  }
);

Features.displayName = 'Features';
