"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#F28B82",
  high: "#BDA6CE",
  medium: "#FDD663",
  low: "#B4D3D9",
};

export function SeverityBars({ data }: { data: { title: string; severity: string; affectedPersonas: number }[] }) {
  const chartData = data.slice(0, 8).map((d) => ({ ...d, label: d.title.length > 30 ? d.title.slice(0, 28) + "…" : d.title }));
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 40)}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 12, right: 24 }}>
        <XAxis type="number" tick={{ fill: "#635B77", fontSize: 12 }} />
        <YAxis type="category" dataKey="label" width={220} tick={{ fill: "#241E33", fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            background: "#FFFFFF",
            border: "1px solid rgba(155, 142, 199, 0.35)",
            borderRadius: 16,
            color: "#241E33",
            boxShadow: "0 4px 14px rgba(155, 142, 199, 0.15)",
            padding: "8px 12px",
          }}
        />
        <Bar dataKey="affectedPersonas" radius={[0, 10, 10, 0]}>
          {chartData.map((d, i) => (
            <Cell key={i} fill={SEVERITY_COLOR[d.severity] ?? "#BDA6CE"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
