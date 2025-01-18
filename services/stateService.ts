import { Feature, Teams } from '@/types/capacity-planner';
import { logger } from '@/services/loggerService';
import { startOfWeek } from 'date-fns';

const STORAGE_KEYS = {
  FEATURES: 'capacity-planner-features',
  TEAMS: 'capacity-planner-teams',
  OVERHEAD: 'capacity-planner-overhead',
  START_DATE: 'capacity-planner-start-date',
};

export const QUERY_PARAM_KEY = 's';

export interface PlannerState {
  features: Feature[];
  teams: Teams;
  overheadFactor: number;
  startDate: Date;
  configurationName?: string;
}

export const DEFAULT_STATE: PlannerState = {
  features: [{ id: 1, name: 'Feature 1', requirements: {} }],
  teams: {},
  overheadFactor: 1.2,
  startDate: startOfWeek(new Date()),
  configurationName: undefined,
};

export const encodeState = (state: Partial<PlannerState>): string => {
  try {
    const encoded = btoa(JSON.stringify(state));
    logger.debug('State encoded successfully', { stateSize: encoded.length });
    return encoded;
  } catch (error) {
    logger.error('Failed to encode state', error as Error, { state });
    throw error;
  }
};

export const decodeState = (encoded: string): Partial<PlannerState> | null => {
  try {
    const decoded = JSON.parse(atob(encoded));
    decoded.startDate = decoded.startDate ? new Date(decoded.startDate) : DEFAULT_STATE.startDate;
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
    const features = JSON.parse(localStorage.getItem(STORAGE_KEYS.FEATURES) || 'null');
    const teams = JSON.parse(localStorage.getItem(STORAGE_KEYS.TEAMS) || 'null');
    const overheadFactor = parseFloat(localStorage.getItem(STORAGE_KEYS.OVERHEAD) || 'null');
    const startDate = new Date(localStorage.getItem(STORAGE_KEYS.START_DATE) || 'null');

    const state = {
      features: features || DEFAULT_STATE.features,
      teams: teams || DEFAULT_STATE.teams,
      overheadFactor: overheadFactor || DEFAULT_STATE.overheadFactor,
      startDate: startDate || DEFAULT_STATE.startDate,
    };

    logger.info('State loaded from localStorage', {
      featuresCount: state.features.length,
      teamsCount: Object.keys(state.teams).length,
      overheadFactor: state.overheadFactor,
      startDate: state.startDate,
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
    localStorage.setItem(STORAGE_KEYS.FEATURES, JSON.stringify(state.features));
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(state.teams));
    localStorage.setItem(STORAGE_KEYS.OVERHEAD, state.overheadFactor.toString());
    localStorage.setItem(STORAGE_KEYS.START_DATE, state.startDate.toISOString());

    logger.info('State saved to localStorage successfully', {
      featuresCount: state.features.length,
      teamsCount: Object.keys(state.teams).length,
      overheadFactor: state.overheadFactor,
      startDate: state.startDate,
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
      startDate: mergedState.startDate,
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

export const importStateFromJSON = async (
  file: File,
  setPlannerState: (state: PlannerState) => void
): Promise<void> => {
  logger.info('Importing state from JSON file');

  try {
    const fileContent = await file.text();
    const importedState = JSON.parse(fileContent);

    // Convert date string back to Date object if needed
    if (typeof importedState.startDate === 'string') {
      importedState.startDate = new Date(importedState.startDate);
    }

    // Validate the imported state structure
    if (!importedState.features || !importedState.teams || !importedState.overheadFactor) {
      throw new Error('Invalid state structure in imported file');
    }

    // Update all state at once using direct setters
    setPlannerState(importedState);

    logger.info('State imported successfully');
  } catch (error) {
    logger.error('Failed to import state from JSON file', error as Error);
    throw new Error(
      "Failed to import JSON file. Please make sure it's a valid capacity planner export."
    );
  }
};

export const exportStateToJSON = (state: PlannerState): void => {
  logger.info('Exporting state to JSON file');

  try {
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `capacity-planner-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    logger.info('State exported successfully');
  } catch (error) {
    logger.error('Failed to export state to JSON file', error as Error);
    throw new Error('Failed to export state to JSON file');
  }
};
