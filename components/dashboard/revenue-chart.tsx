'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fmtMoney } from '@/lib/format';
import { bg } from '@/lib/i18n/bg';

export interface ChartPoint {
  label: string;
  revenue: number;
  profit: number;
}

export function RevenueChart({ data }: { data: ChartPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#dcdcd4" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#4a5568' }}
            tickLine={false}
            axisLine={{ stroke: '#dcdcd4' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#4a5568' }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip
            formatter={(value) => fmtMoney(Number(value ?? 0))}
            contentStyle={{
              border: '1px solid #dcdcd4',
              borderRadius: 2,
              fontSize: 12,
              fontFamily: 'var(--font-plex-mono)',
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar
            dataKey="revenue"
            name={bg.dashboard.chartRevenue}
            fill="#12213a"
            radius={[2, 2, 0, 0]}
          />
          <Bar
            dataKey="profit"
            name={bg.dashboard.chartProfit}
            fill="#2c6e52"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
