"use client";

import { useState } from "react";

export function WeeklySummaryChart() {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const yLabels = ["$100", "$900", "$800", "$700", "$600", "$500", "$400", "$300"];

  // SVG coordinate dimensions
  const width = 340;
  const height = 150;
  const padLeft = 40;
  const padBottom = 24;
  const usableW = width - padLeft - 10;
  const usableH = height - padBottom - 10;

  // Solid curve points (rising smoothly to a plateau like in screenshot)
  const solidCoords = [
    { x: padLeft + (0 / 6) * usableW, y: height - padBottom - 0.15 * usableH },
    { x: padLeft + (1 / 6) * usableW, y: height - padBottom - 0.28 * usableH },
    { x: padLeft + (2 / 6) * usableW, y: height - padBottom - 0.42 * usableH },
    { x: padLeft + (3 / 6) * usableW, y: height - padBottom - 0.38 * usableH },
    { x: padLeft + (4 / 6) * usableW, y: height - padBottom - 0.65 * usableH },
    { x: padLeft + (5 / 6) * usableW, y: height - padBottom - 0.88 * usableH },
    { x: padLeft + (6 / 6) * usableW, y: height - padBottom - 0.88 * usableH },
  ];

  // Dashed curve points (smooth weave)
  const dashedCoords = [
    { x: padLeft + (0 / 6) * usableW, y: height - padBottom - 0.12 * usableH },
    { x: padLeft + (1 / 6) * usableW, y: height - padBottom - 0.35 * usableH },
    { x: padLeft + (2 / 6) * usableW, y: height - padBottom - 0.25 * usableH },
    { x: padLeft + (3 / 6) * usableW, y: height - padBottom - 0.55 * usableH },
    { x: padLeft + (4 / 6) * usableW, y: height - padBottom - 0.48 * usableH },
    { x: padLeft + (5 / 6) * usableW, y: height - padBottom - 0.72 * usableH },
    { x: padLeft + (6 / 6) * usableW, y: height - padBottom - 0.75 * usableH },
  ];

  function buildSpline(pts: { x: number; y: number }[]) {
    let d = `M ${pts[0]!.x} ${pts[0]!.y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i]!;
      const p1 = pts[i + 1]!;
      const cx = (p0.x + p1.x) / 2;
      d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }

  const solidPath = buildSpline(solidCoords);
  const dashedPath = buildSpline(dashedCoords);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-purple/20 shadow-sm relative overflow-hidden flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text">Weekly Summary</h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Filter date"
            className="w-7 h-7 rounded-full border border-purple/20 bg-cream/40 flex items-center justify-center text-muted hover:text-text hover:bg-cream transition shadow-2xs"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Export report"
            className="w-7 h-7 rounded-full border border-purple/20 bg-cream/40 flex items-center justify-center text-muted hover:text-text hover:bg-cream transition shadow-2xs"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Metric & Dates */}
      <div className="flex items-baseline justify-between mt-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-text tracking-tight">$3,397</span>
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
            ▲ +4.2%
          </span>
        </div>
        <span className="text-xs font-medium text-muted">Apr 28 - May 3</span>
      </div>

      {/* Multi-line Spline Chart */}
      <div className="relative w-full h-[150px] my-1 select-none">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {/* Subtle horizontal grid lines */}
          {[0.2, 0.4, 0.6, 0.8].map((pct, idx) => (
            <line
              key={idx}
              x1={padLeft}
              y1={height - padBottom - pct * usableH}
              x2={width - 10}
              y2={height - padBottom - pct * usableH}
              stroke="rgba(155, 142, 199, 0.12)"
              strokeDasharray="2 2"
            />
          ))}

          {/* Y Axis Labels */}
          {yLabels.map((lbl, idx) => {
            const yPos = 14 + (idx / (yLabels.length - 1)) * (usableH + 6);
            return (
              <text
                key={lbl}
                x={padLeft - 6}
                y={yPos}
                textAnchor="end"
                fontSize="8"
                fill="#635B77"
                opacity="0.7"
                fontFamily="inherit"
              >
                {lbl}
              </text>
            );
          })}

          {/* Dashed curve */}
          <path
            d={dashedPath}
            fill="none"
            stroke="#635B77"
            strokeWidth="1.6"
            strokeDasharray="3 3"
            strokeOpacity="0.75"
          />

          {/* Solid curve */}
          <path
            d={solidPath}
            fill="none"
            stroke="#9B8EC7"
            strokeWidth="2.2"
          />

          {/* Points on solid line */}
          <circle
            cx={solidCoords[solidCoords.length - 1]!.x}
            cy={solidCoords[solidCoords.length - 1]!.y}
            r="3.5"
            fill="#9B8EC7"
          />

          <circle
            cx={solidCoords[solidCoords.length - 1]!.x}
            cy={height - padBottom - 0.75 * usableH}
            r="3"
            fill="#241E33"
          />

          {/* X Axis Labels */}
          {days.map((day, idx) => (
            <text
              key={day}
              x={padLeft + (idx / 6) * usableW}
              y={height - 4}
              textAnchor="middle"
              fontSize="9"
              fill={hoverIndex === idx ? "#241E33" : "#635B77"}
              fontWeight={hoverIndex === idx ? "bold" : "normal"}
              fontFamily="inherit"
            >
              {day}
            </text>
          ))}

          {/* Interactive hover overlays */}
          {days.map((_, idx) => {
            const x = padLeft + (idx / 6) * usableW - usableW / 12;
            return (
              <rect
                key={idx}
                x={x}
                y={0}
                width={usableW / 6}
                height={height}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
