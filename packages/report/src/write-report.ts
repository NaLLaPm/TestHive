import type { AnalysisGraph, ElementFriction, FunnelStep, Issue, Report, SegmentsResponse, Stimulus } from "@testhive/contracts";
import { ReportWriterOutputSchema } from "@testhive/contracts";
import { generateStructured, type LlmProviderName } from "@testhive/llm";

export interface WriteReportOptions {
  runId: string;
  stimulus: Stimulus;
  segments: SegmentsResponse;
  issues: Issue[];
  funnel?: FunnelStep[];
  frictionHeatmap?: ElementFriction[];
  analysisGraph?: AnalysisGraph;
  provider?: LlmProviderName;
}

export async function writeReport(opts: WriteReportOptions): Promise<Report> {
  const { segments, issues, funnel, frictionHeatmap } = opts;
  const title =
    opts.stimulus.type === "url"
      ? `TestHive Report: ${new URL(opts.stimulus.url).hostname}`
      : opts.stimulus.type === "questions"
        ? `TestHive Report: ${opts.stimulus.prompt.slice(0, 60)}`
        : `TestHive Report: ${opts.stimulus.title ?? "copy test"}`;

  const prompt = [
    `Write a concise usability-test executive summary for "${title}".`,
    `Overall success rate: ${(segments.overall.successRate * 100).toFixed(0)}% across ${segments.overall.n} simulated users.`,
    "Worst-performing segments:",
    ...segments.byCluster.slice(0, 3).map((c) => `- ${c.label}: ${(c.successRate * 100).toFixed(0)}% success (n=${c.n})`),
    "Top issues found (ranked by impact = affected share * failure rate * effort):",
    ...issues.slice(0, 5).map((i) => `- [${i.severity}] ${i.title} (Impact: ${i.impactScore ?? "n/a"}, ${i.affectedPersonas} affected, effort: ${i.effort ?? "medium"})`),
    "",
    "Return JSON: { title, summary (2-4 sentences), recommendations: string[] (3-6 concrete, prioritized fixes) }.",
  ].join("\n");

  const written = await generateStructured(ReportWriterOutputSchema, prompt, {
    provider: opts.provider,
    useCache: false,
    label: "report-writer",
  });

  const markdown = renderMarkdown(
    written.title || title,
    written.summary,
    segments,
    issues,
    written.recommendations,
    funnel,
    frictionHeatmap,
    opts.analysisGraph,
  );

  return {
    runId: opts.runId,
    title: written.title || title,
    summary: written.summary,
    segments,
    topIssues: issues.slice(0, 10),
    recommendations: written.recommendations,
    funnel,
    frictionHeatmap,
    analysisGraph: opts.analysisGraph,
    markdown,
    generatedAt: new Date().toISOString(),
  };
}

