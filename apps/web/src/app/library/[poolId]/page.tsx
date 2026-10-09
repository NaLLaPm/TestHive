"use client";

import { useParams } from "next/navigation";
import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import clsx from "clsx";
import { usePool, useGraph, usePersona } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { NetworkGraph } from "@/components/network-graph";

const CLUSTER_COLORS = [
  "#BDA6CE", // pixel lilac
  "#B4D3D9", // pixel mint
  "#9B8EC7", // pixel violet
  "#F2EAE0", // pixel cream
  "#81C995", // soft green
  "#FDD663", // soft gold
  "#F28B82", // soft coral
  "#C4B8EB", // lavender
  "#A3C9D7", // sky mint
  "#D7CCE4", // pale violet
];

function getClusterColor(clusterId: number | null | undefined): string {
  if (clusterId === null || clusterId === undefined || clusterId < 0) return "#9B8EC7";
  return CLUSTER_COLORS[Math.abs(clusterId + 10) % CLUSTER_COLORS.length] ?? "#BDA6CE";
}

export default function PoolDetailPage() {
  const { poolId } = useParams<{ poolId: string }>();
  const { data: pool } = usePool(poolId);
  const { data: graph } = useGraph(poolId);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const { data: selectedPersona, isLoading: loadingPersona } = usePersona(poolId, selectedNodeId || undefined);

  const [filterClusterId, setFilterClusterId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filtered nodes list for search and cluster filtering
  const filteredNodes = useMemo(() => {
    if (!graph?.nodes) return [];
    return graph.nodes.filter((node) => {
      if (filterClusterId !== null && node.clusterId !== filterClusterId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const occ = (node.occupation ?? "").toLowerCase();
        const dev = (node.device ?? "").toLowerCase();
        const reg = (node.region ?? "").toLowerCase();
        const age = (node.ageGroup ?? "").toLowerCase();
        const id = node.id.toLowerCase();
        if (!occ.includes(q) && !dev.includes(q) && !reg.includes(q) && !age.includes(q) && !id.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [graph?.nodes, filterClusterId, searchQuery]);

  // Stepper index across filtered nodes
  const { prevNodeId, nextNodeId, currentIndex, totalNodes } = useMemo(() => {
    if (!filteredNodes.length || !selectedNodeId) {
      return { prevNodeId: null, nextNodeId: null, currentIndex: -1, totalNodes: filteredNodes.length };
    }
    const idx = filteredNodes.findIndex((n) => n.id === selectedNodeId);
    return {
      prevNodeId: idx > 0 ? filteredNodes[idx - 1]?.id : null,
      nextNodeId: idx >= 0 && idx < filteredNodes.length - 1 ? filteredNodes[idx + 1]?.id : null,
      currentIndex: idx,
      totalNodes: filteredNodes.length,
    };
  }, [filteredNodes, selectedNodeId]);

  // Selected node snapshot from graph payload
  const selectedNode = useMemo(() => {
    if (!selectedNodeId || !graph?.nodes) return null;
    return graph.nodes.find((n) => n.id === selectedNodeId) ?? null;
  }, [selectedNodeId, graph?.nodes]);

  // Keyboard navigation: Left/Right arrows cycle through nodes
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft" && prevNodeId) {
        setSelectedNodeId(prevNodeId);
      } else if (e.key === "ArrowRight" && nextNodeId) {
        setSelectedNodeId(nextNodeId);
      } else if (e.key === "Escape") {
        if (showRosterModal) setShowRosterModal(false);
        else if (selectedNodeId) setSelectedNodeId(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [prevNodeId, nextNodeId, showRosterModal, selectedNodeId]);

  // Auto-scroll the active node pill into view in the dock
  useEffect(() => {
    if (!selectedNodeId || !scrollContainerRef.current) return;
    const activeEl = scrollContainerRef.current.querySelector(`[data-node-id="${selectedNodeId}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [selectedNodeId]);

  const handleCopyId = () => {
    if (!selectedNodeId) return;
    navigator.clipboard?.writeText(selectedNodeId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  };

  if (!pool || !graph) {
    return (
      <div className="fixed inset-0 md:left-64 flex items-center justify-center bg-[#FAF6F0] z-10">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded-full border-3 border-purple border-t-transparent animate-spin mx-auto" />
          <p className="text-muted text-sm font-medium">Loading interactive cluster environment…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 md:left-64 bg-[#FAF6F0] overflow-hidden z-20">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-30 flex flex-wrap items-center justify-between gap-2.5 pointer-events-none">
        {/* Left: Library Back & Pool Stats */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <Link
            href="/library"
            className="flex items-center gap-2 px-3.5 py-2 bg-white/95 backdrop-blur-md border border-border rounded-2xl shadow-md text-xs font-semibold text-text hover:bg-lavender/30 active:scale-95 transition"
          >
            <svg className="w-4 h-4 text-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span className="hidden sm:inline">Library</span>
          </Link>

          <div className="flex items-center gap-2 px-3.5 py-2 bg-white/95 backdrop-blur-md border border-border rounded-2xl shadow-md text-xs font-medium text-text">
            <span className="font-bold text-text truncate max-w-[110px] sm:max-w-none">{pool.slug}</span>
            <span className="text-muted">·</span>
            <span className="font-bold text-purple whitespace-nowrap">{graph.nodes.length} Personas</span>
            <span className="text-muted hidden sm:inline">·</span>
            <span className="text-muted hidden sm:inline whitespace-nowrap">{graph.clusters?.length ?? 0} Clusters</span>
          </div>
        </div>

        {/* Center / Right: Cluster Filter Pills & Full Roster View */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Quick cluster filters */}
          <div className="hidden lg:flex items-center gap-1 bg-white/95 backdrop-blur-md border border-border rounded-2xl p-1 shadow-md">
            <button
              type="button"
              onClick={() => setFilterClusterId(null)}
              className={clsx(
                "px-2.5 py-1 rounded-xl text-xs font-semibold transition",
                filterClusterId === null
                  ? "bg-purple text-cream shadow-xs"
                  : "text-muted hover:text-text hover:bg-lavender/20"
              )}
            >
              All ({graph.nodes.length})
            </button>
            {(graph.clusters ?? []).slice(0, 5).map((c) => (
              <button
                key={c.clusterId}
                type="button"
                onClick={() => setFilterClusterId(filterClusterId === c.clusterId ? null : c.clusterId)}
                className={clsx(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition",
                  filterClusterId === c.clusterId
                    ? "bg-purple text-cream shadow-xs"
                    : "text-muted hover:text-text hover:bg-lavender/20"
                )}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getClusterColor(c.clusterId) }} />
                <span>#{c.clusterId}</span>
              </button>
            ))}
          </div>

          {/* Roster Grid Toggle Button */}
          <button
            type="button"
            onClick={() => setShowRosterModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/95 backdrop-blur-md border border-border rounded-2xl shadow-md text-xs font-bold text-text hover:bg-purple hover:text-cream active:scale-95 transition"
            title="Inspect all personas in a grid view"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
            <span>All {graph.nodes.length} Personas</span>
          </button>
        </div>
      </div>

      {/* Edge-to-edge interactive force-directed canvas */}
      <div className="w-full h-full">
        <NetworkGraph
          graph={graph}
          className="rounded-none border-none w-full h-full !bg-transparent"
          title="Cluster Map"
          controlsClassName="bottom-28 left-4 sm:left-6"
          selectedNodeId={selectedNodeId}
          onNodeClick={(node) => {
            if (node?.id) {
              setSelectedNodeId(node.id);
            }
          }}
        />
      </div>

      {/* Floating Bottom Persona Dock: Inspect Every Single Node Directly */}
      <div
        className={clsx(
          "absolute bottom-4 left-4 z-20 pointer-events-none transition-all duration-300",
          selectedNodeId ? "right-4 sm:right-[440px]" : "right-4 sm:right-6"
        )}
      >
        <div className="bg-white/95 backdrop-blur-xl border border-border shadow-xl rounded-2xl p-2.5 flex flex-col gap-2 pointer-events-auto max-w-full">
          {/* Dock Header: Title, Search, and Steppers */}
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-text">
                <span className="w-2.5 h-2.5 rounded-full bg-purple animate-pulse" />
                <span>Persona Dock</span>
                <span className="text-[11px] font-normal text-muted">
                  ({filteredNodes.length})
                </span>
              </div>
            </div>

            {/* Search Input & Stepper Arrows */}
            <div className="flex items-center gap-1.5 ml-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter personas…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-28 sm:w-36 text-xs bg-panel2 border border-border rounded-xl px-2.5 py-1 text-text placeholder:text-muted/70 focus:outline-none focus:ring-1 focus:ring-purple"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1.5 text-muted hover:text-text text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Prev / Next buttons */}
              <button
                type="button"
                disabled={!prevNodeId}
                onClick={() => prevNodeId && setSelectedNodeId(prevNodeId)}
                className="p-1 rounded-xl bg-panel2 border border-border text-muted hover:text-text disabled:opacity-30 disabled:hover:text-muted transition"
                title="Previous Node (←)"
                aria-label="Previous Node"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                disabled={!nextNodeId}
                onClick={() => nextNodeId && setSelectedNodeId(nextNodeId)}
                className="p-1 rounded-xl bg-panel2 border border-border text-muted hover:text-text disabled:opacity-30 disabled:hover:text-muted transition"
                title="Next Node (→)"
                aria-label="Next Node"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Horizontally Scrollable Nodes Strip */}
          <div
            ref={scrollContainerRef}
            className="flex items-center gap-1.5 overflow-x-auto py-0.5 px-0.5 no-scrollbar scroll-smooth"
            style={{ scrollbarWidth: "none" }}
          >
            {filteredNodes.map((n, idx) => {
              const isSelected = selectedNodeId === n.id;
              const occ = (n.occupation || "Persona").replace(/_/g, " ");
              return (
                <button
                  key={n.id}
                  data-node-id={n.id}
                  type="button"
                  onClick={() => setSelectedNodeId(n.id)}
                  className={clsx(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all border select-none",
                    isSelected
                      ? "bg-purple text-cream border-purple shadow-sm font-semibold scale-102"
                      : "bg-white/90 hover:bg-lavender/30 text-text border-border"
                  )}
                  title={`Node #${idx + 1}: ${occ} (${n.ageGroup}, ${n.device})`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: getClusterColor(n.clusterId) }}
                  />
                  <span className="capitalize whitespace-nowrap">{occ}</span>
                </button>
              );
            })}

            {filteredNodes.length === 0 && (
              <div className="text-xs text-muted py-1 px-2 italic">
                No persona nodes match "{searchQuery}".
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Slide-Over Personality Panel */}
      {selectedNodeId && (
        <div className="absolute top-0 right-0 bottom-0 w-full sm:w-[420px] max-w-full bg-white/95 backdrop-blur-md border-l border-border shadow-2xl flex flex-col z-40 animate-in slide-in-from-right duration-200">
          {/* Header with index, quick navigation & close button */}
          <div className="p-5 border-b border-border flex items-center justify-between bg-panel2/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-purple font-semibold uppercase tracking-wider">
                  Persona Node
                </span>
                {currentIndex >= 0 && (
                  <span className="text-[10px] text-muted font-mono font-bold bg-white/80 px-2 py-0.5 rounded-md border border-border">
                    {currentIndex + 1} of {totalNodes}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <h2 className="text-base font-bold text-text truncate max-w-[220px] font-mono">
                  #{selectedNodeId.slice(0, 13)}
                </h2>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="text-muted hover:text-purple transition text-xs"
                  title="Copy full persona ID"
                >
                  {copiedId ? "✓" : "📋"}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={!prevNodeId}
                onClick={() => prevNodeId && setSelectedNodeId(prevNodeId)}
                className="p-1.5 rounded-xl hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent text-muted hover:text-text transition"
                title="Previous persona (←)"
                aria-label="Previous persona"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                disabled={!nextNodeId}
                onClick={() => nextNodeId && setSelectedNodeId(nextNodeId)}
                className="p-1.5 rounded-xl hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent text-muted hover:text-text transition"
                title="Next persona (→)"
                aria-label="Next persona"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>

              <div className="w-[1px] h-4 bg-border mx-1" />

              <button
                type="button"
                onClick={() => setSelectedNodeId(null)}
                className="p-1.5 rounded-xl hover:bg-black/5 text-muted hover:text-text transition"
                aria-label="Close personality panel"
                title="Close (Esc)"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {loadingPersona && !selectedPersona && !selectedNode ? (
              <div className="py-16 text-center space-y-2 text-muted">
                <div className="w-6 h-6 rounded-full border-2 border-purple border-t-transparent animate-spin mx-auto" />
                <p className="text-xs">Fetching persona personality details…</p>
              </div>
            ) : selectedPersona ? (
              <>
                {/* Identity & Cluster Header */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge kind="neutral">
                      Cluster {selectedPersona.clusterId !== null ? `#${selectedPersona.clusterId}` : "Unassigned"}
                    </Badge>
                    <Badge kind="success">
                      {selectedPersona.traits?.ageGroup || "Adult"}
                    </Badge>
                    <Badge kind="default">
                      {selectedPersona.traits?.region || "Global"}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-extrabold text-text capitalize">
                    {selectedPersona.traits?.occupation?.replace(/_/g, " ") || "Persona Actor"}
                  </h3>
                </div>

                {/* Backstory */}
                <div className="bg-[#FAF6F0] border border-border rounded-2xl p-4 space-y-1.5">
                  <div className="text-[11px] font-bold text-muted uppercase tracking-wider">
                    Backstory & Personality
                  </div>
                  <p className="text-sm text-text leading-relaxed">
                    "{selectedPersona.backstory || "No backstory assigned."}"
                  </p>
                </div>

                {/* Natural Voice */}
                {selectedPersona.voice && (
                  <div className="border border-border/80 rounded-2xl p-4 bg-white space-y-1">
                    <div className="text-[11px] font-bold text-muted uppercase tracking-wider">
                      Voice & Persona Tone
                    </div>
                    <p className="text-xs text-text italic leading-relaxed">
                      "{selectedPersona.voice}"
                    </p>
                  </div>
                )}

                {/* Behavioral & Technical Traits */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-muted uppercase tracking-wider">
                    Behavioral Attributes
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 bg-panel2 rounded-xl border border-border">
                      <div className="text-muted text-[10px] uppercase font-semibold">Tech Comfort</div>
                      <div className="font-bold text-text text-sm mt-0.5">
                        {selectedPersona.traits?.techComfort ?? "—"}/5
                      </div>
                    </div>
                    <div className="p-3 bg-panel2 rounded-xl border border-border">
                      <div className="text-muted text-[10px] uppercase font-semibold">Patience</div>
                      <div className="font-bold text-text text-sm mt-0.5">
                        {selectedPersona.traits?.patience ?? "—"}/5
                      </div>
                    </div>
                    <div className="p-3 bg-panel2 rounded-xl border border-border">
                      <div className="text-muted text-[10px] uppercase font-semibold">Goal Style</div>
                      <div className="font-bold text-text text-xs mt-0.5 capitalize">
                        {selectedPersona.traits?.goalStyle?.replace(/_/g, " ") ?? "Goal Driven"}
                      </div>
                    </div>
                    <div className="p-3 bg-panel2 rounded-xl border border-border">
                      <div className="text-muted text-[10px] uppercase font-semibold">Attention Span</div>
                      <div className="font-bold text-text text-xs mt-0.5 capitalize">
                        {selectedPersona.traits?.attentionSpan ?? "Standard"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Device & Environment Badges */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-muted uppercase tracking-wider">
                    Device & Environment
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge>{selectedPersona.traits?.device}</Badge>
                    <Badge>{selectedPersona.traits?.connection}</Badge>
                    <Badge>{selectedPersona.traits?.region}</Badge>
                    {selectedPersona.traits?.accessibility && selectedPersona.traits.accessibility !== "none" && (
                      <Badge kind="medium">{selectedPersona.traits.accessibility}</Badge>
                    )}
                  </div>
                </div>

                {/* Quirks */}
                {selectedPersona.quirks && selectedPersona.quirks.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-muted uppercase tracking-wider">
                      Specific Quirks
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPersona.quirks.map((q, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-lavender/25 text-text border border-lavender/50 rounded-full text-xs font-medium"
                        >
                          {q}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Link: Edit in Directory */}
                <div className="pt-2">
                  <Link
                    href={`/personas`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-purple text-cream font-semibold rounded-2xl hover:bg-purple/90 active:scale-[0.99] transition text-xs shadow-xs"
                  >
                    <span>Customize in Personas Directory</span>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </>
            ) : selectedNode ? (
              <>
                {/* Preliminary Node Identity while full persona details sync */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge kind="neutral">
                      Cluster {selectedNode.clusterId !== null ? `#${selectedNode.clusterId}` : "Unassigned"}
                    </Badge>
                    <Badge kind="success">{selectedNode.ageGroup || "Adult"}</Badge>
                    <Badge kind="default">{selectedNode.region || "Global"}</Badge>
                  </div>
                  <h3 className="text-lg font-extrabold text-text capitalize">
                    {selectedNode.occupation?.replace(/_/g, " ") || "Persona Actor"}
                  </h3>
                </div>

                <div className="bg-[#FAF6F0] border border-border rounded-2xl p-4 space-y-1.5">
                  <div className="text-[11px] font-bold text-muted uppercase tracking-wider">Device & Region</div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge>{selectedNode.device}</Badge>
                    <Badge>{selectedNode.region}</Badge>
                  </div>
                </div>

                {loadingPersona && (
                  <div className="flex items-center gap-2 text-xs text-muted py-2">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-purple border-t-transparent animate-spin" />
                    <span>Loading detailed backstory and quirks…</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-muted">No persona details found for this node.</p>
            )}
          </div>
        </div>
      )}

      {/* Full 50-Persona Roster Inspection Modal */}
      {showRosterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-cream rounded-3xl border border-border shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-white/80">
              <div>
                <h2 className="text-lg font-bold text-text">
                  Complete Persona Roster ({graph.nodes.length} Nodes)
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Click any persona to fly camera and inspect its personality on the graph.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRosterModal(false)}
                className="p-2 rounded-2xl hover:bg-lavender/20 text-muted hover:text-text transition"
                aria-label="Close roster modal"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Filters */}
            <div className="p-4 border-b border-border/60 bg-panel2/40 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterClusterId(null)}
                  className={clsx(
                    "px-3 py-1 rounded-xl text-xs font-semibold transition",
                    filterClusterId === null
                      ? "bg-purple text-cream shadow-xs"
                      : "bg-white text-muted hover:text-text border border-border"
                  )}
                >
                  All ({graph.nodes.length})
                </button>
                {(graph.clusters ?? []).map((c) => (
                  <button
                    key={c.clusterId}
                    type="button"
                    onClick={() => setFilterClusterId(filterClusterId === c.clusterId ? null : c.clusterId)}
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition border",
                      filterClusterId === c.clusterId
                        ? "bg-purple text-cream border-purple shadow-xs"
                        : "bg-white text-muted hover:text-text border-border"
                    )}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getClusterColor(c.clusterId) }} />
                    <span>Cluster #{c.clusterId}</span>
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Search persona role, age, device…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs bg-white border border-border rounded-xl px-3 py-1.5 text-text focus:outline-none focus:ring-1 focus:ring-purple w-56"
              />
            </div>

            {/* Modal Grid of All Nodes */}
            <div className="flex-1 overflow-y-auto p-5 grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredNodes.map((n, idx) => {
                const isSelected = selectedNodeId === n.id;
                const occ = (n.occupation || "Persona").replace(/_/g, " ");
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      setSelectedNodeId(n.id);
                      setShowRosterModal(false);
                    }}
                    className={clsx(
                      "text-left p-4 rounded-2xl border transition-all flex flex-col justify-between group",
                      isSelected
                        ? "bg-purple/10 border-purple ring-2 ring-purple shadow-sm"
                        : "bg-white/90 hover:bg-white hover:border-accent/40 border-border"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"
                          style={{
                            backgroundColor: `${getClusterColor(n.clusterId)}30`,
                            color: "#241E33",
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getClusterColor(n.clusterId) }} />
                          Cluster #{n.clusterId ?? "—"}
                        </span>
                        <span className="text-[10px] font-mono text-muted">#{idx + 1}</span>
                      </div>
                      <h4 className="font-extrabold text-sm text-text capitalize group-hover:text-purple transition-colors">
                        {occ}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-border/50 text-[11px] text-muted font-medium">
                      <span>{n.ageGroup}</span>
                      <span>·</span>
                      <span>{n.device}</span>
                      <span>·</span>
                      <span>{n.region}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
