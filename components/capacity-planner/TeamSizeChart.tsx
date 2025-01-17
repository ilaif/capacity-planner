import { Teams } from '@/types/capacity-planner';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TeamSizeChartProps {
  teams: Teams;
}

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

  // Linear-inspired color palette
  const colors = [
    '#5E6AD2', // primary blue
    '#8D8D8D', // neutral gray
    '#A1A1E5', // light purple
    '#67C9C9', // teal
    '#B5B5B5', // light gray
    '#9999FF', // periwinkle
    '#738BD7', // slate blue
    '#95A4FC', // lavender blue
  ];

  return (
    <Card className="p-2">
      <h3 className="text-sm font-medium mb-1">Team Size Over Time</h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
            style={{ background: 'transparent' }}
          >
            <XAxis
              dataKey="week"
              tick={{ fontSize: 10, fill: '#8D8D8D' }}
              interval={4}
              tickFormatter={value => `W${value}`}
              stroke="#E5E5E5"
            />
            <YAxis tick={{ fontSize: 10, fill: '#8D8D8D' }} width={20} stroke="#E5E5E5" />
            <Tooltip
              contentStyle={{
                fontSize: '12px',
                background: '#1C1C1C',
                border: '1px solid #2D2D2D',
                borderRadius: '6px',
                color: '#E5E5E5',
              }}
              labelFormatter={value => `Week ${value}`}
              itemStyle={{ color: '#E5E5E5' }}
            />
            <Legend
              wrapperStyle={{ fontSize: '10px', color: '#8D8D8D' }}
              iconSize={8}
              margin={{ top: 0, left: 0, right: 0, bottom: 0 }}
            />
            {Object.keys(teams).map((team, index) => (
              <Line
                key={team}
                type="stepAfter"
                dataKey={team}
                stroke={colors[index % colors.length]}
                strokeWidth={1.5}
                dot={false}
                name={team}
                animationDuration={200}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
