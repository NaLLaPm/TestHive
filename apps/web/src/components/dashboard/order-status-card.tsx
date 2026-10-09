"use client";

import Link from "next/link";

export function OrderStatusCard({
  onAction,
}: {
  onAction?: () => void;
}) {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-purple/20 shadow-sm relative overflow-hidden flex flex-col justify-between h-full">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text">Order Status</h2>
      </div>

      {/* Action Button Pill */}
      <div className="my-5">
        <Link
          href="/runs"
          onClick={onAction}
          className="inline-flex items-center justify-between w-full sm:w-auto sm:min-w-[210px] px-5 py-3 rounded-full bg-purple text-cream font-bold text-sm shadow-sm hover:brightness-105 transition-all group"
        >
          <span>New Orders: 120</span>
          <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
            ↗
          </span>
        </Link>
      </div>

      {/* 3 Rounded Pillar Bars / Segments */}
      <div className="space-y-2.5 my-3">
        <div className="grid grid-cols-3 gap-2.5 h-14 sm:h-16">
          {/* Bar 1: Purple */}
          <div className="bg-purple rounded-2xl h-full shadow-2xs hover:opacity-95 transition-opacity relative group overflow-hidden">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Bar 2: Lavender */}
          <div className="bg-lavender rounded-2xl h-full shadow-2xs hover:opacity-95 transition-opacity relative group overflow-hidden">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Bar 3: Cyan */}
          <div className="bg-cyan rounded-2xl h-full shadow-2xs hover:opacity-95 transition-opacity relative group overflow-hidden">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>

      {/* Legend Stats */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-purple/10 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple" />
          <span className="text-muted">Earnings</span>
          <span className="font-bold text-text ml-0.5">$48,620</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-lavender" />
          <span className="text-muted">Preparing</span>
          <span className="font-bold text-text ml-0.5">$6,820</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan" />
          <span className="text-muted">Served</span>
          <span className="font-bold text-text ml-0.5">$6,820</span>
        </div>
      </div>
    </div>
  );
}
