import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { TimelineItem as TimelineItemType, Teams } from '@/types/capacity-planner';
import { WeekIndicator } from './WeekIndicator';

type TimelineItemWithRow = TimelineItemType & {
  row: number;
};

type TimelineGridProps = {
  gridCount: number;
  columnWidth: number;
  onResizeStart: () => void;
  getTimelineLabel: (index: number) => string;
  getTimelineDateLabel: (index: number) => string;
  getQuarterLabel: (index: number) => string;
  timeline: TimelineItemWithRow[];
  startDate: Date;
  overheadFactor: number;
  teams: Teams;
};

export function TimelineGrid({
  gridCount,
  columnWidth,
  onResizeStart,
  getTimelineLabel,
  getTimelineDateLabel,
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
                    <div className="text-sm text-slate-900">{getTimelineDateLabel(i)}</div>
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
