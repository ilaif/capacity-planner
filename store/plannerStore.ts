import { create } from 'zustand';
import { persist, PersistStorage, StorageValue } from 'zustand/middleware';
import { temporal } from 'zundo';
import { Feature, Teams } from '@/types/capacity-planner';
import { logger } from '@/services/loggerService';
import { decodeState, DEFAULT_STATE, encodeState } from '@/services/stateService';

export interface PlannerState {
  features: Feature[];
  teams: Teams;
  overheadFactor: number;
  startDate: Date;
  configurationName?: string;
}

export const newPlannerState = (
  features: Feature[],
  teams: Teams,
  overheadFactor: number,
  startDate: Date,
  configurationName?: string
): PlannerState => ({
  features,
  teams,
  overheadFactor,
  startDate,
  configurationName,
});

interface PlannerActions {
  setFeatures: (features: Feature[]) => void;
  setTeams: (teams: Teams) => void;
  setOverheadFactor: (factor: number) => void;
  setStartDate: (date: Date) => void;
  setConfigurationName: (name: string | undefined) => void;
  setState: (state: Partial<PlannerState>) => void;
  reset: () => void;
}

const stateUrlStorage: PersistStorage<PlannerState> = {
  getItem: (key: string): StorageValue<PlannerState> | null => {
    const searchParams = new URLSearchParams(location.search);
    const storedValue = searchParams.get(key);
    if (!storedValue) return null;
    const decoded = decodeState(storedValue);
    if (!decoded) return null;
    return { state: decoded };
  },
  setItem: (key: string, newValue: StorageValue<PlannerState>) => {
    const searchParams = new URLSearchParams(location.search);
    const encoded = encodeState(newValue.state);
    searchParams.set(key, encoded);
    history.replaceState({}, '', `${location.pathname}?${searchParams.toString()}`);
  },
  removeItem: (key: string) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.delete(key);
    history.replaceState({}, '', `${location.pathname}?${searchParams.toString()}`);
  },
};

export const usePlannerStore = create<PlannerState & PlannerActions>()(
  persist(
    temporal(set => ({
      ...DEFAULT_STATE,

      setFeatures: features => {
        logger.debug('Setting features', { count: features.length });
        set({ features });
      },

      setTeams: teams => {
        logger.debug('Setting teams', { count: Object.keys(teams).length });
        set({ teams });
      },

      setOverheadFactor: overheadFactor => {
        logger.debug('Setting overhead factor', { overheadFactor });
        set({ overheadFactor });
      },

      setStartDate: startDate => {
        logger.debug('Setting start date', { startDate });
        set({ startDate });
      },

      setConfigurationName: configurationName => {
        logger.debug('Setting configuration name', { configurationName });
        set({ configurationName });
      },

      setState: newState => {
        logger.debug('Setting partial state', newState);
        set(state => ({ ...state, ...newState }));
      },

      reset: () => {
        logger.debug('Resetting state to default');
        set(DEFAULT_STATE);
      },
    })),
    {
      name: 'state',
      storage: stateUrlStorage,
    }
  )
);
