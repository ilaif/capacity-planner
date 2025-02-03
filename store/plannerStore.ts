import { create } from 'zustand';
import { temporal } from 'zundo';
import { Feature, Teams } from '@/types/capacity-planner';
import { logger } from '@/services/loggerService';
import { DEFAULT_STATE, PlanState } from '@/types/capacity-planner';
import { upsertPlan, getPlanById } from '@/services/supabasePlanService';
import { useAuthStore } from '@/store/authStore';

interface PlannerStore {
  planState: PlanState;
  planName: string;
  setFeatures: (features: Feature[]) => void;
  setTeams: (teams: Teams) => void;
  setOverheadFactor: (factor: number) => void;
  setStartDate: (date: Date) => void;
  setState: (state: Partial<PlanState>) => void;
  reset: () => void;
  loadPlanById: (id: string) => Promise<boolean>;
}

export const usePlannerStore = create<PlannerStore>()(
  temporal(set => ({
    planState: { ...DEFAULT_STATE },
    planName: '',

    setFeatures: features => {
      logger.debug('Setting features', { count: features.length });
      set(state => {
        const newPlanState = { ...state.planState, features };
        syncStateToSupabase(newPlanState, state.planName);
        return { ...state, planState: newPlanState };
      });
    },

    setTeams: teams => {
      logger.debug('Setting teams', { count: Object.keys(teams).length });
      set(state => {
        const newPlanState = { ...state.planState, teams };
        syncStateToSupabase(newPlanState, state.planName);
        return { ...state, planState: newPlanState };
      });
    },

    setOverheadFactor: overheadFactor => {
      logger.debug('Setting overhead factor', { overheadFactor });
      set(state => {
        const newPlanState = { ...state.planState, overheadFactor };
        syncStateToSupabase(newPlanState, state.planName);
        return { ...state, planState: newPlanState };
      });
    },

    setStartDate: startDate => {
      logger.debug('Setting start date', { startDate });
      set(state => {
        const newPlanState = { ...state.planState, startDate };
        syncStateToSupabase(newPlanState, state.planName);
        return { ...state, planState: newPlanState };
      });
    },

    setPlanName: (planName: string) => {
      logger.debug('Setting plan name', { planName });
      set(state => {
        syncStateToSupabase(state.planState, planName);
        return { ...state, planName };
      });
    },

    setState: newState => {
      logger.debug('Setting partial state', newState);
      set(state => {
        const updatedPlanState = { ...state.planState, ...newState };
        syncStateToSupabase(updatedPlanState, state.planName);
        return { ...state, planState: updatedPlanState };
      });
    },

    reset: () => {
      logger.debug('Resetting state to default');
      set(state => {
        const newPlanState = DEFAULT_STATE;
        syncStateToSupabase(newPlanState, state.planName);
        return { ...state, planState: newPlanState };
      });
    },

    loadPlanById: async (id: string): Promise<boolean> => {
      logger.debug('Loading plan by ID', { id });
      const plan = await getPlanById(id);
      if (!plan) {
        return false;
      }
      set({
        planState: plan?.state,
        planName: plan?.name,
      });
      return true;
    },
  }))
);

// Helper function to sync state to Supabase
const syncStateToSupabase = async (state?: PlanState, planName?: string) => {
  const searchParams = new URLSearchParams(location.search);
  const id = searchParams.get('id');
  const user = useAuthStore.getState().user;

  if (id && user) {
    await upsertPlan(id, {
      state,
      name: planName,
    });
  }
};
