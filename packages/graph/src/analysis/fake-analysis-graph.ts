import type {
  AnalysisGraph,
  AnalysisGraphEdge,
  AnalysisGraphNode,
  ElementFriction,
  FunnelStep,
  Issue,
  Persona,
  PersonaCluster,
  PersonaResult,
} from "@testhive/contracts";

const CLUSTER_COLORS = [
  "#BDA6CE", // pixel lilac
  "#B4D3D9", // pixel mint
  "#9B8EC7", // pixel violet
  "#81C995", // soft green
  "#FDD663", // soft gold
  "#F28B82", // soft coral
  "#C4B8EB", // lavender
  "#A3C9D7", // sky mint
];

export interface CreateFakeAnalysisGraphOptions {
  runId: string;
  poolId: string;
  personas: Persona[];
  results: PersonaResult[];
  clusters: PersonaCluster[];
  issues: Issue[];
  funnel?: FunnelStep[];
  frictionHeatmap?: ElementFriction[];
}

/**
 * Creates a synthetic, causal analysis graph after a test run.
 * Links demographic clusters, discovered UX frictions, funnel stages,
 * and key persona outcomes into an inspectable force network.
 */
export function createFakeAnalysisGraph(opts: CreateFakeAnalysisGraphOptions): AnalysisGraph {
  const { runId, poolId, personas = [], results = [], clusters = [], issues = [], funnel = [] } = opts;

  const nodes: AnalysisGraphNode[] = [];
  const edges: AnalysisGraphEdge[] = [];
  const existingNodeIds = new Set<string>();

  const addNode = (node: AnalysisGraphNode) => {
    if (!existingNodeIds.has(node.id)) {
      existingNodeIds.add(node.id);
      nodes.push(node);
    }
  };

  const addEdge = (edge: AnalysisGraphEdge) => {
    if (existingNodeIds.has(edge.source) && existingNodeIds.has(edge.target) && edge.source !== edge.target) {
      edges.push(edge);
    }
  };

  const resultMap = new Map<string, PersonaResult>(results.map((r) => [r.personaId, r]));

  // 1. Demographic Cluster Nodes
  const clusterSuccessRates = new Map<number, { count: number; successCount: number }>();
  for (const p of personas) {
    const cId = p.clusterId ?? 0;
    if (!clusterSuccessRates.has(cId)) clusterSuccessRates.set(cId, { count: 0, successCount: 0 });
    const stat = clusterSuccessRates.get(cId)!;
    stat.count++;
    const r = resultMap.get(p.id);
    if (r?.outcome === "success") stat.successCount++;
  }

  const effectiveClusters = clusters.length > 0 ? clusters : [
    { poolId, clusterId: 0, label: "General Audience", description: "Default cohort", size: personas.length || 100, topTraits: {} }
  ];

  for (const c of effectiveClusters) {
    const stats = clusterSuccessRates.get(c.clusterId);
    const successRate = stats && stats.count > 0 ? Math.round((stats.successCount / stats.count) * 100) : 50;
    const color = CLUSTER_COLORS[Math.abs(c.clusterId) % CLUSTER_COLORS.length] ?? "#BDA6CE";

    addNode({
      id: `cluster-${c.clusterId}`,
      label: c.label,
      kind: "cluster",
      val: Math.max(5, Math.min(12, Math.round(Math.sqrt(c.size) * 1.2))),
      color,
      clusterId: c.clusterId,
      description: c.description,
      metrics: {
        cohortSize: c.size,
        successRate: `${successRate}%`,
        clusterId: c.clusterId,
      },
    });
  }

  // 2. Journey Funnel Milestone Nodes
  const defaultFunnel: FunnelStep[] = [
    { id: "landing", name: "Landing Page", order: 1, reachedCount: personas.length || 100, dropOffCount: 10, conversionPct: 1, dropOffPct: 0.1 },
    { id: "product", name: "Product View", order: 2, reachedCount: Math.round((personas.length || 100) * 0.9), dropOffCount: 20, conversionPct: 0.9, dropOffPct: 0.22 },
    { id: "cart", name: "Add to Cart", order: 3, reachedCount: Math.round((personas.length || 100) * 0.7), dropOffCount: 25, conversionPct: 0.7, dropOffPct: 0.35 },
    { id: "checkout", name: "Checkout Form", order: 4, reachedCount: Math.round((personas.length || 100) * 0.45), dropOffCount: 15, conversionPct: 0.45, dropOffPct: 0.33 },
    { id: "success", name: "Order Complete", order: 5, reachedCount: Math.round((personas.length || 100) * 0.3), dropOffCount: 0, conversionPct: 0.3, dropOffPct: 0 },
  ];
  const effectiveFunnel = funnel && funnel.length > 0 ? funnel : defaultFunnel;

  for (let i = 0; i < effectiveFunnel.length; i++) {
    const step = effectiveFunnel[i]!;
    const nodeId = `funnel-${step.order}`;
    addNode({
      id: nodeId,
      label: `${step.order}. ${step.name}`,
      kind: "funnel",
      val: 6,
      color: "#9B8EC7", // Material You Purple
      description: `Reached by ${step.reachedCount} agents with ${Math.round(step.dropOffPct * 100)}% drop-off.`,
      metrics: {
        stage: step.name,
        reachedCount: step.reachedCount,
        dropOffCount: step.dropOffCount,
        conversion: `${Math.round(step.conversionPct * 100)}%`,
      },
    });

    if (i > 0) {
      const prevStep = effectiveFunnel[i - 1]!;
      addEdge({
        source: `funnel-${prevStep.order}`,
        target: nodeId,
        kind: "funnel_flow",
        weight: Math.max(0.2, step.conversionPct),
        label: `${Math.round(step.conversionPct * 100)}% progression`,
      });
    }
  }

  // 3. Clustered UX Friction / Issue Nodes
  const effectiveIssues = issues.length > 0 ? issues : [
    {
      issueId: "demo-issue-1",
      title: "Confusing Checkout CTA",
      severity: "high" as const,
      affectedPersonas: 42,
      affectedClusters: [0],
      suggestedFix: "Increase button contrast and elevate above the fold",
      evidence: [],
    },
    {
      issueId: "demo-issue-2",
      title: "Hidden Shipping Fees at Step 4",
      severity: "medium" as const,
      affectedPersonas: 28,
      affectedClusters: [0],
      suggestedFix: "Display estimated shipping upfront in cart view",
      evidence: [],
    },
  ];

  let topBottleneckTitle = effectiveIssues[0]?.title ?? "Checkout friction";

  for (const issue of effectiveIssues) {
    const issueNodeId = `issue-${issue.issueId}`;
    const isHigh = issue.severity === "high";
    const isMedium = issue.severity === "medium";
    const color = isHigh ? "#F28B82" : isMedium ? "#FDD663" : "#B4D3D9";

    addNode({
      id: issueNodeId,
      label: issue.title,
      kind: "issue",
      val: isHigh ? 8 : isMedium ? 6 : 4,
      color,
      severity: issue.severity,
      description: issue.suggestedFix ? `Fix: ${issue.suggestedFix}` : undefined,
      suggestedFix: issue.suggestedFix,
      metrics: {
        severity: issue.severity.toUpperCase(),
        affectedAgents: issue.affectedPersonas,
      },
    });

    // Link issue to affected clusters
    for (const cId of issue.affectedClusters) {
      const clusterNodeId = `cluster-${cId}`;
      addEdge({
        source: clusterNodeId,
        target: issueNodeId,
        kind: "experienced_friction",
        weight: 0.8,
        label: "experienced issue",
      });
    }

    // Connect issue to probable funnel drop-off stage
    const titleLower = issue.title.toLowerCase();
    let targetFunnelOrder = 4; // default checkout
    if (titleLower.includes("landing") || titleLower.includes("banner") || titleLower.includes("header")) targetFunnelOrder = 1;
    else if (titleLower.includes("search") || titleLower.includes("product") || titleLower.includes("filter")) targetFunnelOrder = 2;
    else if (titleLower.includes("cart") || titleLower.includes("basket") || titleLower.includes("quantity")) targetFunnelOrder = 3;
    else if (titleLower.includes("payment") || titleLower.includes("checkout") || titleLower.includes("shipping")) targetFunnelOrder = 4;
    else if (titleLower.includes("confirmation") || titleLower.includes("success") || titleLower.includes("order")) targetFunnelOrder = 5;

    addEdge({
      source: issueNodeId,
      target: `funnel-${targetFunnelOrder}`,
      kind: "caused_drop_off",
      weight: isHigh ? 0.9 : 0.6,
      label: "triggered abandonment",
    });
  }

  // 4. Sample Tested Persona Exemplars (Exemplar Agents)
  const samplePersonas = personas.slice(0, Math.min(8, personas.length));
  for (const p of samplePersonas) {
    const r = resultMap.get(p.id);
    const pNodeId = `persona-${p.id}`;
    const outcome = r?.outcome ?? "success";
    const color = outcome === "success" ? "#81C995" : outcome === "failure" ? "#F28B82" : "#FDD663";

    addNode({
      id: pNodeId,
      label: `${p.traits.occupation ?? "User"} (${p.traits.device})`,
      kind: "persona",
      val: 3,
      color,
      status: outcome,
      description: p.backstory,
      metrics: {
        outcome: outcome.toUpperCase(),
        device: p.traits.device,
        region: p.traits.region,
        sentiment: r?.sentiment ?? 0,
      },
    });

    // Link persona to its demographic cluster
    if (p.clusterId !== null && p.clusterId !== undefined) {
      addEdge({
        source: pNodeId,
        target: `cluster-${p.clusterId}`,
        kind: "belongs_to",
        weight: 0.5,
        label: "member",
      });
    }

    // If failed, link persona to top issue
    if (outcome === "failure" && effectiveIssues.length > 0) {
      const targetIssue = effectiveIssues[0]!;
      addEdge({
        source: pNodeId,
        target: `issue-${targetIssue.issueId}`,
        kind: "experienced_friction",
        weight: 0.7,
        label: "blocked",
      });
    }
  }

  return {
    runId,
    poolId,
    title: `Run Analysis Graph #${runId.slice(0, 8)}`,
    summary: `Synthesized network of ${nodes.length} nodes and ${edges.length} causal links connecting persona cohorts, UX frictions, and journey milestones.`,
    nodes,
    edges,
    metrics: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      clustersCount: effectiveClusters.length,
      issuesCount: effectiveIssues.length,
      funnelStagesCount: effectiveFunnel.length,
      topBottleneck: topBottleneckTitle,
    },
    generatedAt: new Date().toISOString(),
  };
}
