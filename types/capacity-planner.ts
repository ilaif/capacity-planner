import { startOfWeek } from 'date-fns';

export type Project = {
  id: number;
  name: string;
  description: string;
  color: string;
};

export type PlanState = {
  features: Feature[];
  teams: Teams;
  overheadFactor: number;
  startDate: Date;
  projects: Project[];
};

export const EMPTY_STATE: PlanState = {
  startDate: startOfWeek(new Date()),
  overheadFactor: 1.2,
  teams: {},
  features: [],
  projects: [],
};

export const DEFAULT_STATE: PlanState = {
  startDate: startOfWeek(new Date()),
  overheadFactor: 1.2,
  teams: {
    'Team 1': {
      sizes: [{ week: 0, size: 5 }],
      teamLoad: 2,
      description: 'A sample team description',
    },
  },
  projects: [
    {
      id: 1,
      name: 'Project 1',
      description: 'A sample project',
      color: '#2563eb',
    },
  ],
  features: [
    {
      id: 1,
      name: 'Feature 1',
      description: 'A sample feature description',
      requirements: {
        'Team 1': {
          weeks: 2,
          parallel: 1,
        },
      },
      projectId: 1,
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
  description?: string;
};

export type Teams = {
  [key: string]: TeamConfig;
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
  description: string;
  requirements: Requirements;
  projectId: number | null;
};
