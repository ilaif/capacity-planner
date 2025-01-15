import { Input } from '@/components/ui/input';
import { Feature } from '@/types/capacity-planner';
import { Button } from '@/components/ui/button';
import { X, GripVertical, Users } from 'lucide-react';
import React, { lazy, Suspense, useImperativeHandle, forwardRef, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { NumberInput } from '@/components/ui/number-input';
import { TeamAvatar } from '@/components/ui/team-avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

export interface FeatureItemHandle {
  focus: () => void;
}

export const FeatureItem = forwardRef<FeatureItemHandle, FeatureItemProps>(
  ({ feature, onFeatureNameChange, onRequirementChange, onFeatureRemove }, ref) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: feature.id.toString(),
    });
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
    }));

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div ref={setNodeRef} style={style} id={`feature-${feature.id}`} className="space-y-2">
        <div className="flex gap-4">
          <Suspense fallback={<div className="w-4 h-4" />}>
            <SortableHandle listeners={listeners} attributes={attributes} />
          </Suspense>
          <div className="flex-1 flex gap-2">
            <Input
              ref={inputRef}
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
        <div className="flex flex-wrap gap-2">
          {Object.entries(feature.requirements).map(([team, requirement]) => (
            <React.Fragment key={team}>
              <div className="flex items-center gap-2">
                <TeamAvatar teamName={team} size={16} />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <label className="text-xs whitespace-nowrap"># Weeks</label>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Number of engineer weeks needed by {team} team to complete their part of the
                        feature
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <NumberInput
                  value={requirement.weeks}
                  onChange={value =>
                    onRequirementChange(feature.id, team, 'weeks', value.toString())
                  }
                  min={0}
                  className="max-w-20"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <label className="text-xs whitespace-nowrap">
                        <Users className="h-3.5 w-3.5" />
                      </label>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Number of team members that can work in parallel</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <NumberInput
                  value={requirement.parallel}
                  min={1}
                  onChange={value =>
                    onRequirementChange(feature.id, team, 'parallel', value.toString())
                  }
                  className="max-w-20"
                />
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }
);

FeatureItem.displayName = 'FeatureItem';
