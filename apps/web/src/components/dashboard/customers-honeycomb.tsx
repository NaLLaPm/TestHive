"use client";

import { useState } from "react";
import Link from "next/link";

interface HexNode {
  id: string;
  q: number; // axial coords
  r: number;
  region: "madrid" | "barcelona" | "seville" | "inactive";
  label?: string;
  users?: number;
}

export function CustomersHoneycomb({
  onInspect,
}: {
  onInspect?: () => void;
}) {
  const [activeHex, setActiveHex] = useState<HexNode | null>(null);

  // Generate honeycomb axial coordinates in concentric rings (radius 3)
  const hexRadius = 14; // outer radius of each hexagon
  const spacingX = Math.sqrt(3) * hexRadius;
  const spacingY = 1.5 * hexRadius;

  const hexes: HexNode[] = [];
  const R = 3; // rings

  for (let q = -R; q <= R; q++) {
    const r1 = Math.max(-R, -q - R);
    const r2 = Math.min(R, -q + R);
    for (let r = r1; r <= r2; r++) {
      const dist = Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
      let region: HexNode["region"] = "inactive";

      if (dist === 0) {
        region = "madrid";
      } else if (dist === 1) {
        region = q >= 0 ? "madrid" : "barcelona";
      } else if (dist === 2) {
        region = r > 0 ? "barcelona" : "seville";
      } else {
        region = (q + r) % 2 === 0 ? "seville" : "inactive";
      }

      hexes.push({
        id: `hex-${q}-${r}`,
        q,
        r,
        region,
        label: region === "madrid" ? "Madrid Cluster" : region === "barcelona" ? "Barcelona Cluster" : "Seville Cluster",
        users: region === "madrid" ? 540 : region === "barcelona" ? 320 : 140,
      });
    }
  }

  // Convert axial (q, r) to 2D center coordinates (cx, cy)
  const centerX = 160;
  const centerY = 130;

  function hexPoints(cx: number, cy: number, r: number) {
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angleDeg = 60 * i - 30;
      const angleRad = (Math.PI / 180) * angleDeg;
      points.push(`${cx + r * Math.cos(angleRad)},${cy + r * Math.sin(angleRad)}`);
    }
    return points.join(" ");
  }

  function getColor(region: HexNode["region"]) {
    switch (region) {
      case "madrid":
        return "#9B8EC7"; // Primary Purple
      case "barcelona":
        return "#BDA6CE"; // Lavender Accent
      case "seville":
        return "#B4D3D9"; // Cyan Secondary
      case "inactive":
      default:
        return "rgba(180, 211, 217, 0.25)";
    }
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-purple/20 shadow-sm relative overflow-hidden flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text">Customers</h2>
        <Link
          href="/personas"
          onClick={onInspect}
          className="w-8 h-8 rounded-full border border-purple/25 bg-cream/50 flex items-center justify-center text-text hover:bg-purple hover:text-white transition shadow-2xs group"
          title="Inspect Persona Clusters"
        >
          <span className="text-sm font-bold group-hover:scale-110 transition-transform">↗</span>
        </Link>
      </div>

      {/* Honeycomb Visual */}
      <div className="relative w-full h-[210px] flex items-center justify-center my-2">
        <svg viewBox="0 0 320 260" className="w-full h-full max-h-[220px] overflow-visible">
          {hexes.map((hex) => {
            const cx = centerX + hexRadius * (Math.sqrt(3) * hex.q + (Math.sqrt(3) / 2) * hex.r);
            const cy = centerY + hexRadius * ((3 / 2) * hex.r);
            const isHovered = activeHex?.id === hex.id;
            const fill = getColor(hex.region);

            return (
              <polygon
                key={hex.id}
                points={hexPoints(cx, cy, hexRadius - 1.5)}
                fill={fill}
                stroke={isHovered ? "#241E33" : "rgba(255, 255, 255, 0.9)"}
                strokeWidth={isHovered ? 2 : 1.5}
                className="transition-all duration-200 cursor-pointer hover:opacity-90"
                onMouseEnter={() => setActiveHex(hex)}
                onMouseLeave={() => setActiveHex(null)}
              />
            );
          })}
        </svg>

        {/* Hover details badge */}
        {activeHex && activeHex.region !== "inactive" && (
          <div className="absolute top-2 right-4 bg-white/95 backdrop-blur-md border border-purple/25 rounded-2xl px-3 py-1.5 shadow-md pointer-events-none text-xs">
            <span className="font-bold text-text block">{activeHex.label}</span>
            <span className="text-muted text-[11px]">{activeHex.users} synthetic agents</span>
          </div>
        )}
      </div>

      {/* Legend Row */}
      <div className="flex items-center justify-between pt-2 border-t border-purple/10 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple" />
            <span className="font-medium text-text">Madrid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-lavender" />
            <span className="font-medium text-text">Barcelona</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan" />
            <span className="font-medium text-text">Seville</span>
          </div>
        </div>

        <span className="font-mono text-muted font-bold text-xs">0</span>
      </div>
    </div>
  );
}
