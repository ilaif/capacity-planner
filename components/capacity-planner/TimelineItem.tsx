import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { TimelineItem as TimelineItemType } from '@/types/capacity-planner';
import { format, addWeeks } from 'date-fns';
import { TeamAvatar } from '@/components/ui/team-avatar';
import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';

type TimelineItemWithRow = TimelineItemType & {
  row: number;
};

type TimelineItemProps = {
  allocation: TimelineItemWithRow;
  index: number;
  overheadFactor: number;
  getColumnPosition: (week: number) => number;
  getColumnWidth: (startWeek: number, endWeek: number) => number;
  startDate: Date;
  onFeatureClick?: (featureName: string) => void;
};

export function TimelineItem({
  allocation,
  overheadFactor,
  startDate,
  onFeatureClick,
}: TimelineItemProps) {
  const getDateLabel = (weekOffset: number) => {
    return format(addWeeks(startDate, weekOffset), 'MMM d, yyyy');
  };

  const handleClick = () => {
    onFeatureClick?.(allocation.feature);
  };

  return (
    <div
      className={cn(
        'group',
        'bg-gradient-to-r from-slate-100/95 to-purple-100/95',
        'backdrop-blur-[2px] shadow-sm',
        'border border-slate-300/50',
        'rounded-md transition-all duration-200',
        'hover:from-slate-200/95 hover:to-purple-200/95',
        'hover:shadow-md hover:-translate-y-[1px]',
        'cursor-pointer'
      )}
      onClick={handleClick}
      style={{
        gridColumn: `${allocation.startWeek + 1} / span ${allocation.endWeek - allocation.startWeek}`,
        gridRow: `${allocation.row + 1}`,
        minWidth: '30px',
        margin: '4px',
      }}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="w-full text-left p-2">
            <div className="text-sm font-medium truncate text-slate-900">{allocation.feature}</div>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {Object.entries(allocation.assignments)
                .filter(([_, requirement]) => requirement.weeks > 0)
                .map(([team, requirement]) => (
                  <div
                    key={team}
                    className={cn(
                      'flex items-center gap-0.5 px-1.5 py-0.5 rounded-full',
                      'bg-white/70 border border-slate-300/50',
                      'transition-colors duration-200',
                      'group-hover:bg-white/90'
                    )}
                  >
                    <TeamAvatar teamName={team} size={14} showTooltip={false} />
                    <span className="text-[11px] font-medium text-slate-800">
                      {Math.ceil(requirement.weeks * overheadFactor)}w
                    </span>
                    <span className="text-[11px] text-slate-600 ml-0.5 flex items-center">
                      <Users className="h-3.5 w-3.5 mr-1" />
                      {requirement.parallel}
                    </span>
                  </div>
                ))}
            </div>
          </TooltipTrigger>
          <TooltipContent
            className="bg-white/95 backdrop-blur-sm border-slate-300 shadow-lg"
            sideOffset={5}
          >
            <div className="font-medium text-slate-900">{allocation.feature}</div>
            <div className="space-y-1.5 mt-2">
              {Object.entries(allocation.assignments)
                .filter(([_, requirement]) => requirement.weeks > 0)
                .map(([team, requirement]) => (
                  <div key={team} className="flex items-center gap-2">
                    <TeamAvatar teamName={team} size={18} />
                    <span className="text-sm text-slate-800">
                      {team}:{' '}
                      <span className="font-medium">
                        {requirement.weeks}w ({Math.ceil(requirement.weeks * overheadFactor)}w with
                        overhead)
                      </span>
                    </span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="text-slate-600 flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {requirement.parallel}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{requirement.parallel} team members working in parallel</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))}
            </div>
            <div className="mt-3 pt-2 text-xs text-slate-700 border-t border-slate-300">
              Weeks {allocation.startWeek}-{allocation.endWeek} (
              {getDateLabel(allocation.startWeek)} - {getDateLabel(allocation.endWeek)})
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
