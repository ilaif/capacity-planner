import { Button } from '@/components/ui/button';
import type { TimelineItem as TimelineItemType, Feature, Teams } from '@/types/capacity-planner';
import { RefObject, useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { format, addWeeks, startOfWeek } from 'date-fns';
import { calculateTimeline, exportTimelineAsPng } from '@/services/timelineService';
import { TimelineItem, TimelineGrid } from './TimelineItem';

interface TimelineViewProps {
  features: Feature[];
  teams: Teams;
  timelineRef: RefObject<HTMLDivElement | null>;
  overheadFactor: number;
}

export function TimelineView({ features, teams, timelineRef, overheadFactor }: TimelineViewProps) {
  const [columnWidth, setColumnWidth] = useState(40);
  const [isDragging, setIsDragging] = useState(false);
  const [startDate, setStartDate] = useState<Date>(startOfWeek(new Date()));
  const [timeline, setTimeline] = useState<TimelineItemType[]>([]);

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
    if (columnWidth < 70) return format(date, 'M/d');
    return `W${index} (${format(date, 'MMM d')})`;
  };

  const getColumnPosition = (week: number) => {
    return week * columnWidth;
  };

  const getColumnWidth = (startWeek: number, endWeek: number) => {
    return (endWeek - startWeek) * columnWidth;
  };

  const getTimelineGridCount = () => {
    const maxWeek = Math.max(...(timeline.map(t => (t.endWeek || 0) + 1) || [12]));
    return maxWeek;
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
      });
    }
  }, [timeline, overheadFactor, startDate, columnWidth]);

  if (timeline.length === 0) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
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
          <Button onClick={handleExport}>Export PNG</Button>
        </div>
      </div>
      <div ref={timelineRef} className="flex-1 overflow-auto relative min-h-0">
        <div className="sticky top-0 z-10 bg-background">
          <TimelineGrid
            gridCount={getTimelineGridCount()}
            columnWidth={columnWidth}
            onResizeStart={handleMouseDown}
            getTimelineLabel={getTimelineLabel}
            getQuarterLabel={getQuarterLabel}
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
