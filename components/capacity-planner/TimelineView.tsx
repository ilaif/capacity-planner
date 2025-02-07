import { Button } from '@/components/ui/button';
import type { TimelineItem as TimelineItemType } from '@/types/capacity-planner';
import { useState, useCallback, useEffect } from 'react';
import { format, addWeeks } from 'date-fns';
import { calculateTimeline, exportTimelineAsPng } from '@/services/timelineService';
import { TimelineItem } from './TimelineItem';
import { TimelineStats } from './TimelineStats';
import { usePlannerStore } from '@/store/plannerStore';
import { TeamUtilizationRow } from './TeamUtilizationRow';
import { TimelineGrid } from './TimelineGrid';

type TimelineItemWithRow = TimelineItemType & {
  row: number;
};

type TimelineViewProps = {
  onFeatureClick?: (featureName: string) => void;
};

export function TimelineView({ onFeatureClick }: TimelineViewProps) {
  const { planState, planName } = usePlannerStore();
  const { features, teams, overheadFactor, startDate } = planState;
  const [columnWidth, setColumnWidth] = useState(60);
  const [isDragging, setIsDragging] = useState(false);
  const [timeline, setTimeline] = useState<TimelineItemWithRow[]>([]);

  // Calculate optimal row positions for timeline items
  const calculateRowPositions = (items: TimelineItemType[]): TimelineItemWithRow[] => {
    const itemsWithRows: TimelineItemWithRow[] = [];

    let rowIndex = 0;
    let lastEndWeek = 0;
    for (const item of items) {
      if (item.startWeek < lastEndWeek) {
        rowIndex++;
      }
      lastEndWeek = item.endWeek;
      itemsWithRows.push({ ...item, row: rowIndex });
    }

    return itemsWithRows;
  };

  // Generate timeline whenever features, teams, or overhead factor changes
  useEffect(() => {
    const generatedTimeline = calculateTimeline(features, teams, overheadFactor);
    const timelineWithRows = calculateRowPositions(generatedTimeline);
    setTimeline(timelineWithRows);
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
    return `W${index}`;
  };

  const getTimelineDateLabel = (index: number) => {
    const date = addWeeks(startDate, index);
    return format(date, 'MMM d, yyyy');
  };

  const getColumnPosition = (week: number) => {
    return week * columnWidth;
  };

  const getColumnWidth = (startWeek: number, endWeek: number) => {
    return (endWeek - startWeek) * columnWidth;
  };

  const getTimelineGridCount = () => {
    const maxWeek = Math.max(...(timeline.map(t => t.endWeek + 1) || [12]));
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
    <>
      <div className="flex justify-between items-center p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <TimelineStats
          timeline={timeline}
          startDate={startDate}
          configurationName={planName || 'Not set'}
        />
        <Button variant="outline" onClick={handleExport}>
          Export PNG
        </Button>
      </div>
      <div className="flex flex-col h-[calc(100vh-137px)] overflow-x-auto">
        <div className="grid grid-rows-[auto_1fr_auto]">
          <TimelineGrid
            gridCount={getTimelineGridCount()}
            columnWidth={columnWidth}
            onResizeStart={handleMouseDown}
            getTimelineLabel={getTimelineLabel}
            getTimelineDateLabel={getTimelineDateLabel}
            getQuarterLabel={getQuarterLabel}
            timeline={timeline}
            startDate={startDate}
            overheadFactor={overheadFactor}
            teams={teams}
          />
          <div
            className="grid border-r border-l border-border bg-muted/30"
            style={{
              gridTemplateColumns: `repeat(${getTimelineGridCount()}, ${columnWidth}px)`,
            }}
          >
            {Object.entries(teams).map(([team, config]) => (
              <div key={team} className="contents">
                <TeamUtilizationRow
                  team={team}
                  teamConfig={config}
                  timeline={timeline}
                  columnWidth={columnWidth}
                  gridCount={getTimelineGridCount()}
                />
              </div>
            ))}
          </div>
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${getTimelineGridCount()}, ${columnWidth}px)`,
            }}
          >
            {timeline.map((allocation, index) => (
              <TimelineItem
                key={index}
                allocation={allocation}
                index={allocation.row}
                overheadFactor={overheadFactor}
                getColumnPosition={getColumnPosition}
                getColumnWidth={getColumnWidth}
                startDate={startDate}
                onFeatureClick={onFeatureClick}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
