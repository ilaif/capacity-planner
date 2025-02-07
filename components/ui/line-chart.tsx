'use client';

import * as React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

type LineChartProps = React.ComponentPropsWithoutRef<typeof RechartsLineChart> & {
  data: Record<string, number | string>[];
  lines: {
    dataKey: string;
    name?: string;
    className?: string;
  }[];
  xAxisDataKey: string;
  xAxisFormatter?: (value: number) => string;
  className?: string;
};

const LineChart = React.forwardRef<HTMLDivElement, LineChartProps>(
  ({ data, lines, xAxisDataKey, xAxisFormatter, className, ...props }, ref) => {
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
      <div ref={ref} className={cn('w-full h-full', className)}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart
            data={data}
            margin={{ top: 5, right: 5, left: 0, bottom: 25 }}
            style={{ background: 'transparent' }}
            {...props}
          >
            <XAxis
              dataKey={xAxisDataKey}
              tick={props => {
                const { x, y, payload } = props;
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text
                      x={0}
                      y={0}
                      dy={10}
                      textAnchor="end"
                      fill="hsl(var(--muted-foreground))"
                      fontSize={10}
                      transform="rotate(-45)"
                    >
                      {xAxisFormatter ? xAxisFormatter(payload.value as number) : payload.value}
                    </text>
                  </g>
                );
              }}
              interval={2}
              tickFormatter={xAxisFormatter}
              stroke="hsl(var(--muted))"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              width={20}
              stroke="hsl(var(--muted))"
            />
            <Tooltip
              contentStyle={{
                fontSize: '12px',
                background: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                color: 'hsl(var(--popover-foreground))',
              }}
              labelFormatter={xAxisFormatter}
              itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
            />
            <Legend
              wrapperStyle={{ fontSize: '10px', color: 'hsl(var(--muted-foreground))' }}
              iconSize={8}
              margin={{ top: 0, left: 0, right: 0, bottom: 0 }}
            />
            {lines.map((line, index) => (
              <Line
                key={line.dataKey}
                type="stepAfter"
                dataKey={line.dataKey}
                name={line.name || line.dataKey}
                stroke={colors[index % colors.length]}
                strokeWidth={1.5}
                dot={false}
                className={line.className}
                animationDuration={200}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    );
  }
);

LineChart.displayName = 'LineChart';

export { LineChart };
