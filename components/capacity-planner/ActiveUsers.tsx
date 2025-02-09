import { useEffect } from 'react';
import { useActiveUsersStore } from '@/store/activeUsersStore';
import { useAuthStore } from '@/store/authStore';
import { Users } from 'lucide-react';
import { createAvatar } from '@dicebear/core';
import { shapes } from '@dicebear/collection';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ACTIVE_USER_COLORS = [
  { bg: '#0EA5E9', text: 'white' }, // sky-500
  { bg: '#8B5CF6', text: 'white' }, // violet-500
  { bg: '#EC4899', text: 'white' }, // pink-500
  { bg: '#F97316', text: 'white' }, // orange-500
  { bg: '#22C55E', text: 'white' }, // green-500
  { bg: '#EAB308', text: 'black' }, // yellow-500
];

const getUserColor = (userId: string) => {
  const colorIndex = parseInt(userId.slice(-1), 16) % ACTIVE_USER_COLORS.length;
  return ACTIVE_USER_COLORS[colorIndex];
};

type UserAvatarProps = {
  email: string;
  size?: number;
  color: string;
};

const UserAvatar = ({ email, size = 32, color }: UserAvatarProps) => {
  const avatar = createAvatar(shapes, {
    seed: email,
    size: size,
    backgroundColor: [color.slice(1)],
  }).toDataUri();

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

type ActiveUsersProps = {
  planId: string;
};

export const ActiveUsers = ({ planId }: ActiveUsersProps) => {
  const { activeUsers, initializePresence, cleanup } = useActiveUsersStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (planId && user) {
      initializePresence(planId, user);
      return () => {
        cleanup();
      };
    }
  }, [planId, user, initializePresence, cleanup]);

  if (!user) return null;

  const allUsers = Array.from(activeUsers.entries());
  const otherUsers = allUsers.filter(([userId]) => userId !== user.id);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Users className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Active users viewing this plan</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="flex -space-x-2">
          {otherUsers.map(([userId, userData]) => {
            const color = getUserColor(userId);
            return (
              <div key={userId} className="flex items-center">
                <UserAvatar email={userData.userEmail} color={color.bg} size={24} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
