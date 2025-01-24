import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { TimelineItem as TimelineItemType, Teams } from '@/types/capacity-planner';
import { format, addWeeks } from 'date-fns';
import { TeamAvatar } from '@/components/ui/team-avatar';
import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';

interface TimelineItemWithRow extends TimelineItemType {
  row: number;
}

interface WeekIndicatorProps {
  week: number;
  timeline: TimelineItemWithRow[];
  startDate: Date;
  overheadFactor: number;
  teams: Teams;
}

export function WeekIndicator({
  week,
  timeline,
  startDate,
  overheadFactor,
  teams,
}: WeekIndicatorProps) {
  const featuresInWeek = timeline.filter(item => item.startWeek <= week && item.endWeek > week);

  // Group engineers by team for this week
  const teamEngineers: { [team: string]: number } = {};
  const teamUtilization: { [team: string]: { used: number; total: number } } = {};

  // Initialize team utilization with total sizes for this week
  Object.entries(teams).forEach(([team, config]) => {
    const sizes = config.sizes;
    const teamSizes = sizes.filter(size => size.week <= week);
    const totalSize = teamSizes.length > 0 ? teamSizes[teamSizes.length - 1].size : 0;
    teamUtilization[team] = { used: 0, total: totalSize };
  });

  featuresInWeek.forEach(item => {
    Object.entries(item.assignments).forEach(([team, requirement]) => {
      const workingEngineers = Math.min(requirement.parallel, requirement.weeks);
      teamEngineers[team] = (teamEngineers[team] || 0) + workingEngineers;
      teamUtilization[team].used = (teamUtilization[team]?.used || 0) + workingEngineers;
    });
  });

  if (featuresInWeek.length === 0) return null;

  return (
    <div className="p-2">
      <div className="text-sm font-medium text-slate-900">
        {format(addWeeks(startDate, week), 'MMM d, yyyy')}
      </div>
      <div className="mt-2 space-y-3">
        {featuresInWeek.map(item => (
          <div key={item.feature} className="space-y-1.5">
            <div className="font-medium text-slate-800">{item.feature}</div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(item.assignments).map(([team, requirement]) => (
                <div
                  key={team}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 border border-slate-200"
                >
                  <TeamAvatar teamName={team} size={14} />
                  <span className="text-[11px] font-medium text-slate-800">
                    {Math.ceil(requirement.weeks * overheadFactor)}w
                  </span>
                  <span className="text-[11px] text-slate-600 flex items-center">
                    <Users className="h-3 w-3 mr-0.5" />
                    {requirement.parallel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2 border-t border-slate-200">
        <div className="text-xs font-medium text-slate-700">Team Members:</div>
        <div className="mt-1 space-y-1">
          {Object.entries(teamUtilization).map(([team, { used, total }]) => {
            const utilization = total > 0 ? Math.round((used / total) * 100) : 0;
            const utilizationColor =
              utilization > 100
                ? 'text-red-500'
                : utilization > 80
                  ? 'text-amber-500'
                  : 'text-green-500';

            return (
              <div key={team} className="flex items-center gap-1.5">
                <TeamAvatar teamName={team} size={14} />
                <span className="text-xs text-slate-600">
                  {team}:{' '}
                  <span className="font-medium">
                    {used} of {total} engineers
                  </span>{' '}
                  <span className={`${utilizationColor} font-medium`}>({utilization}%)</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
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
                    <TeamAvatar teamName={team} size={14} />
                    <span className="text-[11px] font-medium text-slate-800">
                      {Math.ceil(requirement.weeks * overheadFactor)}w
                    </span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="text-[11px] text-slate-600 ml-0.5 flex items-center">
                            <Users className="h-3.5 w-3.5 mr-1" />
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
              {getDateLabel(allocation.startWeek)} - {getDateLabel(allocation.endWeek)}
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
  getQuarterLabel: (index: number) => string;
  timeline: TimelineItemWithRow[];
  startDate: Date;
  overheadFactor: number;
  teams: Teams;
}

export function TimelineGrid({
  gridCount,
  columnWidth,
  onResizeStart,
  getTimelineLabel,
  getQuarterLabel,
  timeline,
  startDate,
  overheadFactor,
  teams,
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
              <TooltipProvider delayDuration={50}>
                <Tooltip>
                  <TooltipTrigger>
                    {getTimelineLabel(i)}
                    <div
                      className="absolute top-0 right-0 w-2 h-full cursor-ew-resize hover:bg-gray-200 transition-colors"
                      onMouseDown={onResizeStart}
                    />
                  </TooltipTrigger>
                  <TooltipContent
                    side="left"
                    className="bg-white/95 backdrop-blur-sm border-slate-300 shadow-lg"
                  >
                    <WeekIndicator
                      week={i}
                      timeline={timeline}
                      startDate={startDate}
                      overheadFactor={overheadFactor}
                      teams={teams}
                    />
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
