import { Teams, TimelineItem } from '@/types/capacity-planner';

interface TeamUtilizationRowProps {
  team: string;
  teamConfig: Teams[string];
  timeline: TimelineItem[];
  columnWidth: number;
  gridCount: number;
}

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

      const isActiveInWeek =
        item.startWeek <= week && item.startWeek + Math.ceil(assignment.weeks) > week;

      return total + (isActiveInWeek ? assignment.parallel : 0);
    }, 0);

    return Math.min((utilization / teamSize) * 100, 100);
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500/50';
    if (percentage >= 70) return 'bg-yellow-500/50';
    return 'bg-green-500/50';
  };

  return (
    <div className="contents">
      {Array.from({ length: gridCount }).map((_, week) => {
        const utilization = calculateUtilization(week);
        return (
          <div
            key={week}
            className={`h-8 border-r border-border flex items-center justify-center ${getUtilizationColor(utilization)}`}
          >
            <span className="text-xs font-medium">{Math.round(utilization)}%</span>
          </div>
        );
      })}
    </div>
  );
}
