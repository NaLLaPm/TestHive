// ponytail: Minimal bespoke SVG brand logo component for TestHive
import React from "react";
import clsx from "clsx";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  withText?: boolean;
  className?: string;
  subtitle?: string;
}

export function BrandLogo({
  size = "md",
  withText = true,
  className,
  subtitle,
}: BrandLogoProps) {
  // Dimension mapping for clean responsive sizing
  const dim = size === "sm" ? 36 : size === "lg" ? 48 : 42;
  const textSize = size === "sm" ? "text-lg" : size === "lg" ? "text-2xl" : "text-xl";

  return (
    <div className={clsx("flex items-center gap-3 select-none", className)}>
      <div
        className="relative shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
        style={{ width: dim, height: dim }}
      >
        <svg
          viewBox="0 0 48 48"
          width={dim}
          height={dim}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          <defs>
            <linearGradient id="th-bg-pebble" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F6EFE6" />
            </linearGradient>
            <linearGradient id="th-facet-purple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#AF9FE0" />
              <stop offset="100%" stopColor="#7E6BAE" />
            </linearGradient>
            <linearGradient id="th-facet-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C8E6EB" />
              <stop offset="100%" stopColor="#8AB7BF" />
            </linearGradient>
            <linearGradient id="th-facet-lavender" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D5C4E5" />
              <stop offset="100%" stopColor="#A48CBA" />
            </linearGradient>
            <linearGradient id="th-facet-honey" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="th-core-glow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="45%" stopColor="#FBBF24" />
              <stop offset="85%" stopColor="#9B8EC7" />
              <stop offset="100%" stopColor="#7E6BAE" />
            </linearGradient>
          </defs>

          {/* Elevated Pebble Card (Material You rounded squircle) */}
          <rect
            x="2"
            y="2"
            width="44"
            height="44"
            rx="14"
            fill="url(#th-bg-pebble)"
            stroke="#9B8EC7"
            strokeOpacity="0.32"
            strokeWidth="1.2"
          />

          {/* Orbital Swarm Telemetry Track */}
          <circle
            cx="24"
            cy="24"
            r="16.5"
            stroke="#BDA6CE"
            strokeOpacity="0.25"
            strokeWidth="1"
            strokeDasharray="2 3"
          />

          {/* Antennae / Sensor Probes */}
          <path
            d="M20.5 13.5L17.5 9.5M27.5 13.5L30.5 9.5"
            stroke="#9B8EC7"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="17" cy="9" r="1.6" fill="#FBBF24" stroke="#241E33" strokeWidth="0.8" />
          <circle cx="31" cy="9" r="1.6" fill="#F59E0B" stroke="#241E33" strokeWidth="0.8" />

          {/* Top Honeycomb Cell (Apex - Honey Gold) */}
          <path
            d="M24 12L31 16V22L24 25.5L17 22V16L24 12Z"
            fill="url(#th-facet-honey)"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Bottom-Left Honeycomb Cell (Purple) */}
          <path
            d="M16 23.5L23 27V33L16 36.5L9 33V27L16 23.5Z"
            fill="url(#th-facet-purple)"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Bottom-Right Honeycomb Cell (Lavender) */}
          <path
            d="M32 23.5L39 27V33L32 36.5L25 33V27L32 23.5Z"
            fill="url(#th-facet-lavender)"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Central Swarm Brain Hub with Honey Pulse */}
          <circle cx="24" cy="25" r="4.2" fill="#241E33" stroke="#FFFFFF" strokeWidth="1" />
          <circle cx="24" cy="25" r="2.4" fill="url(#th-core-glow)" />
          <circle cx="24" cy="25" r="0.9" fill="#FFFBEB" />

          {/* Downward Test Probe Pin with Honey Accent */}
          <path d="M23 37L24 40.5L25 37Z" fill="#241E33" />
          <circle cx="24" cy="41.5" r="0.9" fill="#F59E0B" />
        </svg>
      </div>

      {withText && (
        <div className="flex flex-col">
          <span
            className={clsx(
              "font-extrabold tracking-tight text-text leading-tight flex items-center",
              textSize
            )}
          >
            Test<span className="text-purple ml-0.5">Hive</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 ml-1.5 shadow-xs" title="Hive Pulse" />
          </span>
          {subtitle ? (
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted/70 leading-none mt-0.5">
              {subtitle}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
