import { TeamConfig } from '@/types/capacity-planner';

export type TeamSizeVariation = {
  team: string;
  week: number;
  size: number;
};

export type TeamCardProps = {
  teamName: string;
  config: TeamConfig;
  onTeamRemove: (team: string) => void;
  onTeamRename: (oldName: string, newName: string) => void;
  onTeamSizeChange: (team: string, size: number) => void;
  onWipLimitChange: (team: string, value: number) => void;
};

export type AddTeamFormProps = {
  onAddTeam: (teamName: string) => void;
};

export type TeamSizeVariationsProps = {
  teams: Record<string, TeamConfig>;
  startDate: Date;
  onVariationAdd: (variation: TeamSizeVariation) => void;
  onVariationRemove: (team: string, week: number) => void;
  onVariationEdit: (team: string, week: number, size: number) => void;
};
