import { create } from 'zustand';
import { temporal } from 'zundo';
import { EMPTY_STATE, Feature, Teams, Project } from '@/types/capacity-planner';
import { logger } from '@/services/loggerService';
import { PlanState } from '@/types/capacity-planner';
import { getPlanById, updatePlan } from '@/services/supabasePlanService';
import { useAuthStore } from '@/store/authStore';

type PlannerStore = {
  planState: PlanState;
  planName: string;
  isLoading: boolean;
  setFeatures: (features: Feature[]) => void;
  setTeams: (teams: Teams) => void;
  setOverheadFactor: (factor: number) => void;
  setStartDate: (date: Date) => void;
  setState: (state: PlanState) => void;
  loadPlanById: (id: string, { showLoading }: { showLoading: boolean }) => Promise<boolean>;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (project: Project) => void;
  removeProject: (projectId: number) => void;
  setFeatureProject: (featureId: number, projectId: number | null) => void;
};

export const usePlannerStore = create<PlannerStore>()(
  temporal((set, get) => ({
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

    setState: (newState: PlanState) => {
      logger.debug('Setting state', { newState });
      set(state => {
        syncStateToSupabase(newState, state.planName);
        return { ...state, planState: newState };
      });
    },

    loadPlanById: async (
      id: string,
      { showLoading }: { showLoading: boolean }
    ): Promise<boolean> => {
      logger.debug('Loading plan by ID', { id });
      if (showLoading) {
        set({ isLoading: true });
      }
      try {
        const plan = await getPlanById(id);
        if (!plan) {
          return false;
        }

        const { planState } = get();
        if (JSON.stringify(plan.state) === JSON.stringify(planState)) {
          logger.debug('Plan state is the same as the current state, skipping', {
            newState: plan.state,
            currentState: planState,
          });
          return true;
        }

        set({
          planState: plan?.state,
          planName: plan?.name,
        });
        return true;
      } catch (error) {
        return false;
      } finally {
        if (showLoading) {
          set({ isLoading: false });
        }
      }
    },

    setProjects: projects => {
      logger.debug('Setting projects', { count: projects.length });
      set(state => {
        const newPlanState = { ...state.planState, projects };
        syncStateToSupabase(newPlanState, state.planName);
        return { ...state, planState: newPlanState };
      });
    },

    addProject: project => {
      logger.debug('Adding project', { project });
      set(state => {
        const newProjects = [
          ...state.planState.projects,
          {
            ...project,
            id: Math.max(0, ...state.planState.projects.map(p => p.id)) + 1,
          },
        ];
        const newPlanState = { ...state.planState, projects: newProjects };
        syncStateToSupabase(newPlanState, state.planName);
        return { ...state, planState: newPlanState };
      });
    },

    updateProject: project => {
      logger.debug('Updating project', { project });
      set(state => {
        const newProjects = state.planState.projects.map(p => (p.id === project.id ? project : p));
        const newPlanState = { ...state.planState, projects: newProjects };
        syncStateToSupabase(newPlanState, state.planName);
        return { ...state, planState: newPlanState };
      });
    },

    removeProject: projectId => {
      logger.debug('Removing project', { projectId });
      set(state => {
        const newProjects = state.planState.projects.filter(p => p.id !== projectId);
        // Also remove project from features
        const newFeatures = state.planState.features.map(f =>
          f.projectId === projectId ? { ...f, projectId: null } : f
        );
        const newPlanState = {
          ...state.planState,
          projects: newProjects,
          features: newFeatures,
        };
        syncStateToSupabase(newPlanState, state.planName);
        return { ...state, planState: newPlanState };
      });
    },

    setFeatureProject: (featureId, projectId) => {
      logger.debug('Setting feature project', { featureId, projectId });
      set(state => {
        const newFeatures = state.planState.features.map(f =>
          f.id === featureId ? { ...f, projectId } : f
        );
        const newPlanState = { ...state.planState, features: newFeatures };
        syncStateToSupabase(newPlanState, state.planName);
        return { ...state, planState: newPlanState };
      });
    },
  }))
);

// Helper function to sync state to Supabase
const syncStateToSupabase = async (state?: PlanState, planName?: string) => {
  const searchParams = new URLSearchParams(location.search);
  const id = searchParams.get('id');
  const user = useAuthStore.getState().user;

  if (id && user) {
    await updatePlan(id, { state, name: planName }, user);
  } else {
    logger.debug('No plan id or user found, skipping sync');
  }
};
