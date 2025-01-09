import { Input } from '@/components/ui/input';
import { Teams, TeamSizeVariation } from '@/types/capacity-planner';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus, Edit2 } from 'lucide-react';

interface TeamConfigurationProps {
  teams: Teams;
  onTeamSizeChange: (team: string, value: string) => void;
  onTeamSizeVariationAdd: (variation: TeamSizeVariation) => void;
  onTeamSizeVariationRemove: (team: string, week: number) => void;
  onTeamAdd: (teamName: string) => void;
  onTeamRemove: (teamName: string) => void;
  onTeamRename: (oldName: string, newName: string) => void;
}

export function TeamConfiguration({
  teams,
  onTeamSizeChange,
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

  const handleVariationEdit = (team: string, week: number, newSize: string) => {
    const size = parseInt(newSize);
    if (!isNaN(size)) {
      onTeamSizeVariationAdd({
        team,
        week,
        size,
      });
    }
  };

  const getVariations = () => {
    const variations: { team: string; week: number; size: number }[] = [];
    Object.entries(teams).forEach(([team, sizes]) => {
      if (Array.isArray(sizes)) {
        const baseSize = sizes[0];
        // Only check indices where we have explicit variations
        for (let i = 0; i < sizes.length; i++) {
          if (sizes[i] !== undefined && sizes[i] !== baseSize) {
            variations.push({ team, week: i, size: sizes[i] });
          }
        }
      }
    });
    return variations.sort((a, b) => a.week - b.week);
  };

  const getBaseTeamSize = (size: number | number[]): number => {
    return Array.isArray(size) ? size[0] : size;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Teams</h3>
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

      <div className="grid grid-cols-3 gap-2">
        {Object.entries(teams).map(([team, size]) => (
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
                    <label className="text-xs font-medium">{team}</label>
                    <Input
                      type="number"
                      value={getBaseTeamSize(size)}
                      onChange={e => onTeamSizeChange(team, e.target.value)}
                      min="0"
                      className="h-8"
                    />
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
          <div className="flex gap-1 items-center flex-1 ml-4">
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Team" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(teams).map(team => (
                  <SelectItem key={team} value={team}>
                    {team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={selectedWeek}
              onChange={e => setSelectedWeek(e.target.value)}
              min="0"
              max="51"
              placeholder="Week"
              className="h-8"
            />
            <Input
              type="number"
              value={variationSize}
              onChange={e => setVariationSize(e.target.value)}
              min="0"
              placeholder="Size"
              className="h-8"
            />
            <Button onClick={handleAddVariation} className="h-8">
              Add
            </Button>
          </div>
        </div>

        <div className="mt-1">
          {getVariations().length > 0 ? (
            <div className="grid grid-cols-4 gap-1 max-h-[200px] overflow-y-auto">
              {getVariations().map(({ team, week, size }) => (
                <div
                  key={`${team}-${week}`}
                  className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded text-sm"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-medium w-16">{team}</span>
                    <span className="text-gray-500">W{week}:</span>
                    <Input
                      type="number"
                      value={size}
                      onChange={e => handleVariationEdit(team, week, e.target.value)}
                      min="0"
                      className="h-6 w-16 px-1"
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
    </div>
  );
}
