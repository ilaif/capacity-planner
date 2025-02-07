'use client';

import { X } from 'lucide-react';
import { format, addWeeks } from 'date-fns';
import { Button } from '@/components/ui/button';
import { TeamAvatar } from '@/components/ui/team-avatar';
import { NumberInput } from '@/components/ui/number-input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TeamSizeVariation } from '../types';

type VariationItemProps = {
  variation: TeamSizeVariation;
  startDate: Date;
  onEdit: (team: string, week: number, size: number) => void;
  onRemove: (team: string, week: number) => void;
};

export function VariationItem({ variation, startDate, onEdit, onRemove }: VariationItemProps) {
  const { team, week, size } = variation;

  return (
    <div className="flex items-center bg-gray-50 dark:bg-gray-800/50 px-2 py-1 rounded text-sm">
      <div className="flex items-center space-x-2">
        <TeamAvatar teamName={team} size={16} />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span className="text-gray-500 dark:text-gray-400">W{week}:</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{format(addWeeks(startDate, week), 'MMM d, yyyy')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <NumberInput
          value={size}
          onChange={value => onEdit(team, week, value)}
          min={0}
          className="w-16"
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(team, week)}
        className="h-6 w-6 ml-5"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
