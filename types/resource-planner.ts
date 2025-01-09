export interface FeatureCSV {
  feature: string;
  provider_weeks: string;
  provider_parallel: string;
  platform_weeks: string;
  platform_parallel: string;
}

export interface TimelineItem {
  feature: string;
  startWeek: number;
  endWeek?: number;
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

export interface Teams {
  [key: string]: number;
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
