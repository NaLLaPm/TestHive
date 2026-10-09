"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export interface AdoptionPoint {
  round: number;
  cumulativeAdopters: number;
}

export function AdoptionCurve({ data, poolSize }: { data: AdoptionPoint[]; poolSize: number }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ left: 0, right: 24, top: 12 }}>
        <CartesianGrid stroke="rgba(155, 142, 199, 0.22)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="round"
          tick={{ fill: "#635B77", fontSize: 12 }}
          label={{ value: "Round", position: "insideBottom", offset: -4, fill: "#635B77" }}
        />
        <YAxis domain={[0, poolSize]} tick={{ fill: "#635B77", fontSize: 12 }} />
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
        <Line
          type="monotone"
          dataKey="cumulativeAdopters"
          stroke="#9B8EC7"
          strokeWidth={3}
          dot={{ r: 4, fill: "#B4D3D9", stroke: "#9B8EC7", strokeWidth: 2 }}
          activeDot={{ r: 6, fill: "#BDA6CE", stroke: "#241E33", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
