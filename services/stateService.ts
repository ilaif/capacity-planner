import { Feature, Teams } from '@/types/capacity-planner';
import { logger } from '@/services/loggerService';
import { startOfWeek } from 'date-fns';

export interface PlannerState {
  features: Feature[];
  teams: Teams;
  overheadFactor: number;
  startDate: Date;
  configurationName?: string;
}

export const DEFAULT_STATE: PlannerState = {
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

export const decodeState = (encoded: string): PlannerState | null => {
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
