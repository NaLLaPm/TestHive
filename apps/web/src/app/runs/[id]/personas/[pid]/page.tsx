"use client";

import { useParams } from "next/navigation";
import { useTranscript, useRunPersonas } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";


export default function TranscriptPage() {
  const { id, pid } = useParams<{ id: string; pid: string }>();
  const { data: steps } = useTranscript(id, pid);
  const { data: runPersonas } = useRunPersonas(id);

  const personaItem = runPersonas?.find((p) => p.personaId === pid);
  const result = personaItem?.result;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Execution Trace & Drop-Off</h1>
          <p className="text-muted text-sm">Persona ID: {pid}</p>
        </div>
        {personaItem && (
          <Badge kind={personaItem.outcome ?? "neutral"}>
            {personaItem.outcome ?? personaItem.status}
          </Badge>
        )}
      </div>

      {result?.dropOffReason && (
        <div className="card p-5 border-l-4 border-l-danger bg-danger/10">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-danger text-sm">Stated Reason for Abandoning</h3>
            <span className="text-xs font-mono text-muted">
              {result.dropOffStep !== null ? `Drop-off at Step ${result.dropOffStep}` : "Immediate Drop-off"}
            </span>
          </div>
          <p className="text-sm text-text mt-2 leading-relaxed">
            "{result.dropOffReason}"
          </p>
          {result.screenshotPath && (
            <div className="mt-3">
              <span className="text-xs text-muted block mb-1">Point of abandonment screenshot:</span>
              <img
                src={`/api/assets/${result.screenshotPath}`}
                alt="Drop-off screenshot"
                className="rounded-lg border border-border max-w-md shadow-md"
              />
            </div>
          )}
        </div>
      )}

      {(!steps || steps.length === 0) && (
        <p className="text-muted text-sm">
          No step-by-step browser transcript recorded.
        </p>
      )}

      <div className="space-y-4">
        {(steps ?? []).map((s) => {
          const action = s.action as any;
          return (
            <div key={s.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">
                  Step {s.step}: {action.action}
                  {action.targetIdx !== null && action.targetIdx !== undefined ? ` [element #${action.targetIdx}]` : ""}
                </div>
                <Badge kind={action.emotion === "frustrated" || action.emotion === "anxious" ? "failure" : "neutral"}>
                  {action.emotion}
                </Badge>
              </div>
              <p className="text-sm text-muted mt-2">{s.note}</p>
              {s.screenshotPath && (
                <img
                  src={`/api/assets/${s.screenshotPath}`}
                  alt={`step ${s.step} screenshot`}
                  className="mt-3 rounded-lg border border-border max-w-sm"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

