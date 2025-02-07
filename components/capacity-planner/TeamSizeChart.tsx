import { Teams } from '@/types/capacity-planner';
import { Card } from '@/components/ui/card';
import { LineChart } from '@/components/ui/line-chart';

type TeamSizeChartProps = {
  teams: Teams;
};

export function TeamSizeChart({ teams }: TeamSizeChartProps) {
  const maxWeek = Object.values(teams).reduce((max, team) => {
    const teamMaxWeek = team.sizes.reduce((max, size) => {
      return Math.max(max, size.week);
    }, 0);
    return Math.max(max, teamMaxWeek);
  }, 0);

  const chartData = Array(maxWeek + 1)
    .fill(0)
    .map((_, week) => {
      const weekData: { [key: string]: number } = { week };
      Object.entries(teams).forEach(([team, config]) => {
        const sizes = config.sizes;
        const teamSizes = sizes.filter(size => size.week <= week);
        if (teamSizes.length > 0) {
          weekData[team] = teamSizes[teamSizes.length - 1].size;
        }
      });
      return weekData;
    });

  const lines = Object.keys(teams).map(team => ({
    dataKey: team,
    name: team,
  }));

  const formatWeekLabel = (week: number) => {
    return `W${week}`;
  };

  return (
    <Card className="p-2">
      <h3 className="text-sm font-medium mb-1">Team Size Over Time</h3>
      <div className="h-[200px]">
        <LineChart
          data={chartData}
          lines={lines}
          xAxisDataKey="week"
          xAxisFormatter={formatWeekLabel}
        />
      </div>
    </Card>
  );
}
