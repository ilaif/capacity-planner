import { supabase } from '@/lib/supabase';
import { logger } from '@/services/loggerService';
import { User } from '@supabase/supabase-js';
import { RealtimePresenceState } from '@supabase/supabase-js';

export type ActiveUser = {
  userId: string;
  userEmail: string;
};

export type ActiveUserPresenceState = RealtimePresenceState<ActiveUser>;

export const createActiveUsersChannel = (planId: string, user: User) => {
  return supabase.channel(`active_users_${planId}`, {
    config: {
      presence: {
        key: user.id,
      },
    },
  });
};

export const updateActiveUser = (
  channel: ReturnType<typeof supabase.channel>,
  user: User
): void => {
  if (!channel || !user) {
    logger.warn('No channel or user found, skipping active user update');
    return;
  }

  channel.track({
    userId: user.id,
    userEmail: user.email,
  });
};

export const subscribeToActiveUserPresence = (
  channel: ReturnType<typeof supabase.channel>,
  onSync: (state: ActiveUserPresenceState) => void,
  onJoin: (presence: ActiveUser) => void,
  onLeave: (presence: ActiveUser) => void
): void => {
  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<ActiveUser>();
      onSync(state);
    })
    .on('presence', { event: 'join' }, ({ newPresences }) => {
      newPresences.forEach(presence => {
        onJoin(presence as unknown as ActiveUser);
      });
    })
    .on('presence', { event: 'leave' }, ({ leftPresences }) => {
      leftPresences.forEach(presence => {
        onLeave(presence as unknown as ActiveUser);
      });
    });
};
