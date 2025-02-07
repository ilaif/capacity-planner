import { Teams, TimelineItem } from '@/types/capacity-planner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TeamAvatar } from '@/components/ui/team-avatar';
import { cn } from '@/lib/utils';

type TeamUtilizationRowProps = {
  team: string;
  teamConfig: Teams[string];
  timeline: TimelineItem[];
  columnWidth: number;
  gridCount: number;
};

export function TeamUtilizationRow({
  team,
  teamConfig,
  timeline,
  gridCount,
}: TeamUtilizationRowProps) {
  const calculateUtilization = (week: number) => {
    const teamSize = teamConfig.sizes.reduce(
      (size, config) => (config.week <= week ? config.size : size),
      0
    );

    if (teamSize === 0) return 0;

    const utilization = timeline.reduce((total, item) => {
      const assignment = item.assignments[team];
      if (!assignment) return total;

      const isActiveInWeek = item.startWeek <= week && item.endWeek > week;

      return total + (isActiveInWeek ? assignment.parallel : 0);
    }, 0);

    return Math.min((utilization / teamSize) * 100, 100);
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-destructive/30 dark:bg-destructive/20';
    if (percentage >= 70) return 'bg-warning/30 dark:bg-warning/20';
    return 'bg-success/30 dark:bg-success/20';
  };

  return (
    <div className="contents">
      {Array.from({ length: gridCount }).map((_, week) => {
        const utilization = calculateUtilization(week);
        return (
          <TooltipProvider key={week}>
            <Tooltip>
              <TooltipTrigger>
                <div
                  key={week}
                  className={cn(
                    'h-5 border-r border-border flex items-center justify-center',
                    getUtilizationColor(utilization)
                  )}
                >
                  <span className="text-xs font-medium">{Math.round(utilization)}%</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2 text-xs">
                  <TeamAvatar teamName={team} size={20} />
                  <div>
                    <span className="font-medium">{team}&nbsp;</span>
                    <span>utilization</span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}
