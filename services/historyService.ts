import { PlannerState } from './stateService';
import { logger } from './loggerService';

export class HistoryManager {
  private past: PlannerState[] = [];
  private future: PlannerState[] = [];
  private current: PlannerState;
  private maxHistorySize = 50;

  constructor(initialState: PlannerState) {
    this.current = initialState;
  }

  public pushState(newState: PlannerState): void {
    // Don't push if the state hasn't actually changed
    if (JSON.stringify(this.current) === JSON.stringify(newState)) {
      return;
    }

    this.past.push({ ...this.current });
    this.current = newState;
    this.future = []; // Clear redo stack when new action is performed

    // Limit history size
    if (this.past.length > this.maxHistorySize) {
      this.past.shift();
    }

    logger.debug('State pushed to history', {
      pastStatesCount: this.past.length,
      futureStatesCount: this.future.length,
    });
  }

  public undo(): PlannerState | null {
    if (this.past.length === 0) {
      logger.debug('No more states to undo');
      return null;
    }

    this.future.push({ ...this.current });
    const previousState = this.past.pop()!;
    this.current = previousState;

    logger.debug('State undone', {
      pastStatesCount: this.past.length,
      futureStatesCount: this.future.length,
    });

    return previousState;
  }

  public redo(): PlannerState | null {
    if (this.future.length === 0) {
      logger.debug('No more states to redo');
      return null;
    }

    this.past.push({ ...this.current });
    const nextState = this.future.pop()!;
    this.current = nextState;

    logger.debug('State redone', {
      pastStatesCount: this.past.length,
      futureStatesCount: this.future.length,
    });

    return nextState;
  }

  public canUndo(): boolean {
    return this.past.length > 0;
  }

  public canRedo(): boolean {
    return this.future.length > 0;
  }

  public getCurrentState(): PlannerState {
    return this.current;
  }
}
