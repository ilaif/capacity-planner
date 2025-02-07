import { createAvatar } from '@dicebear/core';
import { shapes } from '@dicebear/collection';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type TeamAvatarProps = {
  teamName: string;
  size?: number;
  className?: string;
  showTooltip?: boolean;
};

export function TeamAvatar({
  teamName,
  size = 32,
  className,
  showTooltip = true,
}: TeamAvatarProps) {
  const avatar = useMemo(() => {
    return createAvatar(shapes, {
      seed: teamName,
      size: size,
      backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
    }).toDataUri();
  }, [teamName, size]);

  const AvatarImage = () => (
    <img
      src={avatar}
      alt={`${teamName} avatar`}
      className="rounded-full"
      width={size}
      height={size}
    />
  );

  return (
    <TooltipProvider>
      {showTooltip ? (
        <Tooltip>
          <TooltipTrigger className={cn('relative', className)}>
            <AvatarImage />
          </TooltipTrigger>
          <TooltipContent>{teamName}</TooltipContent>
        </Tooltip>
      ) : (
        <AvatarImage />
      )}
    </TooltipProvider>
  );
}
