import { createAvatar } from '@dicebear/core';
import { shapes } from '@dicebear/collection';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TeamAvatarProps {
  teamName: string;
  size?: number;
  className?: string;
}

export function TeamAvatar({ teamName, size = 32, className }: TeamAvatarProps) {
  const avatar = useMemo(() => {
    return createAvatar(shapes, {
      seed: teamName,
      size: size,
      backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
    }).toDataUri();
  }, [teamName, size]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className={cn('relative', className)}>
          <img
            src={avatar}
            alt={`${teamName} avatar`}
            className="rounded-full"
            width={size}
            height={size}
          />
        </TooltipTrigger>
        <TooltipContent>{teamName}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
