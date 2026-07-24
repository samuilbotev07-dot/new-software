'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface TrendPoint {
  label: string;
  score: number;
}

export function HealthTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#dcdcd4" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#4a5568' }}
            tickLine={false}
            axisLine={{ stroke: '#dcdcd4' }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#4a5568' }}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <Tooltip
            contentStyle={{
              border: '1px solid #dcdcd4',
              borderRadius: 2,
              fontSize: 12,
              fontFamily: 'var(--font-plex-mono)',
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            name="Оценка"
            stroke="#2c6e52"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
