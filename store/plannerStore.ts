import { create } from 'zustand';
import { temporal } from 'zundo';
import { EMPTY_STATE, Feature, Teams } from '@/types/capacity-planner';
import { logger } from '@/services/loggerService';
import { PlanState } from '@/types/capacity-planner';
import { getPlanById, updatePlan } from '@/services/supabasePlanService';
import { useAuthStore } from '@/store/authStore';

interface PlannerStore {
  planState: PlanState;
  planName: string;
  isLoading: boolean;
  setFeatures: (features: Feature[]) => void;
  setTeams: (teams: Teams) => void;
  setOverheadFactor: (factor: number) => void;
  setStartDate: (date: Date) => void;
  setState: (state: PlanState) => void;
  loadPlanById: (id: string) => Promise<boolean>;
}

export const usePlannerStore = create<PlannerStore>()(
  temporal(set => ({
    planState: { ...EMPTY_STATE },
    planName: '',
    isLoading: false,

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

    setState: (state: PlanState) => {
      logger.debug('Setting state', { state });
      set({ planState: state });
    },

    loadPlanById: async (id: string): Promise<boolean> => {
      logger.debug('Loading plan by ID', { id });
      set({ isLoading: true });
      try {
        const plan = await getPlanById(id);
        if (!plan) {
          return false;
        }
        set({
          planState: plan?.state,
          planName: plan?.name,
          isLoading: false,
        });
        return true;
      } catch (error) {
        set({ isLoading: false });
        return false;
      }
    },
  }))
);

// Helper function to sync state to Supabase
const syncStateToSupabase = async (state?: PlanState, planName?: string) => {
  const searchParams = new URLSearchParams(location.search);
  const id = searchParams.get('id');
  const user = useAuthStore.getState().user;

  if (id && user) {
    await updatePlan(id, { state, name: planName });
  }
};
