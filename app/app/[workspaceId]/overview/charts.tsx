'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChannelData {
  channel: string;
  spend: number;
  revenue: number;
  roas: number;
  cpa: number;
}

export function ChannelBarChart({ data }: { data: ChannelData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="channel" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="spend" fill="#8884d8" name="Spend" />
        <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
      </BarChart>
    </ResponsiveContainer>
  );
}
