import { create } from 'zustand';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import {
  ActiveUser,
  createActiveUsersChannel,
  updateActiveUser,
  subscribeToActiveUserPresence,
} from '@/services/activeUsersService';
import { logger } from '@/services/loggerService';
import { User } from '@supabase/supabase-js';

type ActiveUserState = {
  activeUsers: Map<string, ActiveUser>;
  channel: ReturnType<typeof supabase.channel> | null;
  initializePresence: (planId: string, user: User) => void;
  cleanup: () => void;
};

export const useActiveUsersStore = create<ActiveUserState>((set, get) => ({
  activeUsers: new Map(),
  channel: null,

  initializePresence: (planId: string, user: User) => {
    // Clean up existing subscription if any
    get().cleanup();

    logger.info('Initializing active users presence', { planId });
    const channel = createActiveUsersChannel(planId, user);

    subscribeToActiveUserPresence(
      channel,
      state => {
        const newActiveUsers = new Map<string, ActiveUser>();
        Object.entries(state).forEach(([_, presences]) => {
          const presence = presences[0];
          if (presence) {
            const activeUser: ActiveUser = {
              userId: presence.userId,
              userEmail: presence.userEmail,
            };
            newActiveUsers.set(activeUser.userId, activeUser);
          }
        });
        set({ activeUsers: newActiveUsers });
      },
      presence => {
        const activeUsers = get().activeUsers;
        const activeUser: ActiveUser = {
          userId: presence.userId,
          userEmail: presence.userEmail,
        };
        const newActiveUsers = new Map(activeUsers);
        newActiveUsers.set(activeUser.userId, activeUser);
        set({ activeUsers: newActiveUsers });
      },
      presence => {
        const activeUsers = get().activeUsers;
        activeUsers.delete(presence.userId);
        set({ activeUsers: new Map(activeUsers) });
      }
    );

    channel.subscribe(async status => {
      logger.info('Active users channel status', { status });
      if (status === 'SUBSCRIBED') {
        const user = useAuthStore.getState().user;
        if (user) {
          updateActiveUser(channel, user);
        }
      }
    });

    set({ channel });
  },

  cleanup: () => {
    const { channel } = get();
    if (channel) {
      logger.info('Cleaning up active users presence');
      channel.unsubscribe();
      set({ channel: null, activeUsers: new Map() });
    }
  },
}));
