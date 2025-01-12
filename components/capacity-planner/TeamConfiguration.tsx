import { Input } from '@/components/ui/input';
import { Teams, TeamSizeVariation, TeamConfig } from '@/types/capacity-planner';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TeamAvatar } from '@/components/ui/team-avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus, Edit2, HelpCircle } from 'lucide-react';
import { TeamSizeChart } from './TeamSizeChart';
import { NumberInput } from '@/components/ui/number-input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { logger } from '@/services/loggerService';

interface TeamConfigurationProps {
  teams: Teams;
  onTeamSizeChange: (team: string, value: string) => void;
  onWipLimitChange: (team: string, value: number) => void;
  onTeamSizeVariationAdd: (variation: TeamSizeVariation) => void;
  onTeamSizeVariationRemove: (team: string, week: number) => void;
  onTeamAdd: (teamName: string) => void;
  onTeamRemove: (teamName: string) => void;
  onTeamRename: (oldName: string, newName: string) => void;
}

export function TeamConfiguration({
  teams,
  onTeamSizeChange,
  onWipLimitChange,
  onTeamSizeVariationAdd,
  onTeamSizeVariationRemove,
  onTeamAdd,
  onTeamRemove,
  onTeamRename,
}: TeamConfigurationProps) {
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [variationSize, setVariationSize] = useState<string>('');
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editedTeamName, setEditedTeamName] = useState<string>('');

  const handleAddTeam = () => {
    if (newTeamName && !teams[newTeamName]) {
      onTeamAdd(newTeamName);
      setNewTeamName('');
    }
  };

  const startEditingTeam = (team: string) => {
    setEditingTeam(team);
    setEditedTeamName(team);
  };

  const handleRenameTeam = () => {
    if (editingTeam && editedTeamName && editingTeam !== editedTeamName) {
      onTeamRename(editingTeam, editedTeamName);
      setEditingTeam(null);
      setEditedTeamName('');
    }
  };

  const handleAddVariation = () => {
    if (selectedTeam && selectedWeek && variationSize) {
      onTeamSizeVariationAdd({
        team: selectedTeam,
        week: parseInt(selectedWeek),
        size: parseInt(variationSize),
      });
      setSelectedWeek('');
      setVariationSize('');
    }
  };

  const handleVariationEdit = (team: string, week: number, newSize: number) => {
    onTeamSizeVariationAdd({
      team,
      week,
      size: newSize,
    });
  };

  const getVariations = () => {
    const variations: { team: string; week: number; size: number }[] = [];
    Object.entries(teams).forEach(([team, config]) => {
      const size = config.size;
      const baseSize = size[0];
      // Only check indices where we have explicit variations
      for (let i = 0; i < size.length; i++) {
        if (size[i] !== undefined && size[i] !== baseSize) {
          variations.push({ team, week: i, size: size[i] });
        }
      }
    });
    return variations.sort((a, b) => a.week - b.week);
  };

  const getBaseTeamSize = (config: TeamConfig): number => {
    return config.size[0];
  };

  logger.info('TeamConfiguration', { teams });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Input
            value={newTeamName}
            onChange={e => setNewTeamName(e.target.value)}
            placeholder="New team name"
            className="h-8 w-40"
          />
          <Button onClick={handleAddTeam} size="sm" className="h-8">
            <Plus className="h-4 w-4 mr-1" /> Add Team
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {Object.entries(teams).map(([team, config]) => (
          <div key={team} className="col-span-1 flex items-center gap-1">
            {editingTeam === team ? (
              <>
                <Input
                  value={editedTeamName}
                  onChange={e => setEditedTeamName(e.target.value)}
                  className="h-8"
                  onKeyDown={e => e.key === 'Enter' && handleRenameTeam()}
                />
                <Button variant="ghost" size="sm" onClick={handleRenameTeam} className="h-8 px-2">
                  Save
                </Button>
              </>
            ) : (
              <>
                <div className="flex-1 flex items-center gap-1">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <TeamAvatar teamName={team} size={24} />
                      <label className="text-xs font-medium">{team}</label>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <div className="flex gap-1 items-center">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">Size</span>
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
                            value={getBaseTeamSize(config)}
                            onChange={value => onTeamSizeChange(team, value.toString())}
                            min={0}
                            inputClassName="max-w-12"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex gap-1 items-center">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">WIP Limit</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">
                                    Maximum number of features the team can work on simultaneously
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <NumberInput
                            value={config.wipLimit}
                            onChange={value => onWipLimitChange(team, value)}
                            min={1}
                            inputClassName="max-w-12"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditingTeam(team)}
                    className="h-8 px-2 self-end"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onTeamRemove(team)}
                    className="h-8 px-2 self-end"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="border-t pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Size Variations</h4>
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
            <Button onClick={handleAddVariation} className="h-8">
              Add
            </Button>
          </div>
        </div>

        <div className="mt-1">
          {getVariations().length > 0 ? (
            <div className="grid grid-cols-4 gap-1">
              {getVariations().map(({ team, week, size }) => (
                <div
                  key={`${team}-${week}`}
                  className="flex items-center bg-gray-50 px-2 py-1 rounded text-sm"
                >
                  <div className="flex items-center space-x-2">
                    <TeamAvatar teamName={team} size={16} />
                    <span className="text-gray-500">W{week}:</span>
                    <NumberInput
                      value={size}
                      onChange={value => handleVariationEdit(team, week, value)}
                      min={0}
                      className="w-16"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onTeamSizeVariationRemove(team, week)}
                    className="h-6 w-6 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No variations</p>
          )}
        </div>
      </div>

      <TeamSizeChart teams={teams} />
    </div>
  );
}
