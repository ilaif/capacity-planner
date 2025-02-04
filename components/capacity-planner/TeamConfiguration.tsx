import { Input } from '@/components/ui/input';
import { TeamSizeVariation, TeamConfig } from '@/types/capacity-planner';
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
import { usePlannerStore } from '@/store/plannerStore';
import { format, addWeeks } from 'date-fns';

export function TeamConfiguration() {
  const { planState, setTeams, setFeatures } = usePlannerStore();
  const { teams, features, startDate } = planState;

  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [variationSize, setVariationSize] = useState<string>('');
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editedTeamName, setEditedTeamName] = useState<string>('');

  const handleTeamRemove = (teamName: string) => {
    logger.info(`Removing team: ${teamName}`);
    const newTeams = { ...teams };
    delete newTeams[teamName];
    setTeams(newTeams);

    setFeatures(
      features.map(feature => {
        const newRequirements = { ...feature.requirements };
        delete newRequirements[teamName];
        return { ...feature, requirements: newRequirements };
      })
    );
    logger.info(`Team ${teamName} removed successfully`);
  };

  const handleTeamSizeChange = (team: string, value: number) => {
    const currentTeam = teams[team];
    const currentSize = currentTeam.sizes;
    const newSizes = [...currentSize];
    newSizes[0] = { week: 0, size: value };

    setTeams({
      ...teams,
      [team]: {
        ...currentTeam,
        sizes: newSizes,
      },
    });
  };

  const handleTeamSizeVariationAdd = (variation: TeamSizeVariation) => {
    logger.info(
      `Adding size variation for team ${variation.team} at week ${variation.week} with size ${variation.size}`
    );
    const currentTeam = teams[variation.team];
    const currentSizes = currentTeam.sizes;
    let newSizes = [...currentSizes];
    newSizes = newSizes.filter(size => size.week !== variation.week);
    newSizes.push({ week: variation.week, size: variation.size });
    newSizes.sort((a, b) => a.week - b.week);

    setTeams({
      ...teams,
      [variation.team]: {
        ...currentTeam,
        sizes: newSizes,
      },
    });
  };

  const handleTeamSizeVariationRemove = (team: string, week: number) => {
    const currentTeam = teams[team];
    const currentSizes = currentTeam.sizes;
    const newSizes = currentSizes.filter(size => size.week !== week);

    setTeams({
      ...teams,
      [team]: {
        ...currentTeam,
        sizes: newSizes,
      },
    });
  };

  const handleAddTeam = () => {
    if (newTeamName && !teams[newTeamName]) {
      setTeams({
        ...teams,
        [newTeamName]: { sizes: [{ week: 0, size: 1 }], teamLoad: 1 },
      });
      // Update all existing features to include the new team
      setFeatures(
        features.map(feature => ({
          ...feature,
          requirements: {
            ...feature.requirements,
            [newTeamName]: { weeks: 0, parallel: 1 },
          },
        }))
      );
      logger.info(`Team ${newTeamName} added successfully`);
      setNewTeamName('');
    }
  };

  const startEditingTeam = (team: string) => {
    setEditingTeam(team);
    setEditedTeamName(team);
  };

  const handleRenameTeam = () => {
    const oldName = editingTeam;
    const newName = editedTeamName;

    if (oldName && newName && oldName !== newName) {
      logger.info(`Renaming team from ${oldName} to ${newName}`);
      if (!teams[newName] && oldName !== newName) {
        const newTeams = { ...teams };
        newTeams[newName] = newTeams[oldName];
        delete newTeams[oldName];
        setTeams(newTeams);

        setFeatures(
          features.map(feature => {
            const newRequirements = { ...feature.requirements };
            if (newRequirements[oldName]) {
              newRequirements[newName] = newRequirements[oldName];
              delete newRequirements[oldName];
            }
            return { ...feature, requirements: newRequirements };
          })
        );
        logger.info(`Team renamed successfully from ${oldName} to ${newName}`);
      } else {
        logger.warn(
          `Cannot rename team: new name ${newName} already exists or names are identical`
        );
      }

      setEditingTeam(null);
      setEditedTeamName('');
    } else {
      setEditingTeam(null);
      setEditedTeamName('');
    }
  };

  const handleAddVariation = () => {
    if (selectedTeam && selectedWeek && variationSize) {
      handleTeamSizeVariationAdd({
        team: selectedTeam,
        week: parseInt(selectedWeek),
        size: parseInt(variationSize),
      });
      setSelectedWeek('');
      setVariationSize('');
    }
  };

  const handleEditVariation = (team: string, week: number, newSize: number) => {
    handleTeamSizeVariationAdd({ team, week, size: newSize });
  };

  const handleWipLimitChange = (team: string, value: number) => {
    setTeams({
      ...teams,
      [team]: {
        ...teams[team],
        teamLoad: value,
      },
    });
  };

  const getVariations = () => {
    const variations: { team: string; week: number; size: number }[] = [];
    Object.entries(teams).forEach(([team, config]) => {
      const sizes = config.sizes;
      // Only check indices where we have explicit variations (after index 0)
      for (let i = 1; i < sizes.length; i++) {
        const size = sizes[i];
        variations.push({ team, week: size.week, size: size.size });
      }
    });
    return variations.sort((a, b) => a.week - b.week);
  };

  const getBaseTeamSize = (config: TeamConfig): number => {
    return config.sizes?.[0]?.size || 0;
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
                            onChange={value => handleTeamSizeChange(team, value)}
                            min={0}
                            inputClassName="max-w-12"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex gap-1 items-center">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">Team load</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">
                                    Current team size divided by this number determines how many
                                    features the team can work on simultaneously.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <NumberInput
                            value={config.teamLoad}
                            onChange={value => handleWipLimitChange(team, value)}
                            min={0.5}
                            step={0.5}
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
                    onClick={() => handleTeamRemove(team)}
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
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="text-gray-500">W{week}:</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{format(addWeeks(startDate, week), 'MMM d, yyyy')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <NumberInput
                      value={size}
                      onChange={value => handleEditVariation(team, week, value)}
                      min={0}
                      className="w-16"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleTeamSizeVariationRemove(team, week)}
                    className="h-6 w-6 ml-5"
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
