import { supabase } from '@/lib/supabase';
import { logger } from './loggerService';
import { PlanState } from '@/types/capacity-planner';
import { useAuthStore } from '@/store/authStore';

export const PLANS_TABLE = 'plans';
export const PLAN_SHARES_TABLE = 'plan_shares';

export type Plan = {
  id: string;
  name: string;
  state: PlanState;
  created_at: string;
  updated_at: string;
};

export const getPlanById = async (id: string): Promise<Plan | null> => {
  try {
    const { data: plan, error } = await supabase
      .from(PLANS_TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        logger.info('Plan not found, returning null', { id });
        return null;
      }

      throw new Error('Failed to fetch plan');
    }

    if (!plan?.state) {
      throw new Error('Failed to fetch plan');
    }

    return {
      ...plan,
      state: {
        ...plan.state,
        startDate: new Date(plan.state.startDate),
      },
    };
  } catch (error) {
    logger.error('Error fetching plan', error as Error);
    throw new Error('Failed to fetch plan');
  }
};

export const upsertPlan = async (
  id: string,
  fields: { state?: PlanState; name?: string }
): Promise<void> => {
  const user = useAuthStore.getState().user;
  if (!user) {
    logger.warn('No user found, skipping state update');
    return;
  }

  const fieldsToUpdate: {
    id: string;
    owner_id: string;
    updated_at: string;
    name?: string;
    state?: {
      startDate: string;
    };
  } = {
    id,
    owner_id: user.id,
    updated_at: new Date().toISOString(),
  };
  if (fields.name) {
    fieldsToUpdate.name = fields.name;
  }
  if (fields.state) {
    fieldsToUpdate.state = {
      ...fields.state,
      startDate: fields.state.startDate.toISOString(),
    };
  }

  try {
    const { error } = await supabase.from(PLANS_TABLE).upsert(fieldsToUpdate, { onConflict: 'id' });

    if (error) {
      logger.error('Error upserting state', error);
    }
  } catch (error) {
    logger.error('Error upserting state', error as Error);
  }
};

export const listPlans = async (): Promise<Plan[]> => {
  try {
    const user = useAuthStore.getState().user;
    if (!user) {
      logger.warn('No user found, returning empty configurations list');
      return [];
    }

    const { data, error } = await supabase
      .from(PLANS_TABLE)
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      logger.error('Failed to load saved configurations', error);
      return [];
    }

    return data.map((plan: Plan) => ({
      ...plan,
      state: {
        ...plan.state,
        startDate: new Date(plan.state.startDate),
      },
    }));
  } catch (error) {
    logger.error('Failed to load saved configurations', error as Error);
    return [];
  }
};

export const deletePlan = async (id: string): Promise<void> => {
  try {
    const user = useAuthStore.getState().user;
    if (!user) {
      logger.warn('No user found, skipping configuration deletion');
      return;
    }

    const { error } = await supabase.from(PLANS_TABLE).delete().eq('id', id);

    if (error) {
      logger.error('Failed to delete plan', error);
      throw new Error('Failed to delete plan');
    }

    logger.info('Plan deleted successfully', { id });
  } catch (error) {
    logger.error('Failed to delete plan', error as Error);
    throw new Error('Failed to delete plan');
  }
};

export const subscribeToPlanChanges = (
  planId: string,
  callback: (state: PlanState) => void
): (() => void) => {
  const subscription = supabase
    .channel(`${PLANS_TABLE}:${planId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: PLANS_TABLE,
        filter: `id=eq.${planId}`,
      },
      payload => {
        if (payload.new) {
          const plan = payload.new as Plan;
          callback({
            ...plan.state,
            startDate: new Date(plan.state.startDate),
          });
        }
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

export const sharePlan = async (planId: string, sharedWithEmail: string): Promise<void> => {
  try {
    const user = useAuthStore.getState().user;
    if (!user) {
      logger.warn('No user found, skipping plan share');
      return;
    }

    const { error } = await supabase.from(PLAN_SHARES_TABLE).upsert(
      {
        owner_id: user.id,
        shared_with_email: sharedWithEmail,
        plan_id: planId,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'owner_id,shared_with_email,plan_id' }
    );

    if (error) {
      logger.error('Failed to share plan', error);
      throw new Error('Failed to share plan');
    }

    logger.info('Plan shared successfully', { planId, sharedWithEmail });
  } catch (error) {
    logger.error('Failed to share plan', error as Error);
    throw new Error('Failed to share plan');
  }
};
