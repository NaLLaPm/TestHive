"use client";

import { useState, useMemo } from "react";
import { usePools, usePersonas, useClusters, useUpdatePersona } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";

type PersonaItem = NonNullable<ReturnType<typeof usePersonas>["data"]>["items"][number];

export default function PersonasDirectoryPage() {
  const { data: pools } = usePools();
  const readyPools = (pools ?? []).filter((p) => p.status === "ready");
  const defaultPool = readyPools.find((p) => p.isDefault) ?? readyPools[0];

  const [selectedPoolId, setSelectedPoolId] = useState<string>("");
  const activePoolId = selectedPoolId || defaultPool?.id;

  const { data: clusters } = useClusters(activePoolId);
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 48;
  const [editingPersona, setEditingPersona] = useState<PersonaItem | null>(null);

  // Load paginated personas from this prebuilt pool so user can browse any pool
  const { data: personasData, isLoading } = usePersonas(
    activePoolId,
    `?page=${page}&pageSize=${pageSize}${selectedClusterId !== null ? `&clusterId=${selectedClusterId}` : ""}`
  );

  const updateMutation = useUpdatePersona(activePoolId);

  // Edit form state
  const [formBackstory, setFormBackstory] = useState("");
  const [formVoice, setFormVoice] = useState("");
  const [formQuirks, setFormQuirks] = useState("");
  const [formTechComfort, setFormTechComfort] = useState(3);
  const [formPatience, setFormPatience] = useState(3);
  const [formGoalStyle, setFormGoalStyle] = useState("goal_driven");
  const [saveSuccess, setSaveSuccess] = useState(false);

  function openEditModal(persona: PersonaItem) {
    setEditingPersona(persona);
    setFormBackstory(persona.backstory || "");
    setFormVoice(persona.voice || "");
    setFormQuirks(persona.quirks?.join(", ") || "");
    setFormTechComfort(persona.traits?.techComfort ?? 3);
    setFormPatience(persona.traits?.patience ?? 3);
    setFormGoalStyle(persona.traits?.goalStyle ?? "goal_driven");
    setSaveSuccess(false);
  }

  async function handleSavePersona(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPersona || !activePoolId) return;

    const quirksList = formQuirks
      .split(",")
      .map((q) => q.trim())
      .filter(Boolean);

    await updateMutation.mutateAsync({
      personaId: editingPersona.id,
      body: {
        backstory: formBackstory,
        voice: formVoice,
        quirks: quirksList,
        traits: {
          techComfort: formTechComfort,
          patience: formPatience,
          goalStyle: formGoalStyle as any,
        },
      },
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setEditingPersona(null);
      setSaveSuccess(false);
    }, 900);
  }

  // Filtered in-memory list
  const filteredPersonas = useMemo(() => {
    const items = personasData?.items ?? [];
    return items.filter((p) => {
      if (deviceFilter !== "all" && p.traits?.device !== deviceFilter) return false;
      if (ageFilter !== "all" && p.traits?.ageGroup !== ageFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesOccupation = p.traits?.occupation?.toLowerCase().includes(q);
        const matchesRegion = p.traits?.region?.toLowerCase().includes(q);
        const matchesBackstory = p.backstory?.toLowerCase().includes(q);
        const matchesId = p.id.toLowerCase().includes(q);
        if (!matchesOccupation && !matchesRegion && !matchesBackstory && !matchesId) {
          return false;
        }
      }
      return true;
    });
  }, [personasData, deviceFilter, ageFilter, search]);

  return (
    <div className="space-y-8">
      {/* Header section */}
      <section className="bg-white/85 border border-border rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple/15 text-purple text-xs font-bold">
              <span>Prebuilt & Reusable Corpus</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-text">
              Persona Roster & Customizer
            </h1>
            <p className="text-muted text-sm sm:text-base max-w-2xl leading-relaxed">
              Every persona synthesized in your pool is prebuilt, permanently retained in SQLite,
              and automatically reused across all subsequent test runs. Inspect, tune, or alter
              individual traits, backstories, and patience levels below.
            </p>
          </div>

          {/* Pool selector */}
          <div className="bg-panel2 border border-border p-3.5 rounded-2xl flex flex-col gap-1.5 min-w-[240px]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Active Persona Pool:
            </span>
            <select
              value={activePoolId ?? ""}
              onChange={(e) => setSelectedPoolId(e.target.value)}
              className="bg-white border border-border rounded-xl px-3 py-1.5 text-xs font-semibold text-text focus:outline-none focus:border-purple"
            >
              {readyPools.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.slug} ({p.size} nodes {p.isDefault ? "• default" : ""})
                </option>
              ))}
            </select>
            <span className="text-[11px] text-muted">
              Total {personasData?.total ?? 0} prebuilt personas indexed
            </span>
          </div>
        </div>
      </section>

      {/* Filter and search controls */}
      <div className="bg-white border border-border rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by occupation, region, backstory, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-panel2 border border-border rounded-2xl px-4 py-2.5 text-xs text-text placeholder-muted/70 focus:outline-none focus:border-purple"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Device filter */}
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <span className="font-semibold text-[11px] uppercase">Device:</span>
              <select
                value={deviceFilter}
                onChange={(e) => setDeviceFilter(e.target.value)}
                className="bg-panel2 border border-border rounded-xl px-2.5 py-1.5 text-xs font-medium text-text focus:outline-none"
              >
                <option value="all">All Devices</option>
                <option value="low-end android">Low-end Android</option>
                <option value="mid android">Mid Android</option>
                <option value="iphone">iPhone</option>
                <option value="laptop">Laptop</option>
                <option value="tablet">Tablet</option>
              </select>
            </div>

            {/* Age filter */}
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <span className="font-semibold text-[11px] uppercase">Age:</span>
              <select
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value)}
                className="bg-panel2 border border-border rounded-xl px-2.5 py-1.5 text-xs font-medium text-text focus:outline-none"
              >
                <option value="all">All Ages</option>
                <option value="13-17">13-17</option>
                <option value="18-24">18-24</option>
                <option value="25-34">25-34</option>
                <option value="35-49">35-49</option>
                <option value="50-64">50-64</option>
                <option value="65+">65+</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cluster pills */}
        {clusters && clusters.length > 0 && (
          <div className="pt-2 border-t border-border flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider whitespace-nowrap">
              Cluster:
            </span>
            <button
              onClick={() => setSelectedClusterId(null)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                selectedClusterId === null
                  ? "bg-purple text-cream font-bold"
                  : "bg-panel2 border border-border text-muted hover:text-text"
              }`}
            >
              All Clusters
            </button>
            {clusters.map((c) => (
              <button
                key={c.clusterId}
                onClick={() => setSelectedClusterId(c.clusterId)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  selectedClusterId === c.clusterId
                    ? "bg-purple text-cream font-bold"
                    : "bg-panel2 border border-border text-muted hover:text-text"
                }`}
              >
                {c.label} ({c.size})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Persona cards grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-text uppercase tracking-wider">
            Showing {filteredPersonas.length} Prebuilt Personas
          </h2>
          <span className="text-xs text-muted">
            Click <strong>"Alter Persona"</strong> on any card to customize behavior
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-muted text-sm bg-white border border-border rounded-3xl">
            Loading prebuilt personas from SQLite…
          </div>
        ) : filteredPersonas.length === 0 ? (
          <div className="p-12 text-center text-muted text-sm bg-white border border-border rounded-3xl">
            No personas match your active filters.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPersonas.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-border rounded-3xl p-5 shadow-xs hover:border-purple/50 transition flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-purple font-semibold">
                      #{p.id.slice(0, 8)}
                    </span>
                    <Badge kind="neutral">
                      Cluster {p.clusterId !== null ? `#${p.clusterId}` : "None"}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-text capitalize">
                      {p.traits?.occupation?.replace(/_/g, " ")} · {p.traits?.ageGroup}
                    </h3>
                    <p className="text-xs text-muted mt-1 leading-relaxed line-clamp-3">
                      "{p.backstory || "No backstory assigned."}"
                    </p>
                  </div>

                  {p.voice && (
                    <div className="text-[11px] text-muted italic bg-panel2 p-2 rounded-xl border border-border">
                      <span className="font-semibold text-text not-italic">Voice:</span> {p.voice}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Badge>{p.traits?.device}</Badge>
                    <Badge>{p.traits?.connection}</Badge>
                    <Badge>{p.traits?.region}</Badge>
                    <Badge kind="neutral">Tech: {p.traits?.techComfort}/5</Badge>
                    <Badge kind="neutral">Patience: {p.traits?.patience}/5</Badge>
                    {p.traits?.accessibility && p.traits?.accessibility !== "none" && (
                      <Badge kind="medium">{p.traits?.accessibility}</Badge>
                    )}
                  </div>

                  {p.quirks && p.quirks.length > 0 && (
                    <div className="text-[11px] text-muted">
                      <span className="font-semibold text-text">Quirks:</span> {p.quirks.join(", ")}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3.5 border-t border-border flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted">
                    {p.deviceProfileKey}
                  </span>
                  <button
                    onClick={() => openEditModal(p)}
                    className="px-3.5 py-1.5 rounded-xl bg-purple text-cream hover:bg-lavender hover:text-text font-bold text-xs transition shadow-2xs"
                  >
                    Alter Persona ✏️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination bar */}
        {personasData && personasData.total > pageSize && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border border-border rounded-2xl">
            <span className="text-xs text-muted">
              Page <strong>{personasData.page}</strong> of{" "}
              <strong>{Math.ceil(personasData.total / pageSize)}</strong> (
              {personasData.total} prebuilt personas in this pool)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 rounded-xl bg-panel2 border border-border text-xs font-semibold text-text hover:border-purple disabled:opacity-40 transition"
              >
                ← Previous
              </button>
              <button
                type="button"
                disabled={page >= Math.ceil(personasData.total / pageSize)}
                onClick={() => setPage((p) => p + 1)}
                className="px-3.5 py-1.5 rounded-xl bg-purple text-cream text-xs font-bold hover:bg-lavender hover:text-text disabled:opacity-40 transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Alter Persona Modal */}
      {editingPersona && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-border rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-base text-text">Alter Persona Attributes</h3>
                <p className="text-[11px] font-mono text-muted">ID: {editingPersona.id}</p>
              </div>
              <button
                onClick={() => setEditingPersona(null)}
                className="p-1 rounded-xl hover:bg-panel2 text-muted hover:text-text"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePersona} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted block mb-1">
                  Backstory & Mindset
                </label>
                <textarea
                  rows={3}
                  value={formBackstory}
                  onChange={(e) => setFormBackstory(e.target.value)}
                  className="w-full bg-panel2 border border-border rounded-xl p-3 text-xs text-text focus:outline-none focus:border-purple"
                  placeholder="Describe what drives this person and their life context..."
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted block mb-1">
                  Voice & Tone
                </label>
                <input
                  type="text"
                  value={formVoice}
                  onChange={(e) => setFormVoice(e.target.value)}
                  className="w-full bg-panel2 border border-border rounded-xl px-3 py-2 text-xs text-text focus:outline-none focus:border-purple"
                  placeholder="e.g. Skeptical, analytical, impatient with bad UI"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted block mb-1">
                  Behavioral Quirks (comma-separated)
                </label>
                <input
                  type="text"
                  value={formQuirks}
                  onChange={(e) => setFormQuirks(e.target.value)}
                  className="w-full bg-panel2 border border-border rounded-xl px-3 py-2 text-xs text-text focus:outline-none focus:border-purple"
                  placeholder="e.g. abandons carts on extra fees, clicks discount codes first"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">
                    Tech Comfort (1-5): {formTechComfort}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={formTechComfort}
                    onChange={(e) => setFormTechComfort(Number(e.target.value))}
                    className="w-full accent-purple"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">
                    Patience (1-5): {formPatience}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={formPatience}
                    onChange={(e) => setFormPatience(Number(e.target.value))}
                    className="w-full accent-purple"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted block mb-1">
                  Shopping & Goal Style
                </label>
                <select
                  value={formGoalStyle}
                  onChange={(e) => setFormGoalStyle(e.target.value)}
                  className="w-full bg-panel2 border border-border rounded-xl px-3 py-2 text-xs text-text focus:outline-none focus:border-purple"
                >
                  <option value="goal_driven">Goal Driven</option>
                  <option value="bargain_hunter">Bargain Hunter</option>
                  <option value="explorer">Explorer</option>
                  <option value="skeptic">Skeptic</option>
                </select>
              </div>

              {saveSuccess && (
                <div className="p-2.5 rounded-xl bg-cyan/20 border border-cyan/40 text-text text-xs text-center font-bold">
                  ✓ Persona saved to database! Reused automatically on next runs.
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingPersona(null)}
                  className="px-4 py-2 rounded-xl bg-panel2 border border-border text-xs font-semibold text-muted hover:text-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-purple text-cream hover:bg-lavender hover:text-text font-bold text-xs transition disabled:opacity-50 shadow-xs"
                >
                  {updateMutation.isPending ? "Saving changes…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
