"use client";

/** Styled CSS grid heatmap using the Pixel OS Material You palette */
export function TraitHeatmap({ byTrait }: { byTrait: Record<string, { value: string | number; successRate: number; n: number }[]> }) {
  const traitKeys = Object.keys(byTrait);
  if (traitKeys.length === 0) return <div className="text-muted text-sm">No data yet.</div>;

  return (
    <div className="space-y-5">
      {traitKeys.map((trait) => (
        <div key={trait}>
          <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple inline-block" />
            {trait}
          </div>
          <div className="flex flex-wrap gap-2">
            {byTrait[trait]!.map((cell) => {
              const colors = heatStyles(cell.successRate);
              return (
                <div
                  key={String(cell.value)}
                  title={`${cell.value}: ${(cell.successRate * 100).toFixed(0)}% (n=${cell.n})`}
                  className="rounded-2xl px-3.5 py-2.5 text-xs font-medium min-w-[84px] text-center border transition hover:scale-105"
                  style={{
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                >
                  <div className="font-semibold">{String(cell.value)}</div>
                  <div className="text-[11px] font-mono mt-0.5 opacity-90">{(cell.successRate * 100).toFixed(0)}%</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function heatStyles(rate: number): { bg: string; border: string; text: string } {
  if (rate < 0.35) {
    return { bg: "rgba(242, 139, 130, 0.20)", border: "rgba(242, 139, 130, 0.5)", text: "#A82B24" };
  }
  if (rate < 0.65) {
    return { bg: "rgba(253, 214, 99, 0.25)", border: "rgba(253, 214, 99, 0.6)", text: "#8D6B00" };
  }
  return { bg: "rgba(180, 211, 217, 0.35)", border: "rgba(155, 142, 199, 0.4)", text: "#241E33" };
}
