import { Button } from '@/components/ui/button';
import { FeatureItem, FeatureItemHandle } from './FeatureItem';
import { FeatureUpload } from './FeatureUpload';
import { usePlannerStore } from '@/store/plannerStore';
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
import { logger } from '@/services/loggerService';

export type FeaturesHandle = {
  focusFeature: (featureName: string) => void;
};

type FeaturesProps = Record<string, never>;

export const Features = forwardRef<FeaturesHandle, FeaturesProps>((_props, ref) => {
  const featureRefs = useRef<Map<number, FeatureItemHandle>>(new Map());
  const { planState, setFeatures } = usePlannerStore();
  const { features, teams } = planState;

  const handleFeatureAdd = () => {
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
                  [field]: parseInt(value),
                },
              },
            }
          : feature
      )
    );
  };

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
      setFeatures(newFeatures);
    }
  };

  return (
    <div className="space-y-2">
      <FeatureUpload onFeaturesUploaded={setFeatures} teamNames={Object.keys(teams)} />
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
                onFeatureNameChange={handleFeatureNameChange}
                onRequirementChange={handleRequirementChange}
                onFeatureRemove={handleFeatureRemove}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>
      <Button onClick={handleFeatureAdd}>Add Feature</Button>
    </div>
  );
});

Features.displayName = 'Features';
