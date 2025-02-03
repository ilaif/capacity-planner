import { startOfWeek } from 'date-fns';

export interface PlanState {
  features: Feature[];
  teams: Teams;
  overheadFactor: number;
  startDate: Date;
}

export const DEFAULT_STATE: PlanState = {
  startDate: startOfWeek(new Date()),
  overheadFactor: 1.2,
  teams: {
    'Team 1': {
      sizes: [{ week: 0, size: 5 }],
      teamLoad: 2,
    },
  },
  features: [
    {
      id: 1,
      name: 'Feature 1',
      requirements: {
        'Team 1': {
          weeks: 2,
          parallel: 1,
        },
      },
    },
  ],
};

export interface FeatureCSV {
  feature: string;
  [key: string]: string;
}

export interface TimelineItem {
  feature: string;
  startWeek: number;
  endWeek: number;
  assignments: {
    [team: string]: {
      weeks: number;
      parallel: number;
    };
  };
}

export interface TeamAvailability {
  [team: string]: number[];
}

export interface SizeVariation {
  week: number;
  size: number;
}

export interface TeamConfig {
  sizes: SizeVariation[];
  teamLoad: number;
}

export interface Teams {
  [key: string]: TeamConfig;
}

export interface TeamSizeVariation {
  team: string;
  week: number;
  size: number;
}

export interface ResourceNeeds {
  [team: string]: {
    weeks: number;
    parallel: number;
  };
}

export interface Requirements {
  [team: string]: {
    weeks: number;
    parallel: number;
  };
}

export interface Feature {
  id: number;
  name: string;
  requirements: Requirements;
}

export interface ImportHandlers {
  onFeaturesUploaded: (features: Feature[]) => void;
  onTeamAdd: (teamName: string) => void;
  onTeamRemove: (teamName: string) => void;
  onTeamSizeChange: (team: string, value: number) => void;
  onWipLimitChange: (team: string, value: number) => void;
  onTeamSizeVariationAdd: (variation: { team: string; week: number; size: number }) => void;
  onOverheadFactorChange: (value: number) => void;
  onStartDateChange: (date: Date) => void;
}
