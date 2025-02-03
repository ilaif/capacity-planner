import { logger } from '@/services/loggerService';
import { PlanState } from '@/types/capacity-planner';

export const importPlanStateFromJSON = async (file: File): Promise<PlanState> => {
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

    logger.info('State imported successfully');
    return importedState;
  } catch (error) {
    logger.error('Failed to import state from JSON file', error as Error);
    throw new Error(
      "Failed to import JSON file. Please make sure it's a valid capacity planner export."
    );
  }
};

export const exportPlanStateToJSON = (state: PlanState): void => {
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
