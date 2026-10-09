"use client";

import React, { useMemo, useState } from "react";
import { Streamdown } from "streamdown";

interface MarkdownSourceViewerProps {
  markdown: string;
  runId?: string | null;
  title?: string;
}

interface SectionItem {
  id: string;
  title: string;
  level: number;
  line: number;
}

export function MarkdownSourceViewer({
  markdown,
  runId,
  title,
}: MarkdownSourceViewerProps) {
  const [subMode, setSubMode] = useState<"rendered" | "raw" | "split">("rendered");
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Compute document statistics
  const stats = useMemo(() => {
    const raw = markdown || "";
    const lines = raw.split("\n");
    const words = raw.trim() ? raw.trim().split(/\s+/).length : 0;
    const chars = raw.length;
    const readingTimeMin = Math.max(1, Math.ceil(words / 200));

    // Headings extract for quick navigation table of contents
    const sections: SectionItem[] = [];
    lines.forEach((lineText, idx) => {
      const match = lineText.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim().replace(/\*\*/g, "");
        const id = `sec-${idx}-${text.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
        sections.push({ id, title: text, level, line: idx + 1 });
      }
    });

    return {
      lineCount: lines.length,
      wordCount: words,
      charCount: chars,
      readingTimeMin,
      sections,
    };
  }, [markdown]);

  // Content filtered by active heading or search term if user selects one
  const displayedMarkdown = useMemo(() => {
    if (!selectedSection && !searchQuery.trim()) {
      return markdown;
    }

    if (searchQuery.trim()) {
      // If searching, keep paragraphs or lines matching search query
      const query = searchQuery.toLowerCase();
      const chunks = markdown.split(/\n\n+/);
      const matched = chunks.filter((chunk) =>
        chunk.toLowerCase().includes(query)
      );
      if (matched.length === 0) {
        return `> *No sections matching "${searchQuery}". Clear the search query to view the full document.*`;
      }
      return `> *Filtering sections matching: "${searchQuery}" (${matched.length} sections found)*\n\n` + matched.join("\n\n");
    }

    if (selectedSection) {
      // Find the selected section in markdown text and isolate its content
      const sec = stats.sections.find((s) => s.id === selectedSection);
      if (sec) {
        const lines = markdown.split("\n");
        const startIdx = sec.line - 1;
        let endIdx = lines.length;
        for (let i = startIdx + 1; i < lines.length; i++) {
          const match = lines[i].match(/^(#{1,3})\s+(.+)$/);
          if (match && match[1].length <= sec.level) {
            endIdx = i;
            break;
          }
        }
        const isolated = lines.slice(startIdx, endIdx).join("\n");
        return isolated;
      }
    }

    return markdown;
  }, [markdown, selectedSection, searchQuery, stats.sections]);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(markdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // fallback
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = runId ? `report-${runId}.md` : "executive-report.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Top Utility & Control Bar */}
      <div className="bg-panel border border-border rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Interactive Display Sub-Modes */}
        <div className="flex items-center gap-1.5 bg-panel2 p-1 rounded-xl border border-border/80 self-start">
          <button
            type="button"
            onClick={() => setSubMode("rendered")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              subMode === "rendered"
                ? "bg-purple text-cream shadow-xs"
                : "text-muted hover:text-text hover:bg-white"
            }`}
          >
            Formatted
          </button>
          <button
            type="button"
            onClick={() => setSubMode("split")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition hidden sm:inline-block ${
              subMode === "split"
                ? "bg-purple text-cream shadow-xs"
                : "text-muted hover:text-text hover:bg-white"
            }`}
          >
            Side-by-Side
          </button>
          <button
            type="button"
            onClick={() => setSubMode("raw")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              subMode === "raw"
                ? "bg-purple text-cream shadow-xs"
                : "text-muted hover:text-text hover:bg-white"
            }`}
          >
            Raw Markdown
          </button>
        </div>

        {/* Center: Search & Filter Input */}
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (selectedSection) setSelectedSection(null);
            }}
            placeholder="Search report sections..."
            className="w-full text-xs bg-panel2 border border-border rounded-xl pl-8 pr-7 py-1.5 text-text placeholder:text-muted/70 focus:outline-none focus:ring-1 focus:ring-purple/60 focus:bg-white transition"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted text-xs pointer-events-none">
            🔍
          </span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-text text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Right: Copy & Download Actions + Quick Stats */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl bg-panel2 border border-border text-text text-xs font-semibold hover:border-purple/50 hover:bg-lavender/10 transition flex items-center gap-1.5 shadow-xs"
            title="Copy full Markdown source to clipboard"
          >
            <span>{copied ? "✓" : "📋"}</span>
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-xl bg-purple text-cream text-xs font-bold hover:bg-lavender hover:text-text transition flex items-center gap-1.5 shadow-xs"
            title="Download .md file"
          >
            <span>⬇</span>
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout: Proper Content Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Document Structure & Quick Section Navigator (lg:col-span-3) */}
        <aside className="lg:col-span-3 space-y-4">
          {/* Quick Metrics Tile */}
          <div className="bg-panel border border-border rounded-2xl p-4 shadow-xs space-y-3">
            <h4 className="text-[11px] uppercase font-mono tracking-wider text-muted font-bold">
              Document Specs
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-panel2 border border-border/50">
                <span className="text-[10px] text-muted block font-mono">WORDS</span>
                <span className="font-mono font-bold text-text text-sm">
                  {stats.wordCount.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-panel2 border border-border/50">
                <span className="text-[10px] text-muted block font-mono">READ TIME</span>
                <span className="font-mono font-bold text-text text-sm">
                  ~{stats.readingTimeMin} min
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-panel2 border border-border/50">
                <span className="text-[10px] text-muted block font-mono">LINES</span>
                <span className="font-mono font-bold text-text text-sm">
                  {stats.lineCount}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-panel2 border border-border/50">
                <span className="text-[10px] text-muted block font-mono">SECTIONS</span>
                <span className="font-mono font-bold text-text text-sm">
                  {stats.sections.length}
                </span>
              </div>
            </div>
          </div>

          {/* Table of Contents Navigator */}
          {stats.sections.length > 0 && (
            <div className="bg-panel border border-border rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] uppercase font-mono tracking-wider text-muted font-bold">
                  Table of Contents
                </h4>
                {selectedSection && (
                  <button
                    type="button"
                    onClick={() => setSelectedSection(null)}
                    className="text-[10px] text-purple font-mono hover:underline"
                  >
                    Reset All
                  </button>
                )}
              </div>

              <nav className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => setSelectedSection(null)}
                  className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition truncate ${
                    selectedSection === null && !searchQuery
                      ? "bg-purple/15 text-purple font-semibold"
                      : "text-muted hover:text-text hover:bg-panel2"
                  }`}
                >
                  📄 Entire Document
                </button>
                {stats.sections.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => {
                      setSelectedSection(sec.id);
                      setSearchQuery("");
                    }}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition truncate ${
                      selectedSection === sec.id
                        ? "bg-purple/15 text-purple font-semibold"
                        : "text-muted hover:text-text hover:bg-panel2"
                    }`}
                    style={{ paddingLeft: `${Math.max(0.6, (sec.level - 1) * 0.8 + 0.6)}rem` }}
                  >
                    {sec.level > 1 && <span className="opacity-40 mr-1.5">↳</span>}
                    {sec.title}
                  </button>
                ))}
              </nav>
            </div>
          )}
        </aside>

        {/* Right Side: Primary Content Area (lg:col-span-9) */}
        <main className="lg:col-span-9">
          {subMode === "rendered" && (
            <div className="bg-panel border border-border rounded-3xl p-6 sm:p-8 shadow-xs">
              <Streamdown
                className="prose prose-stone max-w-none text-text prose-headings:text-text prose-headings:tracking-tight prose-a:text-purple prose-code:bg-panel2 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-xs"
                controls={{
                  table: { copy: true },
                  code: { copy: true },
                }}
              >
                {displayedMarkdown}
              </Streamdown>
            </div>
          )}

          {subMode === "raw" && (
            <div className="bg-panel border border-border rounded-3xl overflow-hidden shadow-xs">
              <div className="bg-panel2/60 border-b border-border px-4 py-2 flex items-center justify-between text-xs text-muted font-mono">
                <span>markdown_source.md</span>
                <span>UTF-8 • Plain Text</span>
              </div>
              <div className="p-4 sm:p-6 overflow-x-auto">
                <pre className="font-mono text-xs text-text leading-relaxed whitespace-pre-wrap selection:bg-purple/20">
                  {displayedMarkdown}
                </pre>
              </div>
            </div>
          )}

          {subMode === "split" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Formatted Column */}
              <div className="bg-panel border border-border rounded-3xl p-5 shadow-xs overflow-x-auto">
                <div className="text-[10px] uppercase font-mono tracking-wider text-muted font-bold mb-3 border-b border-border pb-1.5">
                  Formatted Streamdown
                </div>
                <Streamdown
                  className="prose prose-stone max-w-none text-text text-xs prose-headings:text-text prose-headings:tracking-tight prose-a:text-purple prose-code:bg-panel2 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-[11px]"
                  controls={{
                    table: { copy: true },
                    code: { copy: true },
                  }}
                >
                  {displayedMarkdown}
                </Streamdown>
              </div>

              {/* Raw Source Column */}
              <div className="bg-panel border border-border rounded-3xl p-5 shadow-xs overflow-x-auto">
                <div className="text-[10px] uppercase font-mono tracking-wider text-muted font-bold mb-3 border-b border-border pb-1.5 flex items-center justify-between">
                  <span>Raw Markdown</span>
                  <span className="text-muted/60">{stats.lineCount} lines</span>
                </div>
                <pre className="font-mono text-[11px] text-text leading-relaxed whitespace-pre-wrap selection:bg-purple/20">
                  {displayedMarkdown}
                </pre>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
