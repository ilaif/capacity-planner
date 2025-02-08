import { create } from 'zustand';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import {
  CursorPosition,
  createCursorChannel,
  updateCursorPosition,
  subscribeToCursorPresence,
} from '@/services/cursorService';
import { logger } from '@/services/loggerService';
import { User } from '@supabase/supabase-js';

type CursorState = {
  cursors: Map<string, CursorPosition>;
  channel: ReturnType<typeof supabase.channel> | null;
  updatePosition: (x: number, y: number) => void;
  initializePresence: (planId: string, user: User) => void;
  cleanup: () => void;
};

export const useCursorStore = create<CursorState>((set, get) => ({
  cursors: new Map(),
  channel: null,

  updatePosition: (x: number, y: number) => {
    const user = useAuthStore.getState().user;
    const channel = get().channel;
    if (!channel || !user) return;

    updateCursorPosition(channel, x, y, user);
  },

  initializePresence: (planId: string, user: User) => {
    // Clean up existing subscription if any
    get().cleanup();

    logger.info('Initializing cursor presence', { planId });
    const channel = createCursorChannel(planId, user);

    subscribeToCursorPresence(
      channel,
      state => {
        const newCursors = new Map<string, CursorPosition>();
        Object.entries(state).forEach(([_, presences]) => {
          const presence = presences[0];
          if (presence) {
            const cursorPosition: CursorPosition = {
              x: presence.x,
              y: presence.y,
              userId: presence.userId,
              userEmail: presence.userEmail,
            };
            newCursors.set(cursorPosition.userId, cursorPosition);
          }
        });
        set({ cursors: newCursors });
      },
      presence => {
        const cursors = get().cursors;
        const cursorPosition: CursorPosition = {
          x: presence.x,
          y: presence.y,
          userId: presence.userId,
          userEmail: presence.userEmail,
        };
        const newCursors = new Map(cursors);
        newCursors.set(cursorPosition.userId, cursorPosition);
        set({ cursors: newCursors });
      },
      presence => {
        const cursors = get().cursors;
        cursors.delete(presence.userId);
        set({ cursors: new Map(cursors) });
      }
    );

    channel.subscribe(async status => {
      logger.info('Cursor channel status', { status });
      if (status === 'SUBSCRIBED') {
        const user = useAuthStore.getState().user;
        if (user) {
          updateCursorPosition(channel, 0, 0, user);
        }
      }
    });

    set({ channel });
  },

  cleanup: () => {
    const { channel } = get();
    if (channel) {
      logger.info('Cleaning up cursor presence');
      channel.unsubscribe();
      set({ channel: null, cursors: new Map() });
    }
  },
}));
