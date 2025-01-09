import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { TimelineItem } from '@/types/resource-planner';
import { RefObject } from 'react';

interface TimelineViewProps {
  timeline: TimelineItem[];
  timelineRef: RefObject<HTMLDivElement | null>;
  overheadFactor: number;
  onExport: () => void;
}

export function TimelineView({
  timeline,
  timelineRef,
  overheadFactor,
  onExport,
}: TimelineViewProps) {
  if (timeline.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Timeline</h3>
        <Button onClick={onExport}>Export PNG</Button>
      </div>
      <div ref={timelineRef} className="relative h-96 overflow-x-auto">
        <TimelineGrid timeline={timeline} />
        {timeline.map((allocation, index) => (
          <TimelineItem
            key={index}
            allocation={allocation}
            index={index}
            overheadFactor={overheadFactor}
          />
        ))}
      </div>
    </div>
  );
}

function TimelineItem({
  allocation,
  index,
  overheadFactor,
}: {
  allocation: TimelineItem;
  index: number;
  overheadFactor: number;
}) {
  return (
    <div
      className="mb-4 p-2 bg-blue-100 rounded absolute"
      style={{
        left: `${allocation.startWeek * 100}px`,
        width: `${(allocation.endWeek || 0 - allocation.startWeek) * 100}px`,
        top: `${index * 80 + 40}px`,
      }}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="w-full text-left">
            <div className="text-sm font-medium">
              {index + 1}. {allocation.feature}
            </div>
            {Object.entries(allocation.assignments).map(([team, requirement]) => (
              <div key={team} className="text-xs">
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
            Weeks: {allocation.startWeek} - {allocation.endWeek}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

function TimelineGrid({ timeline }: { timeline: TimelineItem[] }) {
  return (
    <div className="sticky top-0 left-0 right-0 h-8 bg-white z-10">
      {[...Array(Math.max(...(timeline.map(t => (t.endWeek || 0) + 1) || [12])))].map((_, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0"
          style={{
            left: `${i * 100}px`,
            width: '100px',
            borderLeft: '1px solid #e5e7eb',
          }}
        >
          <div className="text-xs text-gray-500 mt-2 text-center">Week {i}</div>
        </div>
      ))}
    </div>
  );
}
