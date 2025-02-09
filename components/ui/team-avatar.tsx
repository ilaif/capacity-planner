import { createAvatar } from '@dicebear/core';
import { identicon } from '@dicebear/collection';
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
    return createAvatar(identicon, {
      seed: teamName,
      size: size,
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
