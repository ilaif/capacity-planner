import { useEffect, useRef, useMemo } from 'react';
import { useCursorStore } from '@/store/cursorStore';
import { useAuthStore } from '@/store/authStore';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { logger } from '@/services/loggerService';
import { Users } from 'lucide-react';
import { createAvatar } from '@dicebear/core';
import { shapes } from '@dicebear/collection';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const CURSOR_COLORS = [
  { bg: '#FF5733', text: 'white' },
  { bg: '#33FF57', text: 'black' },
  { bg: '#3357FF', text: 'white' },
  { bg: '#FF33F5', text: 'white' },
  { bg: '#33FFF5', text: 'black' },
  { bg: '#FFD700', text: 'black' },
];

const getUserColor = (userId: string) => {
  // Use the last character of the userId to determine the color
  const colorIndex = parseInt(userId.slice(-1), 16) % CURSOR_COLORS.length;
  return CURSOR_COLORS[colorIndex];
};

type UserAvatarProps = {
  email: string;
  size?: number;
  color: string;
};

const UserAvatar = ({ email, size = 32, color }: UserAvatarProps) => {
  const avatar = useMemo(() => {
    return createAvatar(shapes, {
      seed: email,
      size: size,
      backgroundColor: [color.slice(1)], // Remove # from hex color
    }).toDataUri();
  }, [email, size, color]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <img
            src={avatar}
            alt={`${email} avatar`}
            className="rounded-full ring-2 ring-background"
            width={size}
            height={size}
          />
        </TooltipTrigger>
        <TooltipContent>{email}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const CursorOverlay = () => {
  const { cursors, updatePosition, initializePresence, cleanup } = useCursorStore();
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const throttleRef = useRef<number | null>(null);

  useEffect(() => {
    const planId = searchParams.get('id');
    if (planId && user) {
      logger.info('Initializing cursor presence in component', { planId });
      initializePresence(planId);
      return () => {
        logger.info('Cleaning up cursor presence in component');
        cleanup();
      };
    }
  }, [searchParams, user, initializePresence, cleanup]);

  useEffect(() => {
    const planId = searchParams.get('id');
    if (!planId || !user) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (throttleRef.current) return;

      throttleRef.current = window.setTimeout(() => {
        throttleRef.current = null;
      }, 50); // Throttle to 50ms

      const x = e.clientX;
      const y = e.clientY;
      updatePosition(x, y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [searchParams, user, updatePosition]);

  if (!user) return null;

  const allUsers = Array.from(cursors.entries());

  return (
    <>
      {/* Presence List */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <div className="flex -space-x-2">
            {allUsers.map(([userId, userData]) => {
              const color = getUserColor(userId);
              return (
                <div key={userId} className="relative flex items-center">
                  <UserAvatar email={userData.userEmail} color={color.bg} size={24} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cursors */}
      {allUsers.map(([userId, cursor]) => {
        if (userId === user.id) return null;

        const color = getUserColor(userId);

        return (
          <div
            key={userId}
            className={cn(
              'pointer-events-none fixed z-[100] flex flex-col items-start',
              'transition-all duration-100 ease-linear'
            )}
            style={{
              transform: `translate(${cursor.x}px, ${cursor.y}px)`,
              willChange: 'transform',
            }}
          >
            <svg
              className="h-5 w-5 drop-shadow-sm"
              viewBox="0 0 20 20"
              fill={color.bg}
              stroke="white"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 2l2 14 3-3 3 4 2-1.5-3-4L15 9z" />
            </svg>
            <div
              className="ml-3 -mt-1 rounded-md px-2 py-1 shadow-sm backdrop-blur-sm"
              style={{
                backgroundColor: `${color.bg}CC`, // CC adds 80% opacity
                color: color.text,
              }}
            >
              <span className="text-xs font-medium">{cursor.userEmail}</span>
            </div>
          </div>
        );
      })}
    </>
  );
};
