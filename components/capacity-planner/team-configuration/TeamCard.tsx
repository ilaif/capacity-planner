'use client';

import { useState } from 'react';
import { X, Edit2, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TeamAvatar } from '@/components/ui/team-avatar';
import { NumberInput } from '@/components/ui/number-input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TeamCardProps } from './types';
import { DebouncedTextarea } from '@/components/ui/debounced-textarea';

export function TeamCard({
  teamName,
  config,
  onTeamRemove,
  onTeamRename,
  onTeamSizeChange,
  onWipLimitChange,
  onDescriptionChange,
}: TeamCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(teamName);

  const handleRename = () => {
    if (editedName.trim() && editedName !== teamName) {
      onTeamRename(teamName, editedName.trim());
    }
    setIsEditing(false);
  };

  const getBaseTeamSize = () => config.sizes?.[0]?.size || 0;

  if (isEditing) {
    return (
      <div className="col-span-1 flex items-center gap-1">
        <Input
          value={editedName}
          onChange={e => setEditedName(e.target.value)}
          className="h-8"
          onKeyDown={e => e.key === 'Enter' && handleRename()}
        />
        <Button variant="ghost" size="sm" onClick={handleRename} className="h-8 px-2">
          Save
        </Button>
      </div>
    );
  }

  return (
    <div className="col-span-1 flex flex-col gap-2 p-2 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TeamAvatar teamName={teamName} size={24} />
          <label className="text-sm font-medium">{teamName}</label>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 px-2">
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTeamRemove(teamName)}
            className="h-8 px-2"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <div className="flex gap-1 items-center mb-1">
            <span className="text-xs text-muted-foreground">Description</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Brief description of the team's responsibilities</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <DebouncedTextarea
            value={config.description || ''}
            onChange={value => onDescriptionChange(teamName, value)}
            placeholder="Team description..."
            className="min-h-[60px] text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex gap-1 items-center">
              <span className="text-xs text-muted-foreground">Size</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Base number of engineers in the team</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <NumberInput
              value={getBaseTeamSize()}
              onChange={value => onTeamSizeChange(teamName, value)}
              min={0}
              inputClassName="w-full"
            />
          </div>
          <div>
            <div className="flex gap-1 items-center">
              <span className="text-xs text-muted-foreground">Team load</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Current team size divided by this number determines how many features the team
                      can work on simultaneously.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <NumberInput
              value={config.teamLoad}
              onChange={value => onWipLimitChange(teamName, value)}
              min={0.5}
              step={0.5}
              inputClassName="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
