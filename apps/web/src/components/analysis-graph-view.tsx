"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnalysisGraph, AnalysisGraphNode } from "@testhive/contracts";
import { Badge } from "@/components/ui/badge";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

const KIND_COLORS: Record<string, string> = {
  cluster: "#BDA6CE", // Pixel lilac
  issue: "#F28B82", // Pixel soft coral
  funnel: "#9B8EC7", // Pixel violet
  persona: "#81C995", // Soft green
};

export function AnalysisGraphView({
  graph,
  height = 540,
  title = "Run Causal Analysis Graph",
  className = "",
}: {
  graph: any;
  height?: number;
  title?: string;
  className?: string;
}) {
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height });
  const [selectedNode, setSelectedNode] = useState<AnalysisGraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<AnalysisGraphNode | null>(null);
  const [filterKind, setFilterKind] = useState<"all" | "cluster" | "issue" | "funnel" | "persona">("all");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ponytail: ResizeObserver automatically handles responsive sizing without polling
  useEffect(() => {
    if (isFullscreen) {
      const update = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
      update();
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }

    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height: observedHeight } = entry.contentRect;
        if (width > 0) {
          setDimensions({
            width: Math.floor(width),
            height: Math.floor(observedHeight > 0 ? observedHeight : height),
          });
        }
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [isFullscreen, height]);

  // Handle ESC for fullscreen exit
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  // Prepare filtered nodes and active links
  const graphData = useMemo(() => {
    const rawNodes = graph.nodes || [];
    const rawEdges = graph.edges || [];

    const nodes = rawNodes.map((n: AnalysisGraphNode) => ({
      ...n,
      color: n.color || KIND_COLORS[n.kind] || "#9B8EC7",
    }));

    const nodeIds = new Set(nodes.map((n: AnalysisGraphNode) => n.id));
    const links = rawEdges
      .filter((e: any) => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map((e: any) => ({
        source: e.source,
        target: e.target,
        kind: e.kind,
        weight: e.weight,
        label: e.label,
      }));

    return { nodes, links };
  }, [graph]);

  // Map adjacent nodes for interactive highlight
  const neighborsMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    graphData.links.forEach((link: any) => {
      const s = typeof link.source === "object" ? link.source.id : link.source;
      const t = typeof link.target === "object" ? link.target.id : link.target;
      if (!map.has(s)) map.set(s, new Set());
      if (!map.has(t)) map.set(t, new Set());
      map.get(s)!.add(t);
      map.get(t)!.add(s);
    });
    return map;
  }, [graphData.links]);

  // Adjust d3 physics layout
  useEffect(() => {
    if (fgRef.current) {
      const charge = fgRef.current.d3Force?.("charge");
      if (charge) {
        charge.strength(-320);
        charge.distanceMax?.(700);
      }
      const link = fgRef.current.d3Force?.("link");
      if (link) {
        link.distance(110);
        link.strength?.(0.22);
      }
      fgRef.current.d3ReheatSimulation?.();
    }
  }, [graphData]);

  // Center on node if selected
  const handleSelectNode = useCallback((node: any) => {
    const original = graph.nodes?.find((n: any) => n.id === node?.id) || null;
    setSelectedNode(original);
    if (node && fgRef.current && node.x !== undefined && node.y !== undefined) {
      fgRef.current.centerAt(node.x, node.y, 500);
      const curZoom = fgRef.current.zoom?.() || 1;
      if (curZoom < 1.8) fgRef.current.zoom?.(2.0, 500);
    }
  }, [graph.nodes]);

  // Canvas node rendering
  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;
      const activeId = hoveredNode?.id || selectedNode?.id;
      const hasActive = Boolean(activeId);
      const isConnected = isHovered || isSelected || (activeId && neighborsMap.get(activeId)?.has(node.id));

      const matchesFilter = filterKind === "all" || node.kind === filterKind;
      const baseColor = node.color || KIND_COLORS[node.kind] || "#9B8EC7";

      let r = Math.max(5, (node.val || 5) * (1.2 / Math.max(0.5, Math.sqrt(globalScale || 1))));
      if (isHovered) r *= 1.4;
      if (isSelected) r *= 1.6;

      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);

      if (!matchesFilter || (hasActive && !isConnected)) {
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.restore();
        return;
      }

      ctx.fillStyle = baseColor;
      ctx.fill();

      // Halo for selection
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 4 / globalScale, 0, 2 * Math.PI, false);
        ctx.strokeStyle = "#9B8EC7";
        ctx.lineWidth = 3 / globalScale;
        ctx.stroke();
      }

      // Border ring
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 1.5 / globalScale;
      ctx.stroke();

      // Text label when zoomed in or hovered/selected
      const shouldDrawLabel = isSelected || isHovered || globalScale > 1.2 || node.kind === "funnel";
      if (shouldDrawLabel) {
        const label = node.label || node.id;
        const fontSize = Math.max(10, Math.min(14, 12 / globalScale));
        ctx.font = `${isSelected ? "bold" : "normal"} ${fontSize}px sans-serif`;
        ctx.fillStyle = "#241E33";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(label, node.x, node.y + r + 3 / globalScale);
      }

      ctx.restore();
    },
    [selectedNode, hoveredNode, neighborsMap, filterKind]
  );

  return (
    <div
      ref={containerRef}
      className={`relative bg-white border border-border rounded-3xl overflow-hidden shadow-xs ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""
      } ${className}`}
    >
      {/* Top Header & Metrics Bar */}
      <div className="p-4 sm:p-5 border-b border-border flex flex-wrap items-center justify-between gap-4 bg-white/90 backdrop-blur-sm relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-text text-sm sm:text-base">{title}</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple/15 text-purple font-mono font-bold">
              SYNTHESIZED
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">{graph.summary}</p>
        </div>

        {/* Quick Summary Badges */}
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <span className="px-2.5 py-1 rounded-xl bg-panel2 border border-border font-medium text-text">
            <strong>{graph.metrics.totalNodes}</strong> nodes
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-panel2 border border-border font-medium text-text">
            <strong>{graph.metrics.totalEdges}</strong> causal links
          </span>
          {graph.metrics.topBottleneck && (
            <span className="px-2.5 py-1 rounded-xl bg-danger/10 text-danger border border-danger/20 font-medium">
              ⚠️ Bottleneck: {graph.metrics.topBottleneck}
            </span>
          )}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="px-2.5 py-1 rounded-xl bg-white border border-border hover:border-purple text-muted hover:text-text text-xs transition"
          >
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen ⛶"}
          </button>
        </div>
      </div>

      {/* Filter Category Toolbar */}
      <div className="px-4 py-2 border-b border-border/80 bg-panel2/40 flex items-center gap-1.5 overflow-x-auto text-xs">
        <span className="text-[11px] font-semibold text-muted uppercase tracking-wider mr-1">
          Filter:
        </span>
        {[
          { id: "all", label: "All Nodes" },
          { id: "cluster", label: "🟣 Cohorts", color: "#BDA6CE" },
          { id: "issue", label: "🔴 UX Frictions", color: "#F28B82" },
          { id: "funnel", label: "🔵 Funnel Steps", color: "#9B8EC7" },
          { id: "persona", label: "🟢 Tested Agents", color: "#81C995" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterKind(f.id as any)}
            className={`px-3 py-1 rounded-full font-medium transition ${
              filterKind === f.id
                ? "bg-purple text-cream font-bold shadow-2xs"
                : "bg-white border border-border text-muted hover:text-text"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 2D Force Graph Container */}
      <div className="relative w-full" style={{ height: dimensions.height }}>
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="#F2EAE0"
          nodeCanvasObject={nodeCanvasObject}
          nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, Math.max(9, (node.val || 5) * 1.5), 0, 2 * Math.PI, false);
            ctx.fill();
          }}
          linkColor={(link: any) => {
            if (link.kind === "caused_drop_off") return "rgba(242, 139, 130, 0.65)";
            if (link.kind === "experienced_friction") return "rgba(253, 214, 99, 0.6)";
            if (link.kind === "funnel_flow") return "rgba(155, 142, 199, 0.75)";
            return "rgba(189, 166, 206, 0.4)";
          }}
          linkWidth={(link: any) => Math.max(1.2, (link.weight || 0.5) * 2.5)}
          linkDirectionalArrowLength={4.5}
          linkDirectionalArrowRelPos={0.9}
          linkCurvature={0.12}
          onNodeClick={handleSelectNode}
          onNodeHover={(node: any) => setHoveredNode(node ? graph.nodes?.find((n: any) => n.id === node.id) || null : null)}
          cooldownTicks={120}
          d3VelocityDecay={0.4}
        />

        {/* Floating Controls Overlay */}
        <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-border rounded-2xl p-1.5 shadow-sm">
          <button
            onClick={() => fgRef.current?.zoom?.((fgRef.current?.zoom() || 1) * 1.3, 400)}
            className="w-8 h-8 rounded-xl bg-panel2 hover:bg-white text-text font-bold text-sm flex items-center justify-center transition border border-border/60"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => fgRef.current?.zoom?.((fgRef.current?.zoom() || 1) * 0.75, 400)}
            className="w-8 h-8 rounded-xl bg-panel2 hover:bg-white text-text font-bold text-sm flex items-center justify-center transition border border-border/60"
            title="Zoom Out"
          >
            -
          </button>
          <button
            onClick={() => {
              fgRef.current?.zoomToFit?.(400, 40);
              setSelectedNode(null);
            }}
            className="px-2.5 h-8 rounded-xl bg-panel2 hover:bg-white text-text font-semibold text-xs flex items-center justify-center transition border border-border/60"
            title="Fit to Screen"
          >
            Reset
          </button>
        </div>

        {/* Interactive Node Slide-Out Inspector Drawer */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-80 sm:w-96 bg-white/95 backdrop-blur-md border border-border rounded-3xl p-5 shadow-lg space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: selectedNode.color || KIND_COLORS[selectedNode.kind] }}
                  />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    {selectedNode.kind}
                  </span>
                  {selectedNode.severity && (
                    <Badge kind={selectedNode.severity}>{selectedNode.severity}</Badge>
                  )}
                </div>
                <h4 className="font-bold text-text text-base leading-snug">{selectedNode.label}</h4>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="w-7 h-7 rounded-full bg-panel2 text-muted hover:text-text flex items-center justify-center text-xs transition"
              >
                ✕
              </button>
            </div>

            {selectedNode.description && (
              <p className="text-xs text-muted leading-relaxed bg-panel2/60 p-3 rounded-2xl border border-border/60">
                {selectedNode.description}
              </p>
            )}

            {selectedNode.suggestedFix && (
              <div className="text-xs bg-purple/10 text-purple border border-purple/20 p-3 rounded-2xl space-y-1">
                <span className="font-bold flex items-center gap-1">💡 Prescribed Fix</span>
                <p className="text-text leading-relaxed">{selectedNode.suggestedFix}</p>
              </div>
            )}

            {selectedNode.metrics && Object.keys(selectedNode.metrics).length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-border/80">
                <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                  Telemetry Metrics
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(selectedNode.metrics).map(([k, v]) => (
                    <div key={k} className="p-2 rounded-xl bg-panel2 border border-border/60">
                      <div className="text-[10px] text-muted capitalize">{k}</div>
                      <div className="font-bold text-text mt-0.5">{String(v)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
