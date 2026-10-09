"use client";

import { useState } from "react";
import { ReportsHatchedChart } from "./reports-hatched-chart";
import { CustomersHoneycomb } from "./customers-honeycomb";
import { OrderStatusCard } from "./order-status-card";
import { OccupationChart } from "./occupation-chart";
import { WeeklySummaryChart } from "./weekly-summary-chart";

interface OverviewViewProps {
  onNavigateTab?: (tab: string) => void;
  liveStats?: {
    totalPersonas?: number;
    passRate?: number;
    activeRuns?: number;
    issuesCount?: number;
  };
}

export function OverviewView({ onNavigateTab, liveStats }: OverviewViewProps) {
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [locationOpen, setLocationOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("Sunday, 3 May 2026");
  const [dateOpen, setDateOpen] = useState(false);
  const [useLiveNumbers, setUseLiveNumbers] = useState(false);

  const locations = ["All Locations", "Madrid", "Barcelona", "Seville", "Valencia"];
  const dates = ["Sunday, 3 May 2026", "Last 7 Days", "Last 30 Days", "This Quarter"];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Top Header Row: Title & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
            Overview
          </h1>
        </div>

        {/* Filter Dropdowns on the right */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Location Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setLocationOpen((v) => !v);
                setDateOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 border border-purple/25 text-xs font-semibold text-text shadow-xs hover:bg-cream/60 transition"
            >
              <svg className="w-3.5 h-3.5 text-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{selectedLocation === "All Locations" ? "Filter Location" : selectedLocation}</span>
              <svg className="w-3 h-3 text-muted ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {locationOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white border border-purple/20 rounded-2xl shadow-xl z-30 py-1.5">
                {locations.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => {
                      setSelectedLocation(loc);
                      setLocationOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs transition ${
                      selectedLocation === loc ? "font-bold text-purple bg-lavender/20" : "text-text hover:bg-cream"
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setDateOpen((v) => !v);
                setLocationOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 border border-purple/25 text-xs font-semibold text-text shadow-xs hover:bg-cream/60 transition"
            >
              <svg className="w-3.5 h-3.5 text-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
              <span>{selectedDate === "Sunday, 3 May 2026" ? "Filter Date" : selectedDate}</span>
              <svg className="w-3 h-3 text-muted ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {dateOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white border border-purple/20 rounded-2xl shadow-xl z-30 py-1.5">
                {dates.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setSelectedDate(d);
                      setDateOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs transition ${
                      selectedDate === d ? "font-bold text-purple bg-lavender/20" : "text-text hover:bg-cream"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Optional Live Engine Toggle */}
          <button
            type="button"
            onClick={() => setUseLiveNumbers((v) => !v)}
            title="Toggle between Reference Mock and Live TestHive Metrics"
            className={`px-3 py-2 rounded-full text-[11px] font-bold border transition ${
              useLiveNumbers
                ? "bg-purple text-cream border-purple"
                : "bg-white/60 text-muted border-purple/20 hover:text-text"
            }`}
          >
            {useLiveNumbers ? "● Live TestHive Data" : "○ Reference Mock"}
          </button>
        </div>
      </div>

      {/* Top 4 Metrics Row */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-purple/20 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:divide-x lg:divide-purple/15">
          {/* Metric 1: Earnings /day */}
          <div className="lg:px-4 first:lg:pl-0 flex flex-col justify-between">
            <span className="text-xs font-medium text-muted block mb-1">
              {useLiveNumbers ? "Efficacy Pass Rate" : "Earnings /day"}
            </span>
            <div className="flex items-center gap-2.5 my-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
                {useLiveNumbers ? `${liveStats?.passRate ?? 86.4}%` : "$12,368"}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cream border border-purple/20 text-[11px] font-mono font-bold text-muted">
                00
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <span>▲</span>
              <span>+4.2%</span>
            </div>
          </div>

          {/* Metric 2: Assessment */}
          <div className="lg:px-6 flex flex-col justify-between">
            <span className="text-xs font-medium text-muted block mb-1">
              {useLiveNumbers ? "Personas Evaluated" : "Assessment"}
            </span>
            <div className="flex items-center gap-2.5 my-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
                {useLiveNumbers ? (liveStats?.totalPersonas ?? 1000).toLocaleString() : "45"}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-lavender/30 border border-lavender/60 text-[11px] font-bold text-purple">
                4.8
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <span>▲</span>
              <span>+4.2%</span>
            </div>
          </div>

          {/* Metric 3: Orders */}
          <div className="lg:px-6 flex flex-col justify-between">
            <span className="text-xs font-medium text-muted block mb-1">
              {useLiveNumbers ? "Active Test Runs" : "Orders"}
            </span>
            <div className="flex items-center gap-2.5 my-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
                {useLiveNumbers ? `${liveStats?.activeRuns ?? 14}` : "138"}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan/30 border border-cyan/60 text-[11px] font-bold text-text">
                40 Open
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <span>▲</span>
              <span>+4.2%</span>
            </div>
          </div>

          {/* Metric 4: Connection */}
          <div className="lg:px-6 flex flex-col justify-between">
            <span className="text-xs font-medium text-muted block mb-1">
              {useLiveNumbers ? "Friction Bottlenecks" : "Connection"}
            </span>
            <div className="flex items-center gap-2.5 my-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
                {useLiveNumbers ? `${liveStats?.issuesCount ?? 23}` : "56"}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan/30 border border-cyan/60 text-[11px] font-bold text-text">
                20 Active
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <span>▲</span>
              <span>+4.2%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Middle Row: Reports (Wide) + Customers (Honeycomb) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8">
          <ReportsHatchedChart />
        </div>
        <div className="lg:col-span-4">
          <CustomersHoneycomb onInspect={() => onNavigateTab?.("analytics")} />
        </div>
      </section>

      {/* Bottom Row: 3 Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <div>
          <OrderStatusCard onAction={() => onNavigateTab?.("launchpad")} />
        </div>
        <div>
          <OccupationChart />
        </div>
        <div>
          <WeeklySummaryChart />
        </div>
      </section>
    </div>
  );
}
