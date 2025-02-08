import { supabase } from '@/lib/supabase';
import { logger } from '@/services/loggerService';
import { User } from '@supabase/supabase-js';
import { RealtimePresenceState } from '@supabase/supabase-js';

export type CursorPosition = {
  x: number;
  y: number;
  userId: string;
  userEmail: string;
};

export type CursorPresenceState = RealtimePresenceState<CursorPosition>;

export const createCursorChannel = (planId: string, user: User) => {
  return supabase.channel(`cursor_${planId}`, {
    config: {
      presence: {
        key: user.id,
      },
    },
  });
};

export const updateCursorPosition = (
  channel: ReturnType<typeof supabase.channel>,
  x: number,
  y: number,
  user: User
): void => {
  if (!channel || !user) {
    logger.warn('No channel or user found, skipping cursor position update');
    return;
  }

  channel.track({
    x,
    y,
    userId: user.id,
    userEmail: user.email,
  });
};

export const subscribeToCursorPresence = (
  channel: ReturnType<typeof supabase.channel>,
  onSync: (state: CursorPresenceState) => void,
  onJoin: (presence: CursorPosition) => void,
  onLeave: (presence: CursorPosition) => void
): void => {
  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<CursorPosition>();
      onSync(state);
    })
    .on('presence', { event: 'join' }, ({ newPresences }) => {
      newPresences.forEach(presence => {
        onJoin(presence as unknown as CursorPosition);
      });
    })
    .on('presence', { event: 'leave' }, ({ leftPresences }) => {
      leftPresences.forEach(presence => {
        onLeave(presence as unknown as CursorPosition);
      });
    });
};
