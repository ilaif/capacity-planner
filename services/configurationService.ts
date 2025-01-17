import { PlannerState } from './stateService';
import { logger } from './loggerService';

const STORAGE_KEY = 'capacity-planner-saved-configs';

export interface SavedConfiguration {
  name: string;
  state: PlannerState;
  createdAt: string;
  updatedAt: string;
}

export const getSavedConfigurations = (): SavedConfiguration[] => {
  try {
    const configs = localStorage.getItem(STORAGE_KEY);
    const parsedConfigs = configs ? JSON.parse(configs) : [];
    return parsedConfigs.map((config: SavedConfiguration) => ({
      ...config,
      state: {
        ...config.state,
        startDate: new Date(config.state.startDate),
      },
    }));
  } catch (error) {
    logger.error('Failed to load saved configurations', error as Error);
    return [];
  }
};

export const saveConfiguration = (name: string, state: PlannerState): SavedConfiguration => {
  try {
    const configs = getSavedConfigurations();
    const now = new Date().toISOString();

    const newConfig: SavedConfiguration = {
      name,
      state,
      createdAt: now,
      updatedAt: now,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify([...configs, newConfig]));
    logger.info('Configuration saved successfully', { name });
    return newConfig;
  } catch (error) {
    logger.error('Failed to save configuration', error as Error);
    throw new Error('Failed to save configuration');
  }
};

export const updateConfiguration = (name: string, state: PlannerState): void => {
  try {
    const configs = getSavedConfigurations();
    const configIndex = configs.findIndex(c => c.name === name);

    if (configIndex === -1) {
      throw new Error('Configuration not found');
    }

    configs[configIndex] = {
      ...configs[configIndex],
      state,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
    logger.info('Configuration updated successfully', { name });
  } catch (error) {
    logger.error('Failed to update configuration', error as Error);
    throw new Error('Failed to update configuration');
  }
};

export const deleteConfiguration = (name: string): void => {
  try {
    const configs = getSavedConfigurations();
    const newConfigs = configs.filter(c => c.name !== name);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfigs));
    logger.info('Configuration deleted successfully', { name });
  } catch (error) {
    logger.error('Failed to delete configuration', error as Error);
    throw new Error('Failed to delete configuration');
  }
};