function renderMarkdown(
  title: string,
  summary: string,
  segments: SegmentsResponse,
  issues: Issue[],
  recommendations: string[],
  funnel?: FunnelStep[],
  frictionHeatmap?: ElementFriction[],
  analysisGraph?: AnalysisGraph,
): string {
  const lines: string[] = [];
  lines.push(`# ${title}`, "");
  lines.push(summary, "");

  if (analysisGraph) {
    lines.push("## Causal Analysis Graph", "");
    lines.push(
      `Synthesized **${analysisGraph.metrics.totalNodes} nodes** and **${analysisGraph.metrics.totalEdges} causal connections** across ${analysisGraph.metrics.clustersCount} cohorts and ${analysisGraph.metrics.issuesCount} UX frictions.`,
    );
    if (analysisGraph.metrics.topBottleneck) {
      lines.push(`- **Primary Bottleneck:** ${analysisGraph.metrics.topBottleneck}`);
    }
    lines.push("");
  }

  const overallPct = Math.round(segments.overall.successRate * 100);
  const overallMoe = segments.overall.marginOfError !== undefined ? Math.round(segments.overall.marginOfError * 100) : null;
  const overallStatStr = overallMoe !== null ? `${overallPct}% ± ${overallMoe}%` : `${overallPct}%`;

  lines.push(`**Overall success rate:** ${overallStatStr} (n=${segments.overall.n})`, "");

  // Funnel Drop-off View
  if (funnel && funnel.length > 0) {
    lines.push("## User Journey Funnel", "");
    lines.push("Step-by-step conversion from initial landing to final success with drop-off percentages:", "");
    lines.push("| Step | Stage | Users Reached | Conversion % | Drop-offs | Drop-off % |", "|---|---|---|---|---|---|");
    for (const step of funnel) {
      const convPct = Math.round(step.conversionPct * 100);
      const dropPct = Math.round(step.dropOffPct * 100);
      lines.push(`| ${step.order} | ${step.name} | ${step.reachedCount} | ${convPct}% | ${step.dropOffCount} | ${dropPct}% |`);
    }
    lines.push("");
  }

  // Element Friction Heatmap
  if (frictionHeatmap && frictionHeatmap.length > 0) {
    lines.push("## Friction Heatmap by Page Element", "");
    lines.push("Where simulated agents experienced friction, hesitation, or abandonment:", "");
    lines.push("| Element / Component | Type | Stuck Agents | % of Total | Sample Voice Quotes |", "|---|---|---|---|---|");
    for (const item of frictionHeatmap.slice(0, 8)) {
      const stuckPct = Math.round(item.stuckPercentage * 100);
      const quotes = item.sampleQuotes.length > 0 ? `"${item.sampleQuotes[0]?.replace(/\|/g, "/")}"` : "None recorded";
      lines.push(`| ${item.name} | \`${item.type}\` | ${item.stuckCount} | ${stuckPct}% | ${quotes} |`);
    }
    lines.push("");
  }

  // Baseline Control Integrity Check
  if (segments.baselineControl) {
    const bc = segments.baselineControl;
    const badge = bc.status === "healthy" ? "PASSED (Healthy)" : "FLAGGED (Suspect Site Outage)";
    lines.push("### Baseline Control Check", "");
    lines.push(`- **Status:** ${badge}`);
    lines.push(`- **Control Persona Success:** ${Math.round(bc.successRate * 100)}% (n=${bc.n})`);
    lines.push(`- **Diagnostic:** ${bc.note}`, "");
  }

  // Repeat Reproducibility & Variance
  if (segments.repeatVariance) {
    const rv = segments.repeatVariance;
    lines.push("### Repeat Seed Reproducibility", "");
    lines.push(`- **Repeats:** ${rv.repeats}x per persona with fixed seeds`);
    lines.push(`- **Variance:** ${rv.avgVariance} (Consistency: ${Math.round(rv.consistencyScore * 100)}%)`);
    lines.push(`- **Flaky Personas:** ${rv.flakyCount}`, "");
  }

  lines.push("## Success rate by segment", "");
  lines.push("| Cluster | Description | n | Success rate (95% CI) | Status |", "|---|---|---|---|---|");
  for (const c of segments.byCluster) {
    const pct = Math.round(c.successRate * 100);
    const moe = c.marginOfError !== undefined ? Math.round(c.marginOfError * 100) : null;
    const ciStr = moe !== null ? `${pct}% ± ${moe}%` : `${pct}%`;
    const status = c.isLowSample ? "⚠️ Low sample (n < 10)" : "✅ Validated";
    const desc = c.description ? c.description.replace(/\|/g, "/") : "Simulated cluster group";
    lines.push(`| **${c.label}** | ${desc} | ${c.n} | ${ciStr} | ${status} |`);
  }

  lines.push("", "## Impact-Ranked Fixes & Trace Evidence", "");
  lines.push("> Ranked by **Impact Score** = `affected share × failure rate × effort`", "");

  for (const issue of issues.slice(0, 10)) {
    const impactStr = issue.impactScore !== undefined ? `Impact Score: ${issue.impactScore}` : "";
    const effortStr = issue.effort ? `Effort: ${issue.effort.toUpperCase()}` : "";
    const metaTag = [impactStr, effortStr].filter(Boolean).join(" | ");

    lines.push(`### [${issue.severity.toUpperCase()}] ${issue.title} ${metaTag ? `(${metaTag})` : ""}`);
    if (issue.affectedShare !== undefined && issue.failureRate !== undefined) {
      const sharePct = Math.round(issue.affectedShare * 100);
      const failPct = Math.round(issue.failureRate * 100);
      lines.push(`- **Impact Calculation:** Affected Share: ${sharePct}% | Failure Rate: ${failPct}% | Estimated Effort: ${issue.effort ?? "medium"}`);
    }
    lines.push(`- **Scope:** Affects ~${issue.affectedPersonas} personas across clusters ${issue.affectedClusters.join(", ") || "n/a"}.`);
    lines.push(`- **Concrete Fix:** ${issue.suggestedFix}`);
    if (issue.screenshot) {
      lines.push(`- **Screenshot:** \`${issue.screenshot}\``);
    }
    if (issue.evidence.length > 0) {
      lines.push("", "**Grounded Evidence Traces:**");
      for (const ev of issue.evidence.slice(0, 3)) {
        const stepInfo = ev.step !== null ? ` (Step ${ev.step})` : "";
        lines.push(`- > "${ev.quote}"${stepInfo}`);
        if (ev.screenshot && ev.screenshot !== issue.screenshot) {
          lines.push(`  - *Screenshot captured:* \`${ev.screenshot}\``);
        }
      }
    }
    lines.push("");
  }
  lines.push("## Recommendations", "");
  for (const r of recommendations) lines.push(`- ${r}`);
  return lines.join("\n");
}

