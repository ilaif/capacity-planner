import { Input } from '@/components/ui/input';
import { Teams } from '@/types/resource-planner';

interface TeamConfigurationProps {
  teams: Teams;
  overheadFactor: number;
  onTeamSizeChange: (team: string, value: string) => void;
  onOverheadFactorChange: (value: number) => void;
}

export function TeamConfiguration({
  teams,
  overheadFactor,
  onTeamSizeChange,
  onOverheadFactorChange,
}: TeamConfigurationProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Team Sizes</h3>
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(teams).map(([team, size]) => (
          <div key={team}>
            <label className="text-sm font-medium">{team}</label>
            <Input
              type="number"
              value={size}
              onChange={e => onTeamSizeChange(team, e.target.value)}
              min="0"
            />
          </div>
        ))}
        <div>
          <label className="text-sm font-medium">Overhead Factor</label>
          <Input
            type="number"
            value={overheadFactor}
            onChange={e => onOverheadFactorChange(parseFloat(e.target.value) || 1)}
            min="1"
            step="0.1"
          />
        </div>
      </div>
    </div>
  );
}
