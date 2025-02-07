'use client';

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { format, addWeeks } from 'date-fns';
import { Button } from '@/components/ui/button';
import { TeamAvatar } from '@/components/ui/team-avatar';
import { NumberInput } from '@/components/ui/number-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TeamConfig } from '@/types/capacity-planner';
import { TeamSizeVariation } from '../types';

type VariationFormProps = {
  teams: Record<string, TeamConfig>;
  startDate: Date;
  onAdd: (variation: TeamSizeVariation) => void;
};

export function VariationForm({ teams, startDate, onAdd }: VariationFormProps) {
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [variationSize, setVariationSize] = useState<string>('');

  const handleSubmit = () => {
    if (selectedTeam && selectedWeek && variationSize) {
      onAdd({
        team: selectedTeam,
        week: parseInt(selectedWeek),
        size: parseInt(variationSize),
      });
      setSelectedWeek('');
      setVariationSize('');
    }
  };

  return (
    <div className="flex gap-2 items-center flex-1 ml-4">
      <Select value={selectedTeam} onValueChange={setSelectedTeam}>
        <SelectTrigger className="h-8">
          <SelectValue placeholder="Team" />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(teams).map(team => (
            <SelectItem key={team} value={team} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <TeamAvatar teamName={team} size={16} />
                {team}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">Week</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">The week number when the team size changes</p>
              {selectedWeek && (
                <p className="text-xs text-muted-foreground mt-1">
                  {format(addWeeks(startDate, parseInt(selectedWeek)), 'MMM d, yyyy')}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <NumberInput
        value={selectedWeek ? parseInt(selectedWeek) : 0}
        onChange={value => setSelectedWeek(value.toString())}
        min={0}
        max={51}
        className="w-24"
        placeholder="Week"
      />
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">Size</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">The new team size starting from the specified week</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <NumberInput
        value={variationSize ? parseInt(variationSize) : 0}
        onChange={value => setVariationSize(value.toString())}
        min={0}
        className="w-24"
        placeholder="Size"
      />
      <Button onClick={handleSubmit} className="h-8">
        Add
      </Button>
    </div>
  );
}
