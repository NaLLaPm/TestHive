"use client";

import { useState } from "react";

interface DayData {
  day: string;
  value: number; // percentage [0..100]
}

const WEEK_DATA: DayData[] = [
  { day: "Sun", value: 48 },
  { day: "Mon", value: 68 },
  { day: "Tue", value: 38 },
  { day: "Wed", value: 82 },
  { day: "Thu", value: 28 },
  { day: "Fri", value: 92 },
  { day: "Sat", value: 62 },
];

export function OccupationChart() {
  const [hoverDay, setHoverDay] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-purple/20 shadow-sm relative overflow-hidden flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text">Occupation</h2>
        <button
          type="button"
          aria-label="Filter calendar date"
          className="w-8 h-8 rounded-full border border-purple/20 bg-cream/40 flex items-center justify-center text-muted hover:text-text hover:bg-cream transition shadow-2xs"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
          </svg>
        </button>
      </div>

      {/* Metric Subheader */}
      <div className="mt-2 mb-4">
        <span className="text-xs font-medium text-muted block">Avarage</span>
        <span className="text-2xl font-bold text-text tracking-tight">45%</span>
      </div>

      {/* 7 Vertical Hatched Pillar Bars */}
      <div className="relative w-full h-[150px] flex items-end justify-between gap-2 sm:gap-3 px-1 my-2">
        {WEEK_DATA.map((d) => {
          const isHovered = hoverDay === d.day;
          return (
            <div
              key={d.day}
              className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group"
              onMouseEnter={() => setHoverDay(d.day)}
              onMouseLeave={() => setHoverDay(null)}
            >
              {/* Tooltip on bar hover */}
              {isHovered && (
                <div className="absolute top-0 transform -translate-y-1 bg-text text-cream text-[11px] font-mono font-bold px-2 py-0.5 rounded-md pointer-events-none z-10 shadow-sm">
                  {d.value}%
                </div>
              )}

              {/* Bar with diagonal hatch styling */}
              <div className="w-full relative flex items-end justify-center h-full">
                <div
                  className="w-full max-w-[36px] rounded-xl relative overflow-hidden transition-all duration-300"
                  style={{
                    height: `${d.value}%`,
                    backgroundColor: "rgba(180, 211, 217, 0.35)",
                    border: isHovered ? "1px solid #9B8EC7" : "1px solid rgba(155, 142, 199, 0.25)",
                  }}
                >
                  {/* Hatched overlay */}
                  <div className="absolute inset-0 bg-hatch-purple opacity-90 group-hover:opacity-100 transition-opacity" />
                  <div
                    className="absolute inset-0 bg-purple/15 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </div>

              {/* Day label */}
              <span
                className={`text-[11px] font-medium mt-2 transition-colors ${
                  isHovered ? "text-text font-bold" : "text-muted"
                }`}
              >
                {d.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
