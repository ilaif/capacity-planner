export interface FeatureCSV {
  feature: string;
  [key: string]: string;
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

export interface TeamConfig {
  size: number[];
  wipLimit: number;
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
