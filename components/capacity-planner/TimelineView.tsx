import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { TimelineItem, Feature, Teams } from '@/types/capacity-planner';
import { RefObject, useState, useCallback, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { format, addWeeks, startOfWeek } from 'date-fns';
import { calculateTimeline, exportTimelineAsPng } from '@/services/timelineService';

type ViewMode = 'weeks' | 'quarters';

interface TimelineViewProps {
  features: Feature[];
  teams: Teams;
  timelineRef: RefObject<HTMLDivElement | null>;
  overheadFactor: number;
}

export function TimelineView({ features, teams, timelineRef, overheadFactor }: TimelineViewProps) {
  const [columnWidth, setColumnWidth] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('weeks');
  const [startDate, setStartDate] = useState<Date>(startOfWeek(new Date()));
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);

  // Generate timeline whenever features, teams, or overhead factor changes
  useEffect(() => {
    const generatedTimeline = calculateTimeline(features, teams, overheadFactor);
    setTimeline(generatedTimeline);
  }, [features, teams, overheadFactor]);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const minWidth = 30;
        const maxWidth = 400;
        const newWidth = Math.max(minWidth, Math.min(maxWidth, columnWidth + e.movementX));
        setColumnWidth(newWidth);
      }
    },
    [isDragging, columnWidth]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add and remove event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const getTimelineLabel = (index: number) => {
    const date = addWeeks(startDate, index);
    if (viewMode === 'weeks') {
      if (columnWidth < 50) return format(date, 'M/d');
      return `W${index} (${format(date, 'MMM d')})`;
    }
    const year = Math.floor((index * 13) / 52) + 1;
    const weekInYear = (index * 13) % 52;
    const quarter = Math.floor(weekInYear / 13) + 1;
    return `Q${quarter} Y${year}`;
  };

  const getColumnPosition = (week: number) => {
    if (viewMode === 'weeks') return week * columnWidth;
    return Math.floor(week / 13) * columnWidth;
  };

  const getColumnWidth = (startWeek: number, endWeek: number) => {
    if (viewMode === 'weeks') return (endWeek - startWeek) * columnWidth;
    return Math.ceil((endWeek - startWeek) / 13) * columnWidth;
  };

  const getTimelineGridCount = () => {
    const maxWeek = Math.max(...(timeline.map(t => (t.endWeek || 0) + 1) || [12]));
    return viewMode === 'weeks' ? maxWeek : Math.ceil(maxWeek / 13);
  };

  const getQuarterLabel = (weekIndex: number) => {
    const date = addWeeks(startDate, weekIndex);
    const weekInYear = weekIndex % 52;
    const quarter = Math.floor(weekInYear / 13) + 1;
    if (columnWidth * 13 < 100) return `Q${quarter}`;
    return `Q${quarter} ${format(date, 'yyyy')}`;
  };

  const handleExport = useCallback(() => {
    if (timeline.length > 0) {
      exportTimelineAsPng(timeline, overheadFactor, {
        startDate,
        columnWidth,
        viewMode,
      });
    }
  }, [timeline, overheadFactor, startDate, columnWidth, viewMode]);

  if (timeline.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Start:</span>
            <Input
              type="date"
              value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
              onChange={e =>
                setStartDate(e.target.value ? startOfWeek(new Date(e.target.value)) : new Date())
              }
              className="w-[140px]"
            />
          </div>
          <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="View mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weeks">Weeks</SelectItem>
              <SelectItem value="quarters">Quarters</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport}>Export PNG</Button>
        </div>
      </div>
      <div ref={timelineRef} className="relative h-[600px] overflow-x-auto">
        <div>
          <TimelineGrid
            gridCount={getTimelineGridCount()}
            columnWidth={columnWidth}
            onResizeStart={handleMouseDown}
            getTimelineLabel={getTimelineLabel}
            getQuarterLabel={getQuarterLabel}
            viewMode={viewMode}
          />
        </div>
        <div className="relative">
          {timeline.map((allocation, index) => (
            <TimelineItem
              key={index}
              allocation={allocation}
              index={index}
              overheadFactor={overheadFactor}
              getColumnPosition={getColumnPosition}
              getColumnWidth={getColumnWidth}
              startDate={startDate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineItem({
  allocation,
  index,
  overheadFactor,
  getColumnPosition,
  getColumnWidth,
  startDate,
}: {
  allocation: TimelineItem;
  index: number;
  overheadFactor: number;
  getColumnPosition: (week: number) => number;
  getColumnWidth: (startWeek: number, endWeek: number) => number;
  startDate: Date;
}) {
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
            <div className="text-sm font-medium truncate">
              {index + 1}. {allocation.feature}
            </div>
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

function TimelineGrid({
  gridCount,
  columnWidth,
  onResizeStart,
  getTimelineLabel,
  getQuarterLabel,
  viewMode,
}: {
  gridCount: number;
  columnWidth: number;
  onResizeStart: () => void;
  getTimelineLabel: (index: number) => string;
  getQuarterLabel: (weekIndex: number) => string;
  viewMode: ViewMode;
}) {
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
      {viewMode === 'weeks' && (
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
      )}
    </div>
  );
}
