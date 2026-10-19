"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useSpread } from "@/lib/queries";
import { api } from "@testhive/api-client";
import { WordOfMouthView } from "@/components/spread/word-of-mouth-view";

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

  return (
    <div className="py-2">
      <WordOfMouthView
        spread={spread}
        activeRunId={id}
        isSimulating={running}
        onRerunSpread={rerun}
      />
    </div>
  );
}
