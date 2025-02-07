import { TeamAvatar } from '@/components/ui/team-avatar';
import type { TimelineItem as TimelineItemType, Teams } from '@/types/capacity-planner';
import { format, addWeeks } from 'date-fns';
import { Users } from 'lucide-react';

type TimelineItemWithRow = TimelineItemType & {
  row: number;
};

type WeekIndicatorProps = {
  week: number;
  timeline: TimelineItemWithRow[];
  startDate: Date;
  overheadFactor: number;
  teams: Teams;
};

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
      <div className="text-sm font-medium text-slate-100">
        Week {week} ({format(addWeeks(startDate, week), 'MMM d, yyyy')})
      </div>
      <div className="mt-2 space-y-3">
        {featuresInWeek.map(item => (
          <div key={item.feature} className="space-y-1.5">
            <div className="font-medium text-slate-200">{item.feature}</div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(item.assignments).map(([team, requirement]) => (
                <div
                  key={team}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-700"
                >
                  <TeamAvatar teamName={team} size={14} />
                  <span className="text-[11px] font-medium text-slate-200">
                    {Math.ceil(requirement.weeks * overheadFactor)}w
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center">
                    <Users className="h-3 w-3 mr-0.5" />
                    {requirement.parallel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2 border-t border-slate-700">
        <div className="text-xs font-medium text-slate-300">Team Members:</div>
        <div className="mt-1 space-y-1">
          {Object.entries(teamUtilization).map(([team, { used, total }]) => {
            const utilization = total > 0 ? Math.round((used / total) * 100) : 0;
            const utilizationColor =
              utilization > 100
                ? 'text-red-400'
                : utilization > 80
                  ? 'text-amber-400'
                  : 'text-green-400';

            return (
              <div key={team} className="flex items-center gap-1.5">
                <TeamAvatar teamName={team} size={14} />
                <span className="text-xs text-slate-400">
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
