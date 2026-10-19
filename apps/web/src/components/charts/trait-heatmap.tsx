"use client";

import { useState, useMemo } from "react";
import {
  Smartphone,
  Laptop,
  Wifi,
  Users,
  Sliders,
  Filter,
  ArrowUpDown,
  Search,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Sparkles,
  Layers,
  LayoutGrid,
  List,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Info,
} from "lucide-react";

export interface TraitCell {
  value: string | number;
  successRate: number;
  n: number;
  marginOfError?: number;
}

interface TraitHeatmapProps {
  byTrait: Record<string, TraitCell[]>;
}

type DimensionCategory = "all" | "friction" | "device" | "demographic" | "accessibility";

export function TraitHeatmap({ byTrait }: TraitHeatmapProps) {
  const [activeCategory, setActiveCategory] = useState<DimensionCategory>("all");
  const [selectedTraitKey, setSelectedTraitKey] = useState<string | "all">("all");
  const [viewMode, setViewMode] = useState<"visual" | "table">("visual");
  const [sortBy, setSortBy] = useState<"default" | "lowest" | "highest">("lowest");
  const [searchQuery, setSearchQuery] = useState("");

  const traitKeys = useMemo(() => Object.keys(byTrait || {}), [byTrait]);

  // Overall Global Average Success
  const overallAvg = useMemo(() => {
    let totalSuccess = 0;
    let totalN = 0;
    Object.values(byTrait || {}).forEach((cells) => {
      cells.forEach((c) => {
        totalSuccess += c.successRate * c.n;
        totalN += c.n;
      });
    });
    return totalN > 0 ? totalSuccess / totalN : 0.68;
  }, [byTrait]);

  // Humanize trait metadata
  function getTraitMeta(key: string) {
    const lower = key.toLowerCase();
    if (lower.includes("device")) {
      return { label: "Device & Hardware", category: "device" as const, icon: Smartphone, unit: "device" };
    }
    if (lower.includes("connection")) {
      return { label: "Network Bandwidth", category: "device" as const, icon: Wifi, unit: "network" };
    }
    if (lower.includes("age")) {
      return { label: "Age Demographics", category: "demographic" as const, icon: Users, unit: "age group" };
    }
    if (lower.includes("occupation")) {
      return { label: "Occupations", category: "demographic" as const, icon: Users, unit: "role" };
    }
    if (lower.includes("comfort") || lower.includes("tech") || lower.includes("literacy")) {
      return { label: "Digital Literacy", category: "demographic" as const, icon: Sliders, unit: "level" };
    }
    if (lower.includes("access") || lower.includes("vision") || lower.includes("motor")) {
      return { label: "Accessibility Profiles", category: "accessibility" as const, icon: Eye, unit: "profile" };
    }
    if (lower.includes("patience") || lower.includes("attention")) {
      return { label: "Attention & Patience", category: "demographic" as const, icon: Sparkles, unit: "cohort" };
    }
    return { label: key.replace(/([A-Z])/g, " $1").trim(), category: "demographic" as const, icon: Layers, unit: "cohort" };
  }

  // Flatten all cohort cells for global insights and table view
  const allCohorts = useMemo(() => {
    const list: Array<{
      traitKey: string;
      traitLabel: string;
      category: string;
      value: string | number;
      successRate: number;
      n: number;
      delta: number;
    }> = [];

    Object.entries(byTrait || {}).forEach(([tKey, cells]) => {
      const meta = getTraitMeta(tKey);
      cells.forEach((c) => {
        list.push({
          traitKey: tKey,
          traitLabel: meta.label,
          category: meta.category,
          value: c.value,
          successRate: c.successRate,
          n: c.n,
          delta: Math.round((c.successRate - overallAvg) * 100),
        });
      });
    });

    return list;
  }, [byTrait, overallAvg]);

  // Key summary telemetry
  const summaryStats = useMemo(() => {
    if (allCohorts.length === 0) return null;
    const sorted = [...allCohorts].sort((a, b) => a.successRate - b.successRate);
    const lowest = sorted[0];
    const highest = sorted[sorted.length - 1];
    const frictionCount = allCohorts.filter((c) => c.successRate < 0.5).length;
    const healthyCount = allCohorts.filter((c) => c.successRate >= 0.75).length;

    return {
      totalCohorts: allCohorts.length,
      lowest,
      highest,
      frictionCount,
      healthyCount,
    };
  }, [allCohorts]);

  // Filter traits based on category, search, and selected trait
  const filteredTraitKeys = useMemo(() => {
    return traitKeys.filter((trait) => {
      const meta = getTraitMeta(trait);
      const cells = byTrait[trait] || [];

      // Category tab filtering
      if (activeCategory === "friction") {
        const hasFriction = cells.some((c) => c.successRate < 0.5);
        if (!hasFriction) return false;
      } else if (activeCategory === "device") {
        if (meta.category !== "device") return false;
      } else if (activeCategory === "demographic") {
        if (meta.category !== "demographic") return false;
      } else if (activeCategory === "accessibility") {
        if (meta.category !== "accessibility") return false;
      }

      // Specific trait dropdown filter
      if (selectedTraitKey !== "all" && trait !== selectedTraitKey) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTrait = trait.toLowerCase().includes(q) || meta.label.toLowerCase().includes(q);
        const matchesCell = cells.some((c) => String(c.value).toLowerCase().includes(q));
        if (!matchesTrait && !matchesCell) return false;
      }

      return true;
    });
  }, [traitKeys, byTrait, activeCategory, selectedTraitKey, searchQuery]);

  // Flattened & filtered cohorts for table view
  const tableData = useMemo(() => {
    let list = allCohorts.filter((item) => {
      if (activeCategory === "friction" && item.successRate >= 0.5) return false;
      if (activeCategory === "device" && item.category !== "device") return false;
      if (activeCategory === "demographic" && item.category !== "demographic") return false;
      if (activeCategory === "accessibility" && item.category !== "accessibility") return false;
      if (selectedTraitKey !== "all" && item.traitKey !== selectedTraitKey) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesLabel = item.traitLabel.toLowerCase().includes(q);
        const matchesValue = String(item.value).toLowerCase().includes(q);
        if (!matchesLabel && !matchesValue) return false;
      }
      return true;
    });

    if (sortBy === "lowest") {
      list.sort((a, b) => a.successRate - b.successRate);
    } else if (sortBy === "highest") {
      list.sort((a, b) => b.successRate - a.successRate);
    }
    return list;
  }, [allCohorts, activeCategory, selectedTraitKey, searchQuery, sortBy]);

  if (traitKeys.length === 0) {
    return (
      <div className="p-8 rounded-3xl bg-surface-cream border border-border-warm text-center text-xs text-text-muted">
        No multi-trait telemetry recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 1. Sleek At-a-Glance Telemetry Strip */}
      {summaryStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-surface-white border border-border-warm rounded-2xl p-3.5 shadow-soft-card flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Analyzed Cohorts</div>
              <div className="text-xl font-extrabold text-text-primary mt-0.5">{summaryStats.totalCohorts}</div>
              <div className="text-[10px] text-text-tertiary">{traitKeys.length} Dimensions</div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-surface-cream border border-border-warm flex items-center justify-center text-primary">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-surface-white border border-border-warm rounded-2xl p-3.5 shadow-soft-card flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-status-error flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Critical Bottleneck
              </div>
              <div className="text-xl font-extrabold text-status-error mt-0.5">
                {Math.round(summaryStats.lowest.successRate * 100)}%
              </div>
              <div className="text-[10px] text-text-muted truncate max-w-[110px]" title={String(summaryStats.lowest.value)}>
                {formatTraitLabel(String(summaryStats.lowest.value))}
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-status-error-bg border border-status-error-border flex items-center justify-center text-status-error">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-surface-white border border-border-warm rounded-2xl p-3.5 shadow-soft-card flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-status-success flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Peak Benchmark
              </div>
              <div className="text-xl font-extrabold text-status-success mt-0.5">
                {Math.round(summaryStats.highest.successRate * 100)}%
              </div>
              <div className="text-[10px] text-text-muted truncate max-w-[110px]" title={String(summaryStats.highest.value)}>
                {formatTraitLabel(String(summaryStats.highest.value))}
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-status-success-bg border border-status-success-border flex items-center justify-center text-status-success">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-surface-white border border-border-warm rounded-2xl p-3.5 shadow-soft-card flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-honey-dark">Friction Gateways</div>
              <div className="text-xl font-extrabold text-honey-dark mt-0.5">{summaryStats.frictionCount}</div>
              <div className="text-[10px] text-text-tertiary">Cohorts &lt; 50% pass</div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-status-warning-bg border border-status-warning-border flex items-center justify-center text-honey-dark">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* 2. Sleek Controls Bar: Category Pills + View Mode + Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 rounded-2xl bg-surface-white border border-border-warm shadow-soft-card">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "all", label: "All Dimensions" },
            { id: "friction", label: "⚠️ Bottlenecks (<50%)" },
            { id: "device", label: "Devices & Tech" },
            { id: "demographic", label: "Demographics" },
            { id: "accessibility", label: "Accessibility" },
          ].map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id as DimensionCategory);
                  setSelectedTraitKey("all");
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                  isActive
                    ? "bg-primary text-surface-white shadow-xs font-bold"
                    : "bg-surface-cream text-text-muted hover:text-text-primary hover:bg-surface-white border border-border-subtle"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Right Controls: Search, Sort, View Toggle */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto justify-between sm:justify-start">
          {/* Quick Search */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cohort or trait..."
              className="w-full sm:w-44 pl-8 pr-3 py-1.5 rounded-xl bg-surface-cream border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-lavender-light shadow-2xs"
            />
          </div>

          {/* Sort Button */}
          <button
            onClick={() => {
              if (sortBy === "lowest") setSortBy("highest");
              else if (sortBy === "highest") setSortBy("default");
              else setSortBy("lowest");
            }}
            title="Sort by success rate"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-surface-cream border border-border-subtle text-xs font-semibold text-text-muted hover:text-text-primary transition shadow-2xs shrink-0"
          >
            <ArrowUpDown className="w-3 h-3" />
            <span className="hidden sm:inline">
              {sortBy === "lowest" ? "Lowest First" : sortBy === "highest" ? "Highest First" : "Default"}
            </span>
          </button>

          {/* View Mode Toggle: Grid vs Table */}
          <div className="flex items-center bg-surface-cream p-0.5 rounded-xl border border-border-subtle">
            <button
              onClick={() => setViewMode("visual")}
              className={`p-1.5 rounded-lg transition ${
                viewMode === "visual"
                  ? "bg-surface-white text-primary shadow-2xs"
                  : "text-text-muted hover:text-text-primary"
              }`}
              title="Visual Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition ${
                viewMode === "table"
                  ? "bg-surface-white text-primary shadow-2xs"
                  : "text-text-muted hover:text-text-primary"
              }`}
              title="Clean Table Matrix View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Heatmap Legend Spectrum */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-surface-cream border border-border-subtle text-[11px]">
        <span className="font-bold text-text-tertiary uppercase tracking-wider">Pass Rate Scale:</span>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium text-status-error">
            <span className="w-2.5 h-2.5 rounded-md bg-[#DC2626]" /> &lt; 35% Critical
          </span>
          <span className="flex items-center gap-1.5 font-medium text-[#D97706]">
            <span className="w-2.5 h-2.5 rounded-md bg-[#F59E0B]" /> 35–50% High Friction
          </span>
          <span className="flex items-center gap-1.5 font-medium text-[#8D6B00]">
            <span className="w-2.5 h-2.5 rounded-md bg-[#FBBF24]" /> 50–65% Moderate
          </span>
          <span className="flex items-center gap-1.5 font-medium text-[#5C52A4]">
            <span className="w-2.5 h-2.5 rounded-md bg-[#756BBF]" /> 65–80% Healthy
          </span>
          <span className="flex items-center gap-1.5 font-medium text-status-success">
            <span className="w-2.5 h-2.5 rounded-md bg-[#1C6938]" /> ≥ 80% Benchmark
          </span>
        </div>
      </div>

      {/* 4. MAIN CONTENT: Visual Masonry Columns OR Clean Table Matrix */}
      {viewMode === "visual" ? (
        <div className="columns-1 lg:columns-2 gap-4 [column-fill:_balance]">
          {filteredTraitKeys.map((trait) => {
            const meta = getTraitMeta(trait);
            const Icon = meta.icon;
            let cells = [...(byTrait[trait] || [])];

            if (sortBy === "lowest") {
              cells.sort((a, b) => a.successRate - b.successRate);
            } else if (sortBy === "highest") {
              cells.sort((a, b) => b.successRate - a.successRate);
            }

            const totalN = cells.reduce((acc, c) => acc + c.n, 0) || 1;
            const avgRate = cells.reduce((acc, c) => acc + c.successRate * c.n, 0) / totalN;
            const hasFriction = cells.some((c) => c.successRate < 0.5);
            const lowestCell = cells.length > 0 ? cells.reduce((min, c) => (c.successRate < min.successRate ? c : min), cells[0]!) : null;
            const highestCell = cells.length > 0 ? cells.reduce((max, c) => (c.successRate > max.successRate ? c : max), cells[0]!) : null;

            return (
              <div
                key={trait}
                className="bg-surface-white border border-border-warm rounded-3xl p-5 shadow-soft-card hover:border-lavender-light transition-all flex flex-col space-y-4 break-inside-avoid inline-block w-full mb-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-lavender-tint border border-border-accent-tint flex items-center justify-center text-primary shrink-0 shadow-2xs">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary leading-snug">{meta.label}</h4>
                      <p className="text-[11px] text-text-muted font-mono">
                        {cells.length} cohorts · Dimension Avg:{" "}
                        <strong className="text-text-primary font-bold">{(avgRate * 100).toFixed(0)}%</strong>
                      </p>
                    </div>
                  </div>

                  {hasFriction ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-status-error-bg text-status-error border border-status-error-border shrink-0">
                      <AlertTriangle className="w-3 h-3" /> Friction Detected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-status-success-bg text-status-success border border-status-success-border shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> Optimal Flow
                    </span>
                  )}
                </div>

                {/* Cohort Grid: 2-column subgrid for 4+ cohorts, eliminates empty space */}
                <div className={`grid gap-2.5 ${cells.length >= 4 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                  {cells.map((cell) => {
                    const style = getHeatStyle(cell.successRate);
                    const pct = Math.round(cell.successRate * 100);
                    const delta = Math.round((cell.successRate - overallAvg) * 100);

                    return (
                      <div
                        key={String(cell.value)}
                        className="group p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2 hover:shadow-xs"
                        style={{
                          backgroundColor: style.bg,
                          borderColor: style.border,
                        }}
                      >
                        {/* Top: Label + Delta */}
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-xs text-text-primary truncate block" title={String(cell.value)}>
                              {formatTraitLabel(String(cell.value))}
                            </span>
                            <span className="text-[10px] font-mono text-text-tertiary">n={cell.n}</span>
                          </div>
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                              delta > 0
                                ? "bg-status-success-bg text-status-success border border-status-success-border"
                                : delta < 0
                                ? "bg-status-error-bg text-status-error border border-status-error-border"
                                : "bg-surface-cream text-text-tertiary"
                            }`}
                          >
                            {delta > 0 ? `+${delta}%` : `${delta}%`}
                          </span>
                        </div>

                        {/* Middle: Big Metric + Pass Rate Label */}
                        <div className="flex items-baseline justify-between mt-0.5">
                          <span className="text-xl font-extrabold font-mono text-text-primary">
                            {pct}%
                          </span>
                          <span className="text-[10px] font-mono text-text-muted">pass rate</span>
                        </div>

                        {/* Bottom: Progress track */}
                        <div className="w-full h-1.5 rounded-full bg-black/5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: style.barColor,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Card Footer Summary Insight: Eliminates awkward empty space */}
                <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-[11px] text-text-muted">
                  {lowestCell && (
                    <span className="truncate">
                      Lowest:{" "}
                      <strong className="text-status-error font-mono font-bold">
                        {formatTraitLabel(String(lowestCell.value))}
                      </strong>{" "}
                      ({Math.round(lowestCell.successRate * 100)}%)
                    </span>
                  )}
                  {highestCell && (
                    <span className="truncate ml-2 text-right">
                      Peak:{" "}
                      <strong className="text-status-success font-mono font-bold">
                        {formatTraitLabel(String(highestCell.value))}
                      </strong>{" "}
                      ({Math.round(highestCell.successRate * 100)}%)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Clean Table Matrix View */
        <div className="bg-surface-white border border-border-warm rounded-3xl overflow-hidden shadow-soft-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[580px]">
              <thead>
                <tr className="bg-surface-cream border-b border-border-warm text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
                  <th className="py-3 px-4">Dimension</th>
                  <th className="py-3 px-4">Cohort Attribute</th>
                  <th className="py-3 px-4 text-center">Sample Size</th>
                  <th className="py-3 px-4 text-right">Success Rate</th>
                  <th className="py-3 px-4 text-right">Benchmark Delta</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-xs">
                {tableData.map((item, idx) => {
                  const style = getHeatStyle(item.successRate);
                  const pct = Math.round(item.successRate * 100);

                  return (
                    <tr key={`${item.traitKey}-${item.value}-${idx}`} className="hover:bg-surface-cream/50 transition">
                      <td className="py-3 px-4 font-semibold text-text-secondary">{item.traitLabel}</td>
                      <td className="py-3 px-4 font-bold text-text-primary">
                        {formatTraitLabel(String(item.value))}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-text-tertiary">n = {item.n}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-black/5 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, backgroundColor: style.barColor }}
                            />
                          </div>
                          <span className="font-extrabold font-mono text-text-primary w-9">{pct}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span
                          className={
                            item.delta > 0
                              ? "text-status-success"
                              : item.delta < 0
                              ? "text-status-error"
                              : "text-text-muted"
                          }
                        >
                          {item.delta > 0 ? `+${item.delta}%` : `${item.delta}%`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border font-mono capitalize"
                          style={{
                            backgroundColor: style.bg,
                            borderColor: style.border,
                            color: style.text,
                          }}
                        >
                          {pct < 35 ? "Critical" : pct < 50 ? "High Friction" : pct < 65 ? "Moderate" : pct < 80 ? "Healthy" : "Benchmark"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredTraitKeys.length === 0 && (
        <div className="p-8 rounded-3xl bg-surface-cream border border-border-warm text-center space-y-2">
          <p className="text-sm font-semibold text-text-primary">No matching traits found</p>
          <p className="text-xs text-text-muted">Try resetting your search query or switching category filter.</p>
          <button
            onClick={() => {
              setActiveCategory("all");
              setSelectedTraitKey("all");
              setSearchQuery("");
            }}
            className="mt-2 px-4 py-1.5 rounded-xl bg-primary text-surface-white text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}

// Format raw string identifiers into clean title-cased labels
function formatTraitLabel(val: string): string {
  if (val === "low-end android") return "Low-End Android";
  if (val === "mid android") return "Mid Android";
  if (val === "iphone") return "iPhone / iOS";
  if (val === "laptop") return "Laptop / PC";
  if (val === "tablet") return "Tablet";
  if (val === "broadband") return "Fiber / WiFi";
  if (val === "3g") return "3G Cellular";
  if (val === "4g") return "4G / LTE";
  if (val === "none") return "Standard / None";
  if (val === "low_vision") return "Low Vision";
  if (val === "screen_reader") return "Screen Reader";
  if (val === "color_blind") return "Color Blind";
  if (val === "motor") return "Motor Impairment";
  return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Calibrated pastel palette from Stitch UI Design System
function getHeatStyle(rate: number): { bg: string; border: string; text: string; barColor: string } {
  if (rate < 0.35) {
    return {
      bg: "#FEF2F2",
      border: "#FECACA",
      text: "#DC2626",
      barColor: "#DC2626",
    };
  }
  if (rate < 0.5) {
    return {
      bg: "#FFFBEB",
      border: "#FDE68A",
      text: "#D97706",
      barColor: "#F59E0B",
    };
  }
  if (rate < 0.65) {
    return {
      bg: "#FDF6E2",
      border: "#F3E3B6",
      text: "#8D6B00",
      barColor: "#FBBF24",
    };
  }
  if (rate < 0.8) {
    return {
      bg: "#EDEBF9",
      border: "#C9C4D3",
      text: "#5C52A4",
      barColor: "#756BBF",
    };
  }
  return {
    bg: "#E8F5E9",
    border: "#A5D6A7",
    text: "#1C6938",
    barColor: "#1C6938",
  };
}
