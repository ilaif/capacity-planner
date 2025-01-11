import { Input } from '@/components/ui/input';
import { Feature } from '@/types/capacity-planner';
import { Button } from '@/components/ui/button';
import { X, GripVertical } from 'lucide-react';
import React, { lazy, Suspense } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { NumberInput } from '@/components/ui/number-input';

interface SortableHandleProps {
  listeners: SyntheticListenerMap | undefined;
  attributes: DraggableAttributes;
}

// Create the handle component separately
const Handle = ({ listeners, attributes }: SortableHandleProps) => (
  <Button
    variant="ghost"
    size="sm"
    className="cursor-grab active:cursor-grabbing p-0 h-auto"
    {...attributes}
    {...listeners}
  >
    <GripVertical className="h-4 w-4" />
  </Button>
);

// Lazy load the handle component
const SortableHandle = lazy(() => Promise.resolve({ default: Handle }));

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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: feature.id.toString(),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-2">
      <div className="flex gap-4">
        <Suspense fallback={<div className="w-4 h-4" />}>
          <SortableHandle listeners={listeners} attributes={attributes} />
        </Suspense>
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
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(feature.requirements).map(([team, requirement]) => (
          <React.Fragment key={team}>
            <div className="flex items-center gap-2">
              <label className="text-xs whitespace-nowrap">{team} weeks</label>
              <NumberInput
                value={requirement.weeks}
                onChange={value => onRequirementChange(feature.id, team, 'weeks', value.toString())}
                min={0}
                className="w-16"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs whitespace-nowrap">{team} parallel</label>
              <NumberInput
                value={requirement.parallel}
                onChange={value =>
                  onRequirementChange(feature.id, team, 'parallel', value.toString())
                }
                min={1}
                className="w-16"
              />
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
