"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export interface SegmentBarDatum {
  label: string;
  successRate: number;
  n: number;
  marginOfError?: number;
  isLowSample?: boolean;
}

function colorFor(rate: number, isLowSample?: boolean): string {
  if (isLowSample) return "#BDA6CE"; // Soft lavender for clusters with n < 10
  if (rate < 0.35) return "#F28B82"; // Soft coral
  if (rate < 0.6) return "#FDD663";  // Pixel warm gold
  return "#81C995";                  // Pixel soft green
}

export function SegmentBarChart({ data }: { data: SegmentBarDatum[] }) {
  const chartData = data.map((d) => {
    const pct = Math.round(d.successRate * 100);
    const moe = d.marginOfError !== undefined ? Math.round(d.marginOfError * 100) : null;
    const isLow = d.isLowSample ?? d.n < 10;
    return {
      ...d,
      pct,
      moe,
      isLow,
      displayLabel: isLow ? `${d.label} (low n=${d.n})` : d.label,
    };
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 text-xs text-muted mb-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#81C995]" /> ≥ 60%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FDD663]" /> 35% – 59%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F28B82]" /> &lt; 35%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#BDA6CE]" /> Low power: n &lt; 10
        </span>
      </div>

      <ResponsiveContainer width="100%" height={Math.max(240, chartData.length * 44)}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 16, right: 36 }}>
          <XAxis type="number" domain={[0, 100]} tick={{ fill: "#635B77", fontSize: 12 }} unit="%" />
          <YAxis
            type="category"
            dataKey="displayLabel"
            width={230}
            tick={(props) => {
              const item = chartData[props.index];
              const fill = item?.isLow ? "#8C849C" : "#241E33";
              return (
                <text
                  x={props.x}
                  y={props.y}
                  dy={4}
                  textAnchor="end"
                  fill={fill}
                  fontSize={12}
                  fontStyle={item?.isLow ? "italic" : "normal"}
                >
                  {props.payload.value}
                </text>
              );
            }}
          />
          <Tooltip
            contentStyle={{
              background: "#FFFFFF",
              border: "1px solid rgba(155, 142, 199, 0.35)",
              borderRadius: 16,
              color: "#241E33",
              boxShadow: "0 4px 14px rgba(155, 142, 199, 0.15)",
              padding: "8px 12px",
            }}
            formatter={(value: number, _name, props: any) => {
              const p = props.payload;
              const moeStr = p.moe !== null ? ` ± ${p.moe}%` : "";
              const lowNote = p.isLow ? " [Greyed out: n < 10]" : "";
              return [`${value}%${moeStr} (n=${p.n})${lowNote}`, "Success rate (95% CI)"];
            }}
          />
          <Bar dataKey="pct" radius={[0, 12, 12, 0]}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={colorFor(d.successRate, d.isLow)} opacity={d.isLow ? 0.45 : 1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

