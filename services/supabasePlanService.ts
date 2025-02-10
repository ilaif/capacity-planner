import { supabase } from '@/lib/supabase';
import { logger } from './loggerService';
import { PlanState } from '@/types/capacity-planner';
import { User } from '@supabase/supabase-js';

const PLANS_TABLE = 'plans';
const PLAN_SHARES_TABLE = 'plan_shares';

export type Plan = {
  id: string;
  name: string;
  state: PlanState;
  created_at: string;
  updated_at: string;
  last_updated_by: string;
  owner_id: string;
};

export type PlanShare = {
  shared_with_email: string;
  plan_id: string;
  created_at: string;
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
      state: migratePlanState(plan.state),
    } as Plan;
  } catch (error) {
    logger.error('Error fetching plan', error as Error);
    throw new Error('Failed to fetch plan');
  }
};

export const upsertPlan = async (
  id: string,
  fields: { state?: PlanState; name?: string },
  existingPlan: boolean,
  user: User
): Promise<void> => {
  if (!user) {
    logger.warn('No user found, skipping state update');
    return;
  }

  const fieldsToUpdate: {
    id: string;
    updated_at: string;
    owner_id?: string;
    name?: string;
    state?: {
      startDate: string;
    };
    last_updated_by: string;
  } = {
    id,
    updated_at: new Date().toISOString(),
    last_updated_by: user.id,
  };
  if (!existingPlan) {
    fieldsToUpdate.owner_id = user.id;
  }
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

export const updatePlan = async (
  id: string,
  fields: { state?: PlanState; name?: string },
  user: User
): Promise<void> => {
  if (!user) {
    logger.warn('No user found, skipping plan update');
    return;
  }

  const fieldsToUpdate: {
    updated_at: string;
    name?: string;
    state?: {
      startDate: string;
    };
    last_updated_by: string;
  } = {
    updated_at: new Date().toISOString(),
    last_updated_by: user.id,
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
    const { error } = await supabase.from(PLANS_TABLE).update(fieldsToUpdate).eq('id', id);

    if (error) {
      logger.error('Error updating plan', error);
      throw new Error('Failed to update plan');
    }

    logger.info('Plan updated successfully', { id });
  } catch (error) {
    logger.error('Error updating plan', error as Error);
    throw new Error('Failed to update plan');
  }
};

export const listPlans = async (user: User): Promise<Plan[]> => {
  try {
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
      state: migratePlanState(plan.state),
    }));
  } catch (error) {
    logger.error('Failed to load saved configurations', error as Error);
    return [];
  }
};

export const deletePlan = async (id: string, user: User): Promise<void> => {
  try {
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

          callback(migratePlanState(plan.state));
        }
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

export const sharePlan = async (
  planId: string,
  sharedWithEmail: string,
  user: User
): Promise<void> => {
  try {
    if (!user) {
      logger.warn('No user found, skipping plan share');
      return;
    }

    const { error } = await supabase.from(PLAN_SHARES_TABLE).upsert(
      {
        plan_id: planId,
        shared_with_email: sharedWithEmail,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'plan_id,shared_with_email' }
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

export const getPlanShares = async (planId: string): Promise<PlanShare[]> => {
  try {
    const { data, error } = await supabase
      .from(PLAN_SHARES_TABLE)
      .select('*')
      .eq('plan_id', planId);

    if (error) {
      logger.error('Failed to load plan shares', error);
      return [];
    }

    return data;
  } catch (error) {
    logger.error('Failed to load plan shares', error as Error);
    return [];
  }
};

export const removePlanShare = async (planId: string, sharedWithEmail: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(PLAN_SHARES_TABLE)
      .delete()
      .eq('plan_id', planId)
      .eq('shared_with_email', sharedWithEmail);

    if (error) {
      logger.error('Failed to remove plan share', error);
      throw new Error('Failed to remove plan share');
    }

    logger.info('Plan share removed successfully', { planId, sharedWithEmail });
  } catch (error) {
    logger.error('Failed to remove plan share', error as Error);
    throw new Error('Failed to remove plan share');
  }
};

function migratePlanState(planState: PlanState) {
  // set the date
  planState.startDate = new Date(planState.startDate);

  // fill projects if are missing
  if (!planState.projects) {
    planState.projects = [];
  }

  return planState;
}
