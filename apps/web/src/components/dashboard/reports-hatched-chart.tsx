"use client";

import { useState } from "react";

interface DataPoint {
  date: string;
  earnings: number;
  bills: number;
  topY: number; // relative SVG coordinate [0..100]
  bottomY: number;
}

const DEFAULT_SERIES: DataPoint[] = [
  { date: "Jan 10", earnings: 48620, bills: 6820, topY: 38, bottomY: 62 },
  { date: "Jan 11", earnings: 42150, bills: 8400, topY: 46, bottomY: 68 },
  { date: "Jan 12", earnings: 6820, bills: 44651, topY: 34, bottomY: 65 },
  { date: "Jan 13", earnings: 38900, bills: 12200, topY: 48, bottomY: 74 },
  { date: "Jan 14", earnings: 52400, bills: 7100, topY: 36, bottomY: 60 },
  { date: "Jan 15", earnings: 49800, bills: 9300, topY: 40, bottomY: 64 },
  { date: "Jan 16", earnings: 58200, bills: 5400, topY: 32, bottomY: 58 },
];

export function ReportsHatchedChart({
  period = "Weekly",
  onPeriodChange,
}: {
  period?: string;
  onPeriodChange?: (p: string) => void;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(2); // Default to Jan 12 like screenshot
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // SVG dimensions
  const width = 760;
  const height = 240;
  const paddingX = 40;
  const usableWidth = width - paddingX * 2;
  const stepX = usableWidth / (DEFAULT_SERIES.length - 1);

  // Generate smooth cubic bezier SVG paths
  const topPoints = DEFAULT_SERIES.map((d, i) => ({
    x: paddingX + i * stepX,
    y: (d.topY / 100) * height,
  }));

  const bottomPoints = DEFAULT_SERIES.map((d, i) => ({
    x: paddingX + i * stepX,
    y: (d.bottomY / 100) * height,
  }));

  function getBezierPath(points: { x: number; y: number }[]) {
    if (points.length === 0) return "";
    let d = `M ${points[0]!.x} ${points[0]!.y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i]!;
      const p1 = points[i + 1]!;
      const cx = (p0.x + p1.x) / 2;
      d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }

  const topPath = getBezierPath(topPoints);
  const bottomPointsReversed = [...bottomPoints].reverse();
  const bottomPath = getBezierPath(bottomPoints);

  // Path bounding the hatched area between top and bottom lines
  const hatchedAreaPath = `${topPath} L ${bottomPointsReversed[0]!.x} ${bottomPointsReversed[0]!.y} ${getBezierPath(
    bottomPointsReversed
  ).replace(/^M [^ ]+ [^ ]+/, "")} Z`;

  const activePoint = hoverIndex !== null ? DEFAULT_SERIES[hoverIndex] : DEFAULT_SERIES[2];
  const activeCoord = hoverIndex !== null ? topPoints[hoverIndex] : topPoints[2];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-purple/20 shadow-sm relative overflow-hidden flex flex-col justify-between h-full">
      {/* Header Row */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text">Reports</h2>
          <div className="flex items-center gap-6 mt-2">
            <div>
              <span className="text-xs font-medium text-muted block">Earnings</span>
              <span className="text-lg sm:text-xl font-bold text-text tracking-tight">$48,620</span>
            </div>
            <div>
              <span className="text-xs font-medium text-muted block">Bills</span>
              <span className="text-lg sm:text-xl font-bold text-text tracking-tight">$6,820</span>
            </div>
          </div>
        </div>

        {/* Dropdown Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream/70 border border-purple/25 text-xs font-semibold text-text hover:bg-cream transition shadow-2xs"
          >
            <svg className="w-3.5 h-3.5 text-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
            <span>{period}</span>
            <svg className="w-3 h-3 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-32 bg-white border border-purple/20 rounded-2xl shadow-lg z-30 py-1.5">
              {["Daily", "Weekly", "Monthly", "Annual"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    onPeriodChange?.(p);
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-1.5 text-xs font-medium text-text hover:bg-lavender/25 transition"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="relative w-full h-[220px] sm:h-[240px] select-none mt-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Diagonal Hatch Pattern matching reference screenshot */}
            <pattern
              id="diagonalHatchArea"
              patternUnits="userSpaceOnUse"
              width="6"
              height="6"
              patternTransform="rotate(45)"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="6"
                stroke="#9B8EC7"
                strokeWidth="1.2"
                strokeOpacity="0.45"
              />
            </pattern>
          </defs>

          {/* Hatched Area fill between top and bottom curve */}
          <path d={hatchedAreaPath} fill="url(#diagonalHatchArea)" />

          {/* Top smooth curve */}
          <path
            d={topPath}
            fill="none"
            stroke="#9B8EC7"
            strokeWidth="1.7"
            strokeDasharray="3 3"
            strokeOpacity="0.8"
          />

          {/* Bottom smooth curve */}
          <path
            d={bottomPath}
            fill="none"
            stroke="#9B8EC7"
            strokeWidth="1.7"
            strokeDasharray="3 3"
            strokeOpacity="0.6"
          />

          {/* Data Points on top curve */}
          {topPoints.map((pt, i) => (
            <circle
              key={`top-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={i === hoverIndex ? 4.5 : 2.5}
              fill={i === hoverIndex ? "#241E33" : "#635B77"}
              className="transition-all duration-150 cursor-pointer"
            />
          ))}

          {/* Data Points on bottom curve */}
          {bottomPoints.map((pt, i) => (
            <circle
              key={`bot-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={2.5}
              fill="#635B77"
              opacity={0.6}
            />
          ))}

          {/* Vertical guideline for active hover */}
          {activeCoord && (
            <line
              x1={activeCoord.x}
              y1={activeCoord.y}
              x2={activeCoord.x}
              y2={height - 20}
              stroke="#241E33"
              strokeWidth="1"
              strokeDasharray="2 2"
              strokeOpacity="0.3"
            />
          )}

          {/* Interactive invisible hover columns */}
          {DEFAULT_SERIES.map((_, i) => {
            const x = paddingX + i * stepX - stepX / 2;
            return (
              <rect
                key={`hit-${i}`}
                x={Math.max(0, x)}
                y={0}
                width={stepX}
                height={height}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
              />
            );
          })}
        </svg>

        {/* Floating Tooltip matching the screenshot design */}
        {activePoint && activeCoord && (
          <div
            className="absolute z-20 pointer-events-none transition-all duration-150 transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${(activeCoord.x / width) * 100}%`,
              top: `${Math.max(10, (activeCoord.y / height) * 100 - 10)}%`,
            }}
          >
            <div className="bg-white/95 backdrop-blur-md border border-purple/30 rounded-2xl p-3 shadow-xl w-44">
              <div className="text-[10px] font-semibold text-muted mb-1.5 flex items-center justify-between">
                <span>{activePoint.date}, 2026</span>
                <span className="w-1.5 h-1.5 rounded-full bg-purple" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted flex items-center gap-1">
                    <span className="text-[10px] text-purple">↙</span> Earnings:
                  </span>
                  <span className="font-bold text-text">
                    ${activePoint.earnings.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted flex items-center gap-1">
                    <span className="text-[10px] text-cyan">📄</span> Bills:
                  </span>
                  <span className="font-bold text-text">
                    ${activePoint.bills.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Custom Cursor Pointer Icon matching screenshot */}
            <div className="relative -mt-1 left-1/2 transform -translate-x-1/2">
              <svg className="w-4 h-4 text-text drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3l7 18 3-7 7-3L3 3z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Date Labels below chart */}
      <div className="flex justify-between px-6 pt-2 text-[11px] font-medium text-muted">
        {DEFAULT_SERIES.map((d, i) => (
          <button
            key={d.date}
            type="button"
            onClick={() => setHoverIndex(i)}
            className={`transition-colors ${
              i === hoverIndex ? "text-text font-bold" : "hover:text-text"
            }`}
          >
            {d.date}
          </button>
        ))}
      </div>
    </div>
  );
}
