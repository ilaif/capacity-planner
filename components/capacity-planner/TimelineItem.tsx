import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { TimelineItem as TimelineItemType } from '@/types/capacity-planner';
import { format, addWeeks } from 'date-fns';

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
      className="mb-4 p-2 bg-blue-100 rounded absolute"
      style={{
        left: `${getColumnPosition(allocation.startWeek)}px`,
        width: `${getColumnWidth(allocation.startWeek, allocation.endWeek || 0)}px`,
        top: `${index * 80 + 40}px`,
        minWidth: '30px',
      }}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="w-full text-left">
            <div className="text-sm font-medium truncate">{allocation.feature}</div>
            {Object.entries(allocation.assignments).map(([team, requirement]) => (
              <div key={team} className="text-xs truncate">
                {team}: {Math.round(requirement.weeks * overheadFactor)} ({requirement.parallel}{' '}
                parallel)
              </div>
            ))}
          </TooltipTrigger>
          <TooltipContent>
            <div className="font-medium">
              {index + 1}. {allocation.feature}
            </div>
            {Object.entries(allocation.assignments).map(([team, requirement]) => (
              <div key={team}>
                {team}: {requirement.weeks} ({requirement.parallel} parallel)
              </div>
            ))}
            <div className="mt-1 text-sm">
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
