import { startOfWeek } from 'date-fns';

export type PlanState = {
  features: Feature[];
  teams: Teams;
  overheadFactor: number;
  startDate: Date;
};

export const EMPTY_STATE: PlanState = {
  startDate: startOfWeek(new Date()),
  overheadFactor: 1.2,
  teams: {},
  features: [],
};

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

export type FeatureCSV = {
  feature: string;
  [key: string]: string;
};

export type TimelineItem = {
  feature: string;
  startWeek: number;
  endWeek: number;
  assignments: {
    [team: string]: {
      weeks: number;
      parallel: number;
    };
  };
};

export type TeamAvailability = {
  [team: string]: number[];
};

export type SizeVariation = {
  week: number;
  size: number;
};

export type TeamConfig = {
  sizes: SizeVariation[];
  teamLoad: number;
};

export type Teams = {
  [key: string]: TeamConfig;
};

export type TeamSizeVariation = {
  team: string;
  week: number;
  size: number;
};

export type ResourceNeeds = {
  [team: string]: {
    weeks: number;
    parallel: number;
  };
};

export type Requirements = {
  [team: string]: {
    weeks: number;
    parallel: number;
  };
};

export type Feature = {
  id: number;
  name: string;
  requirements: Requirements;
};

export type ImportHandlers = {
  onFeaturesUploaded: (features: Feature[]) => void;
  onTeamAdd: (teamName: string) => void;
  onTeamRemove: (teamName: string) => void;
  onTeamSizeChange: (team: string, value: number) => void;
  onWipLimitChange: (team: string, value: number) => void;
  onTeamSizeVariationAdd: (variation: { team: string; week: number; size: number }) => void;
  onOverheadFactorChange: (value: number) => void;
  onStartDateChange: (date: Date) => void;
};
