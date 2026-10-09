"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useSpread } from "@/lib/queries";
import { AdoptionCurve } from "@/components/charts/adoption-curve";
import { api } from "@testhive/api-client";

export default function SpreadPage() {
  const { id } = useParams<{ id: string }>();
  const { data: spread, refetch } = useSpread(id);
  const [running, setRunning] = useState(false);

  async function rerun() {
    if (!id) return;
    setRunning(true);
    try {
      await api.postSpread(id, { rounds: 6, seedStrategy: "positive_verdict", seed: 42 });
      await refetch();
    } finally {
      setRunning(false);
    }
  }

  const curveData = spread
    ? spread.rounds.map((r) => ({ round: r.round, cumulativeAdopters: r.cumulativeAdopters }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Word-of-mouth spread</h1>
        <button onClick={rerun} disabled={running} className="bg-accent text-cream font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50">
          {running ? "Simulating…" : "Re-run simulation"}
        </button>
      </div>

      {spread ? (
        <>
          <div className="card p-5">
            <h2 className="font-semibold mb-3">Adoption curve</h2>
            <AdoptionCurve data={curveData} poolSize={spread.poolSize} />
          </div>
          <div className="card p-5">
            <h2 className="font-semibold mb-3">Round by round</h2>
            <div className="space-y-2 text-sm">
              {spread.rounds.map((r) => (
                <div key={r.round} className="flex justify-between border-b border-border py-1.5">
                  <span>Round {r.round}</span>
                  <span className="text-muted">+{r.newAdopters.length} new · {r.cumulativeAdopters} total</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-muted text-sm">
            Reached {spread.totalReached} of {spread.poolSize} personas ({Math.round((spread.totalReached / spread.poolSize) * 100)}%).
          </p>
        </>
      ) : (
        <p className="text-muted text-sm">No spread simulation yet. Click "Re-run simulation".</p>
      )}
    </div>
  );
}
