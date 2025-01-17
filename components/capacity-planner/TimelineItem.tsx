import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { TimelineItem as TimelineItemType } from '@/types/capacity-planner';
import { format, addWeeks } from 'date-fns';
import { TeamAvatar } from '@/components/ui/team-avatar';
import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';

interface TimelineItemWithRow extends TimelineItemType {
  row: number;
}

interface TimelineItemProps {
  allocation: TimelineItemWithRow;
  index: number;
  overheadFactor: number;
  getColumnPosition: (week: number) => number;
  getColumnWidth: (startWeek: number, endWeek: number) => number;
  startDate: Date;
  onFeatureClick?: (featureName: string) => void;
}

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
        gridColumn: `${allocation.startWeek + 1} / span ${(allocation.endWeek || 0) - allocation.startWeek}`,
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
                    <TeamAvatar teamName={team} size={14} />
                    <span className="text-[11px] font-medium text-slate-800">
                      {Math.ceil(requirement.weeks * overheadFactor)}w
                    </span>
                    {requirement.parallel > 1 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="text-[11px] text-slate-600 ml-0.5 flex items-center">
                              <Users className="h-3.5 w-3.5 mr-1" />
                              {requirement.parallel}x
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{requirement.parallel} team members working in parallel</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
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
                    {requirement.parallel > 1 && (
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
                    )}
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
        className="col-span-13 border-l border-gray-200 first:border-l-0"
        style={{
          gridColumn: `${i * 13 + 1} / span 13`,
        }}
      >
        <div className="text-xs text-gray-500 mt-1 text-center font-medium truncate px-1">
          {getQuarterLabel(i * 13)}
        </div>
      </div>
    ));
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div
        className="h-6 grid border-b border-gray-200"
        style={{
          gridTemplateColumns: `repeat(${gridCount}, ${columnWidth}px)`,
        }}
      >
        {renderQuarterMarkers()}
      </div>
      <div
        className="h-6 grid"
        style={{
          gridTemplateColumns: `repeat(${gridCount}, ${columnWidth}px)`,
        }}
      >
        {[...Array(gridCount)].map((_, i) => (
          <div key={i} className="border-l border-gray-200 relative">
            <div className="text-xs text-gray-500 mt-1 text-center truncate px-1">
              {getTimelineLabel(i)}
              {
                <div
                  className="absolute top-0 right-0 w-2 h-full cursor-ew-resize hover:bg-gray-200 transition-colors"
                  onMouseDown={onResizeStart}
                />
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
