export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-panel border border-border rounded-2xl p-5 relative overflow-hidden group hover:border-purple/40 shadow-sm transition">
      <div className="text-[11px] uppercase tracking-wider font-semibold text-muted">{label}</div>
      <div className="text-3xl font-bold mt-2 text-text tracking-tight">{value}</div>
      {sub && <div className="text-xs text-purple mt-1.5 font-medium">{sub}</div>}
      <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-lavender/10 pointer-events-none group-hover:scale-150 transition-transform duration-500" />
    </div>
  );
}
