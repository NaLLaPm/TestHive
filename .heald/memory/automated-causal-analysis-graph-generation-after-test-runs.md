---
type: decision
title: "Automated Causal Analysis Graph Generation After Test Runs"
timestamp: 2026-10-09T06:38:10.212988300+00:00
---
Integrated deterministic fake analysis graph generation into runFullPipeline after persona aggregation and UX friction extraction. Added AnalysisGraph domain and API schemas in contracts, exposed GET /api/runs/:runId/analysis-graph, added useAnalysisGraph hook and AnalysisGraphView 2D force component, and embedded causal network graphs across run results, executive reports, dedicated /runs/:id/analysis-graph page, and dashboard Tab 3.
