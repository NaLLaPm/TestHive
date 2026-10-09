"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GraphPayload } from "@testhive/contracts";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

// Pixel OS Material You Harmonized Palette
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

export interface NodeState {
  id: string;
  status: string;
  outcome: string | null;
}

export function NetworkGraph({
  graph,
  nodeStates,
  height,
  fullscreen: controlledFullscreen,
  onFullscreenChange,
  title = "Cluster Map",
  className = "",
  onNodeClick,
  selectedNodeId,
  showControls = true,
  controlsClassName,
}: {
  graph: GraphPayload;
  nodeStates?: Map<string, NodeState>;
  height?: number;
  fullscreen?: boolean;
  onFullscreenChange?: (fullscreen: boolean) => void;
  title?: string;
  className?: string;
  onNodeClick?: (node: any) => void;
  selectedNodeId?: string | null;
  showControls?: boolean;
  controlsClassName?: string;
}) {
  const fgRef = useRef<any>(null);
  const [internalFullscreen, setInternalFullscreen] = useState(false);
  const isFullscreen = controlledFullscreen !== undefined ? controlledFullscreen : internalFullscreen;

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: height || 480 });
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [selectedClusterFilter, setSelectedClusterFilter] = useState<number | null>(null);

  const setFullscreen = (value: boolean) => {
    if (controlledFullscreen === undefined) {
      setInternalFullscreen(value);
    }
    onFullscreenChange?.(value);
  };

  useEffect(() => {
    if (isFullscreen) {
      const updateSize = () => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };
      updateSize();
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }

    if (!containerRef.current) return;

    // ponytail: ResizeObserver automatically handles responsive flex/grid and container size changes
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height: observedHeight } = entry.contentRect;
        if (width > 0) {
          setDimensions({
            width: Math.floor(width),
            height: Math.floor(observedHeight > 0 ? observedHeight : (containerRef.current?.clientHeight || height || 480)),
          });
        }
      }
    });

    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [isFullscreen, height]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFullscreen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen]);

  const pinnedPositionsRef = useRef<Map<string, { fx: number; fy: number }>>(new Map());

  const data = useMemo(() => {
    const nodes = graph.nodes.map((n) => {
      const pinned = pinnedPositionsRef.current.get(n.id);
      return {
        ...n,
        id: n.id,
        clusterId: n.clusterId ?? -1,
        ...(pinned ? { fx: pinned.fx, fy: pinned.fy, x: pinned.fx, y: pinned.fy } : {}),
      };
    });

    // Prune edge hairball: keep high-weight similarity edges (top 3 per node) so clusters
    // form clear, airy constellations without collapsing into an impenetrable congested knot.
    const simEdges = (graph.edges || []).filter((e) => e.kind === "similarity");
    const sortedEdges = [...simEdges].sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));
    const selectedEdges: typeof graph.edges = [];
    const countPerNode = new Map<string, number>();

    for (const e of sortedEdges) {
      const cSource = countPerNode.get(e.sourceId) ?? 0;
      const cTarget = countPerNode.get(e.targetId) ?? 0;
      if (cSource < 3 || cTarget < 3) {
        selectedEdges.push(e);
        countPerNode.set(e.sourceId, cSource + 1);
        countPerNode.set(e.targetId, cTarget + 1);
      }
    }

    const links = selectedEdges.map((e) => ({
      source: e.sourceId,
      target: e.targetId,
      kind: e.kind,
      weight: e.weight,
    }));
    return { nodes, links };
  }, [graph]);

  // Map adjacent nodes for interactive network highlight
  const neighborsMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    data.links.forEach((link: any) => {
      const s = typeof link.source === "object" ? link.source.id : link.source;
      const t = typeof link.target === "object" ? link.target.id : link.target;
      if (!map.has(s)) map.set(s, new Set());
      if (!map.has(t)) map.set(t, new Set());
      map.get(s)!.add(t);
      map.get(t)!.add(s);
    });
    return map;
  }, [data.links]);

  // Adjust d3 physics layout: wide spacing, comfortable spring length, strong repulsion
  useEffect(() => {
    if (fgRef.current) {
      const charge = fgRef.current.d3Force?.("charge");
      if (charge) {
        charge.strength(-260);
        charge.distanceMax?.(600);
      }
      const link = fgRef.current.d3Force?.("link");
      if (link) {
        link.distance(95);
        link.strength?.(0.18);
      }
      fgRef.current.d3ReheatSimulation?.();
    }
  }, [data]);

  // Center on node if selectedNodeId changes externally
  useEffect(() => {
    if (!selectedNodeId || !fgRef.current) return;
    const targetNode = data.nodes.find((n) => n.id === selectedNodeId) as any;
    if (targetNode && targetNode.x !== undefined && targetNode.y !== undefined) {
      fgRef.current.centerAt(targetNode.x, targetNode.y, 600);
      const zoom = fgRef.current.zoom?.() || 1;
      if (zoom < 1.8) {
        fgRef.current.zoom?.(2.2, 600);
      }
    }
  }, [selectedNodeId, data.nodes]);

  // Custom node drawing: scale-adaptive, crisp rings, selection pulses, hover indicators
  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const isSelected = selectedNodeId === node.id;
      const isHovered = hoveredNode?.id === node.id;
      const activeId = hoveredNode?.id || selectedNodeId;
      const hasActive = Boolean(activeId);
      const isConnected = isHovered || isSelected || (activeId && neighborsMap.get(activeId)?.has(node.id));

      const matchesFilter = selectedClusterFilter === null || node.clusterId === selectedClusterFilter;

      // Base color from state or cluster
      const state = nodeStates?.get(node.id);
      let color = "#BDA6CE";
      if (state?.outcome === "success") color = "#81C995";
      else if (state?.outcome === "failure") color = "#F28B82";
      else if (state?.outcome === "partial") color = "#FDD663";
      else if (state?.status === "running") color = "#B4D3D9";
      else {
        const idx = Math.abs((node.clusterId ?? 0) + 10) % CLUSTER_COLORS.length;
        color = CLUSTER_COLORS[idx] ?? "#BDA6CE";
      }

      // Adaptive scale: ensure nodes are clearly visible regardless of zoom level
      const scaleFactor = Math.max(0.3, Math.sqrt(globalScale || 1));
      let r = Math.max(3.8, 4.8 / scaleFactor);

      if (isHovered) r *= 1.5;
      if (isSelected) r *= 1.7;

      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);

      if (!matchesFilter || (hasActive && !isConnected)) {
        // Dim nodes outside active cluster or connection
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
        return;
      }

      ctx.fillStyle = color;
      ctx.fill();

      // Distinct border styling
      if (isSelected) {
        // Glowing halo for selected node
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 4 / globalScale, 0, 2 * Math.PI, false);
        ctx.strokeStyle = "#9B8EC7";
        ctx.lineWidth = 2.5 / globalScale;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
        ctx.strokeStyle = "#FAF6F0";
        ctx.lineWidth = 1.8 / globalScale;
        ctx.stroke();
      } else if (isHovered) {
        // High contrast ring on hover
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 2.5 / globalScale, 0, 2 * Math.PI, false);
        ctx.strokeStyle = "#241E33";
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.5 / globalScale;
        ctx.stroke();
      } else if (isConnected && hasActive) {
        // Highlight connected neighbor
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 1.5 / globalScale, 0, 2 * Math.PI, false);
        ctx.strokeStyle = "#9B8EC7";
        ctx.lineWidth = 1.5 / globalScale;
        ctx.stroke();
      } else {
        // Standard crisp white edge
        ctx.strokeStyle = "#FAF6F0";
        ctx.lineWidth = 1 / globalScale;
        ctx.stroke();
      }

      ctx.restore();
    },
    [selectedNodeId, hoveredNode, nodeStates, neighborsMap, selectedClusterFilter]
  );

  // High precision hit area: comfortable click target without expanding into adjacent canvas space
  const nodePointerAreaPaint = useCallback(
    (node: any, color: string, ctx: CanvasRenderingContext2D, globalScale: number) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      const scaleFactor = Math.max(0.3, Math.sqrt(globalScale || 1));
      const visualR = Math.max(3.8, 4.8 / scaleFactor);
      // Confine click radius to visual size + comfortable 3px margin so empty canvas space can be clicked to pan
      const hitR = Math.max(visualR + 3, 7);
      ctx.arc(node.x, node.y, hitR, 0, 2 * Math.PI, false);
      ctx.fill();
    },
    []
  );

  // Link color and width based on interaction: airy and subtle at rest, vibrant on hover/selection
  const linkColor = useCallback(
    (link: any) => {
      const activeId = hoveredNode?.id || selectedNodeId;
      if (!activeId) return "rgba(155, 142, 199, 0.12)";

      const s = typeof link.source === "object" ? link.source.id : link.source;
      const t = typeof link.target === "object" ? link.target.id : link.target;
      if (s === activeId || t === activeId) {
        return "rgba(155, 142, 199, 0.85)";
      }
      return "rgba(155, 142, 199, 0.04)";
    },
    [hoveredNode, selectedNodeId]
  );

  const linkWidth = useCallback(
    (link: any) => {
      const activeId = hoveredNode?.id || selectedNodeId;
      if (!activeId) return 1;

      const s = typeof link.source === "object" ? link.source.id : link.source;
      const t = typeof link.target === "object" ? link.target.id : link.target;
      return s === activeId || t === activeId ? 2 : 0.6;
    },
    [hoveredNode, selectedNodeId]
  );

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-[#FAF6F0] select-none transition-all ${
        isFullscreen
          ? "fixed inset-0 z-50 flex flex-col w-screen h-screen bg-[#FAF6F0]"
          : `rounded-2xl border border-border w-full ${className}`
      }`}
      style={isFullscreen ? undefined : height ? { height } : undefined}
    >
      <div className="flex-1 w-full h-full relative">
        <ForceGraph2D
          ref={fgRef}
          graphData={data}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="#FAF6F0"
          nodeRelSize={5}
          linkHoverPrecision={0}
          linkPointerAreaPaint={() => {}}
          nodeCanvasObjectMode={() => "replace"}
          nodeCanvasObject={nodeCanvasObject}
          nodePointerAreaPaint={nodePointerAreaPaint}
          linkColor={linkColor}
          linkWidth={linkWidth}
          cooldownTicks={120}
          d3VelocityDecay={0.5}
          onNodeDrag={(node: any) => {
            // Keep node pinned at current pointer position
            if (node && node.x !== undefined && node.y !== undefined) {
              node.fx = node.x;
              node.fy = node.y;
            }
            if (fgRef.current) {
              // Gentle alpha target (0.08) prevents kinetic explosions and orbital loops while keeping springs responsive
              fgRef.current.d3AlphaTarget?.(0.08);
            }
          }}
          onNodeDragEnd={(node: any) => {
            // Pin node permanently to its dragged coordinates so moving a node never resets its position
            if (node && node.x !== undefined && node.y !== undefined) {
              node.fx = node.x;
              node.fy = node.y;
              if (node.id) {
                pinnedPositionsRef.current.set(node.id, { fx: node.x, fy: node.y });
              }
            }
            if (fgRef.current) {
              // Reset alpha target to 0 so the simulation quickly and smoothly cools to rest without violent reheat
              fgRef.current.d3AlphaTarget?.(0);
            }
          }}
          onNodeClick={(node) => {
            if (node && fgRef.current && node.x !== undefined && node.y !== undefined) {
              fgRef.current.centerAt(node.x, node.y, 500);
              const currentZoom = fgRef.current.zoom?.() || 1;
              if (currentZoom < 1.8) {
                fgRef.current.zoom?.(2.2, 500);
              }
            }
            onNodeClick?.(node);
          }}
          onNodeHover={(node) => {
            setHoveredNode(node || null);
            if (typeof document !== "undefined") {
              const canvas = containerRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
              if (canvas) {
                canvas.style.cursor = node ? "pointer" : "grab";
              }
            }
          }}
          nodeLabel={(node: any) => {
            const occ = (node.occupation || "Persona Actor").replace(/_/g, " ");
            const clusterStr =
              node.clusterId !== null && node.clusterId !== undefined && node.clusterId >= 0
                ? `Cluster #${node.clusterId}`
                : "Unassigned";
            return `
              <div style="background: rgba(255, 255, 255, 0.98); color: #241E33; padding: 10px 14px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06); border: 1.5px solid #BDA6CE; font-family: system-ui, -apple-system, sans-serif; font-size: 11px; line-height: 1.4; pointer-events: none; min-width: 180px; max-width: 250px;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 5px;">
                  <span style="font-weight: 700; color: #9B8EC7; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">${clusterStr}</span>
                  <span style="background: #F2EAE0; padding: 2px 7px; border-radius: 9999px; font-size: 10px; font-weight: 600; color: #241E33;">${node.ageGroup || "Adult"}</span>
                </div>
                <div style="font-weight: 800; font-size: 13px; color: #241E33; text-transform: capitalize; margin-bottom: 4px;">${occ}</div>
                <div style="display: flex; gap: 6px; font-size: 10px; color: #555; flex-wrap: wrap;">
                  <span>📱 ${node.device || "device"}</span>
                  <span>📍 ${node.region || "region"}</span>
                </div>
                <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed rgba(189, 166, 206, 0.5); font-size: 9px; color: #9B8EC7; font-weight: 700; text-align: center;">
                  ✦ Click node to inspect personality
                </div>
              </div>
            `;
          }}
        />

        {/* Floating Zoom & Canvas Controls */}
        {showControls && (
          <div className={`absolute flex items-center gap-2 z-10 ${controlsClassName || "bottom-6 left-6"}`}>
            <div className="flex items-center bg-white/90 backdrop-blur-md border border-border rounded-2xl p-1 shadow-md">
              <button
                type="button"
                onClick={() => {
                  if (fgRef.current) {
                    const currentZoom = fgRef.current.zoom?.() || 1;
                    fgRef.current.zoom?.(currentZoom * 1.4, 400);
                  }
                }}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-text hover:bg-lavender/30 active:scale-95 transition"
                title="Zoom In"
                aria-label="Zoom In"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (fgRef.current) {
                    const currentZoom = fgRef.current.zoom?.() || 1;
                    fgRef.current.zoom?.(currentZoom / 1.4, 400);
                  }
                }}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-text hover:bg-lavender/30 active:scale-95 transition"
                title="Zoom Out"
                aria-label="Zoom Out"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <div className="w-[1px] h-5 bg-border mx-1" />
              <button
                type="button"
                onClick={() => {
                  if (fgRef.current) {
                    fgRef.current.zoomToFit?.(500, 40);
                  }
                }}
                className="px-2.5 h-8 flex items-center gap-1.5 rounded-xl text-xs font-semibold text-text hover:bg-lavender/30 active:scale-95 transition"
                title="Fit to Screen"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
                <span>Fit</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
