"use client";

import { useRouter } from "next/navigation";
import { useDemoRuns } from "@/lib/queries";
import { api } from "@testhive/api-client";

export default function DemoPage() {
  const { data: demos } = useDemoRuns();
  const router = useRouter();

  async function load(demoId: string) {
    const res = await api.loadDemoRun(demoId);
    router.push(`/runs/${res.runId}/results`);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Demo runs</h1>
      <p className="text-muted text-sm">
        Pre-cached runs for a reliable, network-free demo. Generate these with{" "}
        <code className="bg-panel2 px-1 rounded">pnpm demo:seed</code>.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {(demos ?? []).map((d) => (
          <button key={d.demoId} onClick={() => load(d.demoId)} className="card p-5 text-left hover:border-accent/40 transition">
            <div className="font-semibold">{d.title}</div>
            <div className="text-sm text-muted mt-1">{d.description}</div>
          </button>
        ))}
        {(demos ?? []).length === 0 && <p className="text-muted text-sm">No demo runs cached yet.</p>}
      </div>
    </div>
  );
}
