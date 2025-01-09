import { Feature, Teams } from '@/types/resource-planner';
import { logger } from '@/services/loggerService';

export const LOCAL_STORAGE_KEYS = {
  FEATURES: 'resource-planner-features',
  TEAMS: 'resource-planner-teams',
  OVERHEAD: 'resource-planner-overhead',
};

export const QUERY_PARAM_KEY = 's';

export interface PlannerState {
  features: Feature[];
  teams: Teams;
  overheadFactor: number;
}

export const DEFAULT_STATE: PlannerState = {
  features: [{ id: 1, name: 'Feature 1', requirements: {} }],
  teams: {},
  overheadFactor: 1.2,
};

const encodeState = (state: Partial<PlannerState>): string => {
  try {
    const encoded = btoa(JSON.stringify(state));
    logger.debug('State encoded successfully', { stateSize: encoded.length });
    return encoded;
  } catch (error) {
    logger.error('Failed to encode state', error as Error, { state });
    throw error;
  }
};

const decodeState = (encoded: string): Partial<PlannerState> | null => {
  try {
    const decoded = JSON.parse(atob(encoded));
    logger.debug('State decoded successfully');
    return decoded;
  } catch (error) {
    logger.error('Failed to decode state', error as Error, { encoded });
    return null;
  }
};

export const loadFromLocalStorage = (): PlannerState => {
  logger.info('Loading state from localStorage');

  if (typeof window === 'undefined') {
    logger.debug('Window undefined, returning default state');
    return DEFAULT_STATE;
  }

  try {
    const features = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.FEATURES) || 'null');
    const teams = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.TEAMS) || 'null');
    const overheadFactor = parseFloat(localStorage.getItem(LOCAL_STORAGE_KEYS.OVERHEAD) || 'null');

    const state = {
      features: features || DEFAULT_STATE.features,
      teams: teams || DEFAULT_STATE.teams,
      overheadFactor: overheadFactor || DEFAULT_STATE.overheadFactor,
    };

    logger.info('State loaded from localStorage', {
      featuresCount: state.features.length,
      teamsCount: Object.keys(state.teams).length,
      overheadFactor: state.overheadFactor,
    });

    return state;
  } catch (error) {
    logger.error('Failed to load state from localStorage', error as Error);
    return DEFAULT_STATE;
  }
};

export const saveToLocalStorage = (state: PlannerState): void => {
  logger.info('Saving state to localStorage');

  if (typeof window === 'undefined') {
    logger.debug('Window undefined, skipping localStorage save');
    return;
  }

  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.FEATURES, JSON.stringify(state.features));
    localStorage.setItem(LOCAL_STORAGE_KEYS.TEAMS, JSON.stringify(state.teams));
    localStorage.setItem(LOCAL_STORAGE_KEYS.OVERHEAD, state.overheadFactor.toString());

    logger.info('State saved to localStorage successfully', {
      featuresCount: state.features.length,
      teamsCount: Object.keys(state.teams).length,
      overheadFactor: state.overheadFactor,
    });
  } catch (error) {
    logger.error('Failed to save state to localStorage', error as Error, { state });
  }
};

export const loadFromURL = (): PlannerState | null => {
  logger.info('Loading state from URL');

  if (typeof window === 'undefined') {
    logger.debug('Window undefined, skipping URL load');
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const encodedState = params.get(QUERY_PARAM_KEY);

  if (!encodedState) {
    logger.debug('No state found in URL');
    return null;
  }

  try {
    const decodedState = decodeState(encodedState);
    if (!decodedState) {
      logger.warn('Failed to decode state from URL');
      return null;
    }

    // Start with default state and merge with decoded state
    const mergedState = {
      ...DEFAULT_STATE,
      ...decodedState,
    };

    logger.info('State loaded from URL successfully', {
      featuresCount: mergedState.features.length,
      teamsCount: Object.keys(mergedState.teams).length,
      overheadFactor: mergedState.overheadFactor,
    });

    return mergedState;
  } catch (error) {
    logger.error('Failed to parse URL state', error as Error);
    return null;
  }
};

export const updateURL = (state: PlannerState): void => {
  logger.info('Updating state in URL');

  if (typeof window === 'undefined') {
    logger.debug('Window undefined, skipping URL update');
    return;
  }

  try {
    const url = new URL(window.location.href);
    const encodedState = encodeState(state);
    url.searchParams.set(QUERY_PARAM_KEY, encodedState);
    window.history.replaceState({}, '', url.toString());
    logger.info('URL updated successfully');
  } catch (error) {
    logger.error('Failed to update URL with state', error as Error, { state });
  }
};

export const getInitialState = (): PlannerState => {
  logger.info('Getting initial state');

  if (typeof window === 'undefined') {
    logger.debug('Window undefined, returning default state');
    return DEFAULT_STATE;
  }

  const urlState = loadFromURL();
  if (urlState) {
    logger.info('Using state from URL');
    return urlState;
  }

  logger.info('Using default state');
  return DEFAULT_STATE;
};
