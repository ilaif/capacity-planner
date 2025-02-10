import { Feature } from '@/types/capacity-planner';
import { Button } from '@/components/ui/button';
import { X, GripVertical, Users } from 'lucide-react';
import React, { lazy, Suspense, useImperativeHandle, forwardRef, useRef, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { NumberInput } from '@/components/ui/number-input';
import { TeamAvatar } from '@/components/ui/team-avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DebouncedInput } from '@/components/ui/debounced-input';
import { DebouncedTextarea } from '@/components/ui/debounced-textarea';
import { usePlannerStore } from '@/store/plannerStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { PROJECT_COLORS } from '@/lib/colors';

type SortableHandleProps = {
  listeners: SyntheticListenerMap | undefined;
  attributes: DraggableAttributes;
};

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

type FeatureItemProps = {
  feature: Feature;
  onFeatureNameChange: (featureId: number, name: string) => void;
  onDescriptionChange: (featureId: number, description: string) => void;
  onRequirementChange: (featureId: number, team: string, field: string, value: string) => void;
  onFeatureRemove: (featureId: number) => void;
};

export type FeatureItemHandle = {
  focus: () => void;
};

export const FeatureItem = forwardRef<FeatureItemHandle, FeatureItemProps>(
  (
    { feature, onFeatureNameChange, onDescriptionChange, onRequirementChange, onFeatureRemove },
    ref
  ) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: feature.id.toString(),
    });
    const inputRef = useRef<HTMLInputElement>(null);

    const projects = usePlannerStore(state => state.planState.projects);
    const setFeatureProject = usePlannerStore(state => state.setFeatureProject);

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

    const currentProject = projects.find(p => p.id === feature.projectId);
    const colorConfig = currentProject
      ? PROJECT_COLORS.find(c => c.value === currentProject.color)
      : undefined;

    const handleProjectChange = useCallback(
      (value: string) => {
        setFeatureProject(feature.id, value === 'none' ? null : parseInt(value, 10));
      },
      [feature.id, setFeatureProject]
    );

    return (
      <div ref={setNodeRef} style={style} id={`feature-${feature.id}`} className="space-y-2">
        <div className={cn('flex gap-4 p-3 rounded-lg')}>
          <Suspense fallback={<div className="w-4 h-4" />}>
            <SortableHandle listeners={listeners} attributes={attributes} />
          </Suspense>
          <div className="flex-1 flex gap-2">
            <DebouncedInput
              ref={inputRef}
              value={feature.name}
              onChange={value => onFeatureNameChange(feature.id, value)}
            />
            <Select
              value={feature.projectId?.toString() ?? 'none'}
              onValueChange={handleProjectChange}
            >
              <SelectTrigger className={cn('w-[180px]', colorConfig?.bgClass)}>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Project</SelectItem>
                {projects.map(project => {
                  const projectColor = PROJECT_COLORS.find(c => c.value === project.color);
                  return (
                    <SelectItem
                      key={project.id}
                      value={project.id.toString()}
                      className={cn(projectColor?.bgClass)}
                    >
                      {project.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
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
        <div className="px-11">
          <DebouncedTextarea
            placeholder="Enter feature description..."
            value={feature.description}
            onChange={value => onDescriptionChange(feature.id, value)}
          />
          <div className="flex flex-wrap gap-2 mt-2">
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
                          Number of engineer weeks needed by {team} team to complete their part of
                          the feature
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
      </div>
    );
  }
);

FeatureItem.displayName = 'FeatureItem';
