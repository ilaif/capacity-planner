import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { TimelineItem as TimelineItemType } from '@/types/capacity-planner';
import { format, addWeeks } from 'date-fns';
import { TeamAvatar } from '@/components/ui/team-avatar';
import { cn } from '@/lib/utils';

interface TimelineItemProps {
  allocation: TimelineItemType;
  index: number;
  overheadFactor: number;
  getColumnPosition: (week: number) => number;
  getColumnWidth: (startWeek: number, endWeek: number) => number;
  startDate: Date;
}

export function TimelineItem({
  allocation,
  index,
  overheadFactor,
  getColumnPosition,
  getColumnWidth,
  startDate,
}: TimelineItemProps) {
  const getDateLabel = (weekOffset: number) => {
    return format(addWeeks(startDate, weekOffset), 'MMM d, yyyy');
  };

  return (
    <div
      className={cn(
        'group mb-4 absolute',
        'bg-gradient-to-r from-slate-100/95 to-purple-100/95',
        'backdrop-blur-[2px] shadow-sm',
        'border border-slate-300/50',
        'rounded-md transition-all duration-200',
        'hover:from-slate-200/95 hover:to-purple-200/95',
        'hover:shadow-md hover:-translate-y-[1px]'
      )}
      style={{
        left: `${getColumnPosition(allocation.startWeek)}px`,
        width: `${getColumnWidth(allocation.startWeek, allocation.endWeek || 0)}px`,
        top: `${index * 72 + 8}px`,
        minWidth: '30px',
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
                      'flex items-center gap-1.5 px-1.5 py-0.5 rounded-full',
                      'bg-white/70 border border-slate-300/50',
                      'transition-colors duration-200',
                      'group-hover:bg-white/90'
                    )}
                  >
                    <TeamAvatar teamName={team} size={14} />
                    <span className="text-[11px] font-medium text-slate-800">
                      {Math.ceil(requirement.weeks * overheadFactor)}w
                      {requirement.parallel > 1 && (
                        <span className="text-slate-600 ml-0.5">({requirement.parallel}x)</span>
                      )}
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
                      {requirement.parallel > 1 && (
                        <span className="text-slate-600"> ({requirement.parallel} parallel)</span>
                      )}
                    </span>
                  </div>
                ))}
            </div>
            <div className="mt-3 pt-2 text-xs text-slate-700 border-t border-slate-300">
              {getDateLabel(allocation.startWeek)} - {getDateLabel(allocation.endWeek || 0)}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

interface TimelineGridProps {
  gridCount: number;
  columnWidth: number;
  onResizeStart: () => void;
  getTimelineLabel: (index: number) => string;
  getQuarterLabel: (weekIndex: number) => string;
}

export function TimelineGrid({
  gridCount,
  columnWidth,
  onResizeStart,
  getTimelineLabel,
  getQuarterLabel,
}: TimelineGridProps) {
  const renderQuarterMarkers = () => {
    const quarters = Math.ceil(gridCount / 13);
    return [...Array(quarters)].map((_, i) => (
      <div
        key={`q-${i}`}
        className="absolute top-0 bottom-0"
        style={{
          left: `${i * columnWidth * 13}px`,
          width: `${columnWidth * 13}px`,
          borderLeft: i > 0 ? '2px solid #e5e7eb' : 'none',
        }}
      >
        <div className="text-xs text-gray-500 mt-1 text-center font-medium truncate px-1">
          {getQuarterLabel(i * 13)}
        </div>
      </div>
    ));
  };

  return (
    <div className="top-0 left-0 right-0 bg-white">
      <div className="h-6 relative border-b border-gray-200">{renderQuarterMarkers()}</div>
      <div className="h-6 relative">
        {[...Array(gridCount)].map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0"
            style={{
              left: `${i * columnWidth}px`,
              width: `${columnWidth}px`,
              borderLeft: '1px solid #e5e7eb',
            }}
          >
            <div className="text-xs text-gray-500 mt-1 text-center truncate px-1">
              {getTimelineLabel(i)}
              {i === 0 && (
                <div
                  className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-gray-200"
                  onMouseDown={onResizeStart}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
