"use client";

import React, { useState, useId, useRef } from "react";
import Link from "next/link";
import {
  Share2,
  TrendingUp,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Smile,
  ThumbsUp,
  Sliders,
  RefreshCw,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MessageSquare,
  Mail,
  Rocket,
  Info,
  ExternalLink,
  Network,
  Users,
  ShieldAlert,
  Flame,
  ArrowRight,
} from "lucide-react";
import type { SpreadResult } from "@testhive/contracts";
import { AdoptionCurve } from "@/components/charts/adoption-curve";

export interface SpreadData {
  runId: string;
  rounds: { round: number; newAdopters: string[]; cumulativeAdopters: number }[];
  params?: {
    rounds?: number;
    seedStrategy?: "positive_verdict" | "random";
    seed?: number;
  };
  totalReached: number;
  poolSize: number;
}

export interface WordOfMouthViewProps {
  spread?: SpreadData | null;
  activeRunId?: string;
  isSimulating?: boolean;
  onRerunSpread?: () => Promise<void> | void;
}

interface NetworkNode {
  id: string;
  label: string;
  role: string;
  cluster: "seed" | "peer" | "detractor";
  cx: number;
  cy: number;
  r: number;
  round: number;
  connections: number;
  shares: number;
  sentiment: number; // -1 to 1
  quote: string;
  channel: "slacks" | "twitter" | "direct" | "hn";
}

const NETWORK_NODES: NetworkNode[] = [
  // Seed Champions (Amber / Gold Hubs)
  {
    id: "#A2",
    label: "Seed #A2",
    role: "Lead Architect • Enterprise Fintech",
    cluster: "seed",
    cx: 280,
    cy: 215,
    r: 16,
    round: 1,
    connections: 14,
    shares: 18,
    sentiment: 0.92,
    quote:
      "Cut test cycle from 4 days to 45 mins using synthetic clusters. 3 architects spun it up within the hour.",
    channel: "slacks",
  },
  {
    id: "#B1",
    label: "Seed #B1",
    role: "VP Engineering • Cloud Commerce",
    cluster: "seed",
    cx: 620,
    cy: 225,
    r: 18,
    round: 1,
    connections: 22,
    shares: 29,
    sentiment: 0.88,
    quote:
      "Cascaded the benchmark across 4 product teams. Instant consensus on checkout latency.",
    channel: "twitter",
  },
  {
    id: "#H3",
    label: "Seed #H3",
    role: "Staff Platform Eng • DevTools Inc",
    cluster: "seed",
    cx: 735,
    cy: 115,
    r: 14,
    round: 1,
    connections: 16,
    shares: 21,
    sentiment: 0.85,
    quote:
      "Behavioral simulation showed realistic friction curves that mirror our real production telemetry.",
    channel: "hn",
  },

  // 2nd-Degree Peers (Lavender)
  {
    id: "#C1",
    label: "Peer #C1",
    role: "Senior Frontend Lead • SaaS Platform",
    cluster: "peer",
    cx: 380,
    cy: 125,
    r: 12,
    round: 2,
    connections: 9,
    shares: 8,
    sentiment: 0.76,
    quote:
      "The telemetry on checkout drop-off caught edge cases our manual tester cohorts completely missed.",
    channel: "slacks",
  },
  {
    id: "#C2",
    label: "Peer #C2",
    role: "Principal QA Engineer • Logistics Systems",
    cluster: "peer",
    cx: 180,
    cy: 305,
    r: 11,
    round: 2,
    connections: 11,
    shares: 12,
    sentiment: 0.81,
    quote:
      "Automated edge case synthesis replaced 3 weeks of manual regression testing.",
    channel: "direct",
  },
  {
    id: "#C3",
    label: "Peer #C3",
    role: "Product Manager • Growth & Onboarding",
    cluster: "peer",
    cx: 460,
    cy: 185,
    r: 10,
    round: 2,
    connections: 8,
    shares: 6,
    sentiment: 0.72,
    quote:
      "Visual funnel bottlenecks gave engineering concrete evidence to simplify step 3.",
    channel: "slacks",
  },
  {
    id: "#C4",
    label: "Peer #C4",
    role: "Site Reliability Eng • Microservices",
    cluster: "peer",
    cx: 350,
    cy: 295,
    r: 9,
    round: 3,
    connections: 7,
    shares: 5,
    sentiment: 0.69,
    quote:
      "Survives stress test simulation with sub-100ms response targets across 1,000 agents.",
    channel: "twitter",
  },
  {
    id: "#C5",
    label: "Peer #C5",
    role: "Engineering Manager • Payments Core",
    cluster: "peer",
    cx: 480,
    cy: 90,
    r: 8,
    round: 3,
    connections: 6,
    shares: 4,
    sentiment: 0.75,
    quote:
      "Recommended adopting this for pre-commit automated persona smoke testing.",
    channel: "slacks",
  },
  {
    id: "#C6",
    label: "Peer #C6",
    role: "Full Stack Developer • ScaleUp",
    cluster: "peer",
    cx: 110,
    cy: 340,
    r: 7,
    round: 4,
    connections: 5,
    shares: 3,
    sentiment: 0.64,
    quote: "Very straightforward to spin up locally with bun and docker-free runners.",
    channel: "hn",
  },
  {
    id: "#C7",
    label: "Peer #C7",
    role: "Staff Mobile Architect • iOS Core",
    cluster: "peer",
    cx: 770,
    cy: 235,
    r: 12,
    round: 2,
    connections: 12,
    shares: 11,
    sentiment: 0.83,
    quote:
      "Demonstrated how touch latency causes dropoff in multi-screen checkout modals.",
    channel: "slacks",
  },
  {
    id: "#C8",
    label: "Peer #C8",
    role: "Staff Data Scientist • Search Team",
    cluster: "peer",
    cx: 860,
    cy: 175,
    r: 11,
    round: 3,
    connections: 10,
    shares: 7,
    sentiment: 0.78,
    quote:
      "Persona distribution clustering provides statistically meaningful behavioral variance.",
    channel: "twitter",
  },
  {
    id: "#C9",
    label: "Peer #C9",
    role: "Developer Advocate • Community",
    cluster: "peer",
    cx: 690,
    cy: 345,
    r: 9,
    round: 3,
    connections: 8,
    shares: 9,
    sentiment: 0.86,
    quote:
      "Sharing synthetic benchmark recordings on Twitter triggered 20+ direct inbound requests.",
    channel: "twitter",
  },
  {
    id: "#C10",
    label: "Peer #C10",
    role: "UX Researcher • Design Systems",
    cluster: "peer",
    cx: 890,
    cy: 85,
    r: 8,
    round: 4,
    connections: 6,
    shares: 5,
    sentiment: 0.71,
    quote:
      "Heatmaps and friction notes translate directly into actionable design tickets.",
    channel: "slacks",
  },
  {
    id: "#C11",
    label: "Peer #C11",
    role: "Security Analyst • Identity",
    cluster: "peer",
    cx: 945,
    cy: 230,
    r: 9,
    round: 4,
    connections: 7,
    shares: 4,
    sentiment: 0.67,
    quote: "Identified password reset friction that increased abandoned accounts by 18%.",
    channel: "direct",
  },
  {
    id: "#C12",
    label: "Peer #C12",
    role: "Solutions Architect • Enterprise",
    cluster: "peer",
    cx: 980,
    cy: 140,
    r: 7,
    round: 5,
    connections: 5,
    shares: 3,
    sentiment: 0.65,
    quote: "Customer procurement team was satisfied by the local execution mode.",
    channel: "direct",
  },

  // Detractors / Skeptics (Ruby / Coral)
  {
    id: "#D1",
    label: "Skeptic #D1",
    role: "Staff Security Architect • HealthTech",
    cluster: "detractor",
    cx: 160,
    cy: 130,
    r: 10,
    round: 2,
    connections: 6,
    shares: 0,
    sentiment: -0.18,
    quote:
      "Behavioral simulation is accurate, but requires explicit guarantees on synthetic data residency.",
    channel: "direct",
  },
  {
    id: "#D2",
    label: "Skeptic #D2",
    role: "Infra Director • Compliance Office",
    cluster: "detractor",
    cx: 550,
    cy: 320,
    r: 11,
    round: 3,
    connections: 8,
    shares: 0,
    sentiment: -0.32,
    quote:
      "Need SOC2 Type II report before allowing production API keys into automated test loops.",
    channel: "slacks",
  },
  {
    id: "#D3",
    label: "Skeptic #D3",
    role: "Chief Privacy Officer • FinServ",
    cluster: "detractor",
    cx: 480,
    cy: 380,
    r: 7,
    round: 4,
    connections: 4,
    shares: 0,
    sentiment: -0.45,
    quote:
      "Blocked team rollout pending legal review of persona generation data provenance.",
    channel: "direct",
  },
  {
    id: "#D4",
    label: "Skeptic #D4",
    role: "Lead DevOps • Legacy Banking",
    cluster: "detractor",
    cx: 880,
    cy: 310,
    r: 10,
    round: 3,
    connections: 7,
    shares: 1,
    sentiment: -0.15,
    quote:
      "Our firewall currently blocks dynamic websocket endpoints used by live inspector.",
    channel: "slacks",
  },
  {
    id: "#D5",
    label: "Skeptic #D5",
    role: "Procurement Lead • GovTech",
    cluster: "detractor",
    cx: 975,
    cy: 340,
    r: 8,
    round: 5,
    connections: 4,
    shares: 0,
    sentiment: -0.28,
    quote:
      "Requires self-hosted airgapped distribution package for defense contractor evaluation.",
    channel: "direct",
  },
];

export function WordOfMouthView({
  spread,
  activeRunId,
  isSimulating = false,
  onRerunSpread,
}: WordOfMouthViewProps) {
  const [viewMode, setViewMode] = useState<"clusters" | "cascade" | "curve">("clusters");
  const [selectedNodeId, setSelectedNodeId] = useState<string>("#A2");
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [transcriptFilter, setTranscriptFilter] = useState<"all" | "advocate" | "friction">("all");
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Interactive Sensitivity Weights
  const [wowFactor, setWowFactor] = useState<number>(84);
  const [frictionDecay, setFrictionDecay] = useState<number>(28);
  const [socialProof, setSocialProof] = useState<number>(72);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Dynamic calculated KPI metrics based on sliders and spread
  const calculatedKFactor = (
    (wowFactor * 1.4 - frictionDecay * 0.7 + socialProof * 0.5) / 100 * 1.25
  ).toFixed(2);
  const calculatedNPS = Math.round(
    20 + wowFactor * 0.35 - frictionDecay * 0.3 + socialProof * 0.2
  );
  const calculatedVelocity = (
    1.8 +
    (wowFactor / 100) * 1.8 -
    (frictionDecay / 100) * 0.8 +
    (socialProof / 100) * 0.5
  ).toFixed(1);
  const calculatedValence = Math.round(
    55 + wowFactor * 0.3 - frictionDecay * 0.2 + socialProof * 0.15
  );

  const activeNode =
    NETWORK_NODES.find((n) => n.id === (hoveredNodeId || selectedNodeId)) ||
    NETWORK_NODES[0];

  function resetSensitivity() {
    setWowFactor(84);
    setFrictionDecay(28);
    setSocialProof(72);
  }

  function exportSvg() {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `testhive-word-of-mouth-network-${activeRunId ? activeRunId.slice(0, 8) : "graph"}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Filtered Transcripts
  const filteredNodes = NETWORK_NODES.filter((n) => {
    if (channelFilter !== "all" && n.channel !== channelFilter) return false;
    if (transcriptFilter === "advocate" && n.sentiment < 0.5) return false;
    if (transcriptFilter === "friction" && n.sentiment >= 0) return false;
    return true;
  });

  const curveData = spread
    ? spread.rounds.map((r) => ({
        round: r.round,
        cumulativeAdopters: r.cumulativeAdopters,
      }))
    : [];

  const poolSize = spread?.poolSize || 1000;
  const totalReached = spread?.totalReached || 780;
  const reachPercentage = Math.round((totalReached / poolSize) * 100);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* HEADER SECTION                                                           */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-lavender-tint text-primary border border-border-accent-tint">
              Stage 3 • Synthetic Network Cascade
            </span>
            <span className="text-xs text-text-tertiary">
              • {poolSize.toLocaleString()} Autonomous Personas Simulated
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-honey-tint/80 border border-status-warning-border text-honey-dark font-bold">
              Barabási–Albert Graph
            </span>
          </div>

          <h2 className="text-2xl lg:text-3xl font-extrabold text-text-primary tracking-tight">
            Viral Coefficient &amp; Organic Word-of-Mouth Network
          </h2>
          <p className="text-xs sm:text-sm text-text-muted mt-1 max-w-3xl">
            Simulating synthetic social sharing, sentiment cascades, and viral loops across peer networks.
          </p>
        </div>

        {/* Right Trailing Status & Simulation Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Epoch Status Pill */}
          <div className="flex items-center gap-2 bg-surface-white border border-border-warm rounded-full px-3.5 py-1.5 text-xs shadow-xs">
            <span className="text-text-muted font-medium">Epoch:</span>
            <span className="font-mono font-bold text-primary">
              Round {spread?.rounds?.length || 6} / 6
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-border-warm" />
            <span className="flex items-center gap-1.5 text-status-success font-semibold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
              Cascade Converged
            </span>
          </div>

          <button
            onClick={exportSvg}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-surface-white border border-border-warm text-text-muted hover:text-text-primary text-xs font-semibold shadow-xs hover:bg-surface-cream transition-all"
            title="Download Network Graph as SVG"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export SVG</span>
          </button>

          <button
            onClick={() => onRerunSpread && onRerunSpread()}
            disabled={isSimulating || !activeRunId}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-container text-surface-white text-xs font-bold shadow-soft-card hover:opacity-95 transition-all disabled:opacity-50 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? "animate-spin" : ""}`} />
            <span>{isSimulating ? "Simulating Cascade…" : "Re-run 6-Round Cascade"}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. TOP 4 GRAPHICAL KPI INDICATOR CARDS                                   */}
      {/* ========================================================================= */}
      <section aria-label="Key Performance Indicators" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Viral K-Factor */}
        <div className="bg-surface-white p-5 rounded-3xl border border-border-warm shadow-soft-card flex items-center justify-between transition-all hover:shadow-soft-card-hover relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted block">
              Estimated Viral K-Factor
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-text-primary tracking-tight">
                {calculatedKFactor}
              </span>
              <span className="text-xs font-mono text-status-success font-bold">+18%</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-status-success bg-status-success-bg px-2 py-0.5 rounded-full border border-status-success-border">
              <TrendingUp className="w-3 h-3" /> &gt; 1.0 EXPONENTIAL
            </span>
            <p className="text-[11px] text-text-muted mt-2">
              Expansion loop self-sustaining across secondary nodes.
            </p>
          </div>

          {/* Radial Gauge SVG */}
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-surface-cream stroke-current"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeWidth="3.5"
              />
              <path
                className="text-primary-container stroke-current"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeDasharray="78, 100"
                strokeLinecap="round"
                strokeWidth="3.5"
              />
            </svg>
            <TrendingUp className="w-5 h-5 text-primary absolute" />
          </div>
        </div>

        {/* Metric 2: Synthetic NPS */}
        <div className="bg-surface-white p-5 rounded-3xl border border-border-warm shadow-soft-card flex items-center justify-between transition-all hover:shadow-soft-card-hover relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted block">
              Synthetic NPS (sNPS)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-text-primary tracking-tight">
                +{calculatedNPS}
              </span>
              <span className="text-xs text-text-muted font-medium">High Affinity</span>
            </div>
            {/* Segmented Tri-color stack */}
            <div className="flex items-center gap-1 pt-0.5">
              <div className="w-10 h-1.5 rounded-full bg-status-success" title="Promoters 62%" />
              <div className="w-4 h-1.5 rounded-full bg-honey-light" title="Passives 22%" />
              <div className="w-2.5 h-1.5 rounded-full bg-status-error" title="Detractors 16%" />
              <span className="text-[10px] font-mono text-status-success font-bold ml-1">62% P</span>
            </div>
            <p className="text-[11px] text-text-muted mt-2">
              Benchmark: +32 (SaaS) • <span className="text-status-success font-semibold">+14 pts</span>
            </p>
          </div>

          {/* Radial NPS Gauge */}
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-surface-cream stroke-current"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeWidth="3.5"
              />
              <path
                className="text-honey-dark stroke-current"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeDasharray="64, 100"
                strokeLinecap="round"
                strokeWidth="3.5"
              />
            </svg>
            <Smile className="w-5 h-5 text-honey-dark absolute" />
          </div>
        </div>

        {/* Metric 3: Referral Velocity */}
        <div className="bg-surface-white p-5 rounded-3xl border border-border-warm shadow-soft-card flex items-center justify-between transition-all hover:shadow-soft-card-hover relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted block">
              Referral Velocity
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-text-primary tracking-tight">
                {calculatedVelocity}
              </span>
              <span className="text-xs text-text-muted">shares / user / wk</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-dark bg-cyan-tint px-2 py-0.5 rounded-full">
              <Zap className="w-3 h-3" /> 41.2h CYCLE
            </span>
            <p className="text-[11px] text-text-muted mt-2">
              Propagation cycle clocks at 41.2 hours per peer invitation.
            </p>
          </div>

          {/* Area Sparkline */}
          <div className="w-20 h-12 flex items-end shrink-0">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 80 40">
              <defs>
                <linearGradient id="velocityFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#1C5B66" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#1C5B66" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0,34 Q 15,30 25,24 T 50,15 T 80,4 L 80,40 L 0,40 Z" fill="url(#velocityFill)" />
              <path
                d="M 0,34 Q 15,30 25,24 T 50,15 T 80,4"
                fill="none"
                stroke="#1C5B66"
                strokeLinecap="round"
                strokeWidth="2.5"
              />
              <circle cx="80" cy="4" fill="#1C5B66" r="3.5" />
            </svg>
          </div>
        </div>

        {/* Metric 4: Advocacy Valence */}
        <div className="bg-surface-white p-5 rounded-3xl border border-border-warm shadow-soft-card flex items-center justify-between transition-all hover:shadow-soft-card-hover relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted block">
              Advocacy Valence
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-status-success tracking-tight">
                {calculatedValence}%
              </span>
              <span className="text-[10px] font-mono text-text-tertiary">7% CRIT</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-lavender-tint px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> HIGH ADVOCACY
            </span>
            <p className="text-[11px] text-text-muted mt-2">
              Neutral: 15% • Technical advocacy with minimal reputational risk.
            </p>
          </div>

          {/* Radial Dial */}
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-surface-cream stroke-current"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeWidth="3.5"
              />
              <path
                className="text-status-success stroke-current"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeDasharray="78, 100"
                strokeLinecap="round"
                strokeWidth="3.5"
              />
            </svg>
            <ThumbsUp className="w-5 h-5 text-status-success absolute" />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. MAIN VISUAL SHOWCASE: NETWORK CANVAS & CLUSTER VISUALIZER             */}
      {/* ========================================================================= */}
      <section className="bg-surface-white border border-border-warm rounded-3xl p-6 shadow-soft-card relative overflow-hidden">
        {/* Canvas Toolbar & Cluster Indicators */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border-subtle">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-honey-tint/80 border border-status-warning-border text-xs font-semibold text-honey-dark">
              <span className="w-2.5 h-2.5 rounded-full bg-honey-light shadow-xs animate-pulse" />
              <span>Seed Champions</span>
              <span className="font-mono text-[11px] font-bold text-text-primary ml-1">150</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-lavender-tint/80 border border-border-accent-tint text-xs font-semibold text-primary">
              <span className="w-2.5 h-2.5 rounded-full bg-lavender-light shadow-xs" />
              <span>2nd-Degree Peers</span>
              <span className="font-mono text-[11px] font-bold text-text-primary ml-1">540</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-error-bg/80 border border-status-error border-opacity-20 text-xs font-semibold text-status-error">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs" />
              <span>Skeptics &amp; Detractors</span>
              <span className="font-mono text-[11px] font-bold text-text-primary ml-1">310</span>
            </div>
          </div>

          {/* View Modes & Zoom Controls */}
          <div className="flex items-center gap-1.5 bg-surface-cream/80 p-1.5 rounded-2xl border border-border-warm">
            <button
              onClick={() => setViewMode("clusters")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === "clusters"
                  ? "bg-surface-white text-primary shadow-xs"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Clusters</span>
            </button>

            <button
              onClick={() => setViewMode("cascade")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === "cascade"
                  ? "bg-surface-white text-primary shadow-xs"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Cascade Flow</span>
            </button>

            <button
              onClick={() => setViewMode("curve")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === "curve"
                  ? "bg-surface-white text-primary shadow-xs"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Adoption Curve</span>
            </button>

            <div className="h-4 w-px bg-border-warm mx-1" />

            <button
              onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-white transition-all"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-white transition-all"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setZoomLevel(1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-white transition-all"
              title="Reset Zoom"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* View Mode 1 & 2: Interactive SVG Network Canvas */}
        {viewMode !== "curve" && (
          <div className="relative w-full h-[440px] mt-4 bg-canvas-ivory rounded-2xl border border-border-warm overflow-hidden flex items-center justify-center">
            {/* Coordinate Grid Background */}
            <div
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(#887FCE 1.2px, transparent 1.2px)",
                backgroundSize: "32px 32px",
              }}
            />

            {/* SVG Interactive Topology */}
            <svg
              ref={svgRef}
              className="w-full h-full transition-transform duration-300"
              style={{ transform: `scale(${zoomLevel})` }}
              viewBox="0 0 1100 440"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="edgeGoldPurple" x1="0%" x2="100%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#887FCE" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="edgePurpleRed" x1="0%" x2="100%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#887FCE" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0.75" />
                </linearGradient>
                <linearGradient id="edgeCenterBridge" x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.95" />
                  <stop offset="50%" stopColor="#756BBF" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.95" />
                </linearGradient>

                <filter id="hubGlowAmber" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="10" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="hubGlowLavender" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Connecting Edges */}
              {/* Cluster Left */}
              <line x1="280" y1="215" x2="160" y2="130" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.65" />
              <line x1="280" y1="215" x2="180" y2="305" stroke="#887FCE" strokeWidth="2.2" opacity="0.8" />
              <line x1="280" y1="215" x2="380" y2="125" stroke="url(#edgeGoldPurple)" strokeWidth="3" />
              <line x1="280" y1="215" x2="350" y2="295" stroke="#887FCE" strokeWidth="2.2" opacity="0.85" />
              <line x1="180" y1="305" x2="110" y2="340" stroke="#887FCE" strokeWidth="1.5" opacity="0.6" />
              <line x1="380" y1="125" x2="480" y2="90" stroke="#887FCE" strokeWidth="2" opacity="0.75" />
              <line x1="380" y1="125" x2="460" y2="185" stroke="#887FCE" strokeWidth="2.2" opacity="0.85" />

              {/* Central Viral Bridge */}
              <line x1="280" y1="215" x2="620" y2="225" stroke="url(#edgeCenterBridge)" strokeWidth="4.5" strokeLinecap="round" />
              <line x1="380" y1="125" x2="620" y2="225" stroke="url(#edgeGoldPurple)" strokeWidth="2.8" />
              <line x1="460" y1="185" x2="620" y2="225" stroke="#756BBF" strokeWidth="2.5" opacity="0.8" />

              {/* Cluster Right */}
              <line x1="620" y1="225" x2="550" y2="320" stroke="url(#edgePurpleRed)" strokeWidth="2.2" />
              <line x1="550" y1="320" x2="480" y2="380" stroke="#EF4444" strokeWidth="1.8" strokeDasharray="2 2" opacity="0.7" />
              <line x1="620" y1="225" x2="735" y2="115" stroke="url(#edgeGoldPurple)" strokeWidth="3.2" />
              <line x1="620" y1="225" x2="770" y2="235" stroke="#887FCE" strokeWidth="2.5" opacity="0.85" />
              <line x1="620" y1="225" x2="690" y2="345" stroke="#887FCE" strokeWidth="2" opacity="0.75" />

              {/* Far Right Tertiary Cluster */}
              <line x1="735" y1="115" x2="890" y2="85" stroke="#887FCE" strokeWidth="2" opacity="0.75" />
              <line x1="735" y1="115" x2="860" y2="175" stroke="#756BBF" strokeWidth="2.4" opacity="0.8" />
              <line x1="770" y1="235" x2="860" y2="175" stroke="#887FCE" strokeWidth="2" opacity="0.75" />
              <line x1="770" y1="235" x2="945" y2="230" stroke="#887FCE" strokeWidth="2.2" opacity="0.8" />
              <line x1="770" y1="235" x2="880" y2="310" stroke="url(#edgePurpleRed)" strokeWidth="2" />
              <line x1="880" y1="310" x2="975" y2="340" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.6" />
              <line x1="860" y1="175" x2="980" y2="140" stroke="#887FCE" strokeWidth="1.8" opacity="0.7" />

              {/* Render Interactive Nodes */}
              {NETWORK_NODES.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isHovered = hoveredNodeId === node.id;
                const isSeed = node.cluster === "seed";
                const isDetractor = node.cluster === "detractor";

                let fill = "#887FCE";
                if (isSeed) fill = "#F59E0B";
                if (isDetractor) fill = "#EF4444";

                return (
                  <g
                    key={node.id}
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => setSelectedNodeId(node.id)}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                  >
                    {/* Pulsing Outer Rings on Hub Nodes */}
                    {isSeed && (
                      <circle
                        cx={node.cx}
                        cy={node.cy}
                        r={node.r + 14}
                        fill="#F59E0B"
                        opacity={isHovered || isSelected ? 0.35 : 0.18}
                        className="animate-pulse"
                      />
                    )}

                    {/* Outer selection ring */}
                    {(isSelected || isHovered) && (
                      <circle
                        cx={node.cx}
                        cy={node.cy}
                        r={node.r + 7}
                        fill="none"
                        stroke={isSeed ? "#F59E0B" : isDetractor ? "#EF4444" : "#756BBF"}
                        strokeWidth="2.5"
                        strokeDasharray={isDetractor ? "3 3" : undefined}
                      />
                    )}

                    {/* Main Node Circle */}
                    <circle
                      cx={node.cx}
                      cy={node.cy}
                      r={node.r}
                      fill={fill}
                      filter={
                        isSeed
                          ? "url(#hubGlowAmber)"
                          : node.id === "#H3"
                          ? "url(#hubGlowLavender)"
                          : undefined
                      }
                      stroke="#FFFFFF"
                      strokeWidth={isSeed ? 3.5 : 2.2}
                    />

                    {/* Node ID label when selected or in cascade mode */}
                    {(isSelected || isHovered || viewMode === "cascade") && (
                      <text
                        x={node.cx}
                        y={node.cy - node.r - 8}
                        textAnchor="middle"
                        fill="#18181B"
                        fontSize="11"
                        fontWeight="700"
                        fontFamily="monospace"
                        className="pointer-events-none select-none drop-shadow-xs"
                      >
                        {viewMode === "cascade" ? `R${node.round} • ${node.id}` : node.id}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Interactive Inspector Pill for Hovered / Selected Node */}
            <div className="absolute bottom-4 left-4 bg-surface-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-border-warm shadow-md flex items-start gap-3.5 z-10 max-w-md transition-all">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                  activeNode.cluster === "seed"
                    ? "bg-honey-tint text-honey-dark border border-status-warning-border"
                    : activeNode.cluster === "detractor"
                    ? "bg-status-error-bg text-status-error border border-status-error-border"
                    : "bg-lavender-tint text-primary border border-border-accent-tint"
                }`}
              >
                {activeNode.id}
              </div>

              <div className="text-xs space-y-1">
                <div className="font-bold text-text-primary flex items-center gap-2">
                  <span>{activeNode.role}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      activeNode.cluster === "seed"
                        ? "bg-honey-dark"
                        : activeNode.cluster === "detractor"
                        ? "bg-status-error"
                        : "bg-status-success"
                    }`}
                  />
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-surface-cream text-text-muted">
                    Round {activeNode.round}
                  </span>
                </div>

                <div className="text-[11px] text-text-muted flex items-center gap-3">
                  <span>{activeNode.connections} peer connections</span>
                  <span>•</span>
                  <span className="font-semibold text-primary">{activeNode.shares} shares sent</span>
                  <span>•</span>
                  <span
                    className={
                      activeNode.sentiment >= 0
                        ? "text-status-success font-semibold"
                        : "text-status-error font-semibold"
                    }
                  >
                    Sentiment: {activeNode.sentiment > 0 ? `+${activeNode.sentiment}` : activeNode.sentiment}
                  </span>
                </div>

                <p className="text-[11px] text-text-primary italic border-t border-border-subtle pt-1 mt-1 line-clamp-2">
                  &ldquo;{activeNode.quote}&rdquo;
                </p>
              </div>
            </div>

            {/* Minimal Quick Cascade Telemetry Pill */}
            <div className="absolute top-4 right-4 bg-surface-white/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-border-warm shadow-xs flex items-center gap-3 text-xs">
              <span className="text-text-muted font-medium">Density:</span>
              <span className="font-mono font-bold text-primary">0.64</span>
              <span className="text-border-warm">|</span>
              <span className="text-text-muted font-medium">Cascade:</span>
              <span className="font-mono font-bold text-honey-dark">2.8x</span>
              <span className="text-border-warm">|</span>
              <span className="text-text-muted font-medium">Half-life:</span>
              <span className="font-mono font-bold text-status-success">18.4d</span>
            </div>
          </div>
        )}

        {/* View Mode 3: Adoption Curve Chart */}
        {viewMode === "curve" && (
          <div className="mt-4 p-4 rounded-2xl bg-canvas-ivory border border-border-warm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border-subtle">
              <div>
                <h4 className="font-bold text-text-primary text-sm">
                  Adoption Curve (Cumulative Adopters Across 6 Cascade Rounds)
                </h4>
                <p className="text-xs text-text-muted">
                  Mathematical modeling of logistic viral spread following Barabási–Albert preferential attachment.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-primary bg-lavender-tint px-3 py-1 rounded-full border border-border-accent-tint">
                {totalReached} / {poolSize} Personas Reached ({reachPercentage}%)
              </span>
            </div>

            <AdoptionCurve data={curveData} poolSize={poolSize} />
          </div>
        )}

        {/* Round-by-Round Progression Breakdown */}
        {spread && spread.rounds && spread.rounds.length > 0 && (
          <div className="mt-6 pt-5 border-t border-border-subtle">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Round-by-Round Progression
              </h4>
              <span className="text-xs text-primary font-semibold">
                Total Reached: {spread.totalReached} of {spread.poolSize} ({reachPercentage}%)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {spread.rounds.map((r) => {
                const pct = Math.round((r.cumulativeAdopters / spread.poolSize) * 100);
                return (
                  <div
                    key={r.round}
                    className="p-3.5 rounded-2xl bg-surface-panel-alt border border-border-warm flex flex-col justify-between hover:border-lavender-light transition-all"
                  >
                    <div className="text-[11px] font-mono text-text-muted">Round {r.round}</div>
                    <div className="text-lg font-extrabold text-text-primary mt-1">
                      +{r.newAdopters.length}{" "}
                      <span className="text-[11px] font-normal text-text-muted">new</span>
                    </div>
                    <div className="w-full bg-surface-cream h-1.5 rounded-full overflow-hidden mt-2">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-[10px] text-primary font-semibold mt-1">
                      {r.cumulativeAdopters} total ({pct}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3. CHANNEL REFERRAL HEATMAP & DIALOGUE TRANSCRIPTS (7 cols)               */}
      {/*    VIRALITY SENSITIVITY WEIGHTS & BOTTLENECK DIAGNOSTICS (5 cols)         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Channel Heatmap & Dialogue Transcripts */}
        <div className="lg:col-span-7 space-y-6">
          {/* Channel Referral Heatmap */}
          <div className="bg-surface-white border border-border-warm rounded-3xl p-6 shadow-soft-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                  Channel Referral Heatmap &amp; Attribution
                </h3>
              </div>
              <span className="text-[11px] font-mono text-text-tertiary">1,500 Invocations</span>
            </div>

            {/* Proportional Stack Bar */}
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-surface-cream">
              <div className="bg-lavender-light h-full" style={{ width: "42%" }} title="Developer Slacks (42%)" />
              <div className="bg-primary h-full" style={{ width: "31%" }} title="X / Tech Threads (31%)" />
              <div className="bg-honey-light h-full" style={{ width: "18%" }} title="Direct Invites (18%)" />
              <div className="bg-status-success h-full" style={{ width: "9%" }} title="Hacker News (9%)" />
            </div>

            {/* Interactive Channels Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <button
                onClick={() => setChannelFilter(channelFilter === "slacks" ? "all" : "slacks")}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  channelFilter === "slacks"
                    ? "bg-lavender-tint border-primary shadow-xs"
                    : "bg-surface-panel-alt border-border-warm/80 hover:border-lavender-light"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="font-mono font-bold text-text-primary text-xs">42%</span>
                </div>
                <div className="text-xs font-bold text-text-primary">Dev Slacks</div>
                <div className="text-[10px] text-text-tertiary font-mono mt-0.5">630 referrals</div>
              </button>

              <button
                onClick={() => setChannelFilter(channelFilter === "twitter" ? "all" : "twitter")}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  channelFilter === "twitter"
                    ? "bg-cyan-tint border-cyan-dark shadow-xs"
                    : "bg-surface-panel-alt border-border-warm/80 hover:border-cyan-dark"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <TrendingUp className="w-4 h-4 text-sky-500" />
                  <span className="font-mono font-bold text-text-primary text-xs">31%</span>
                </div>
                <div className="text-xs font-bold text-text-primary">X / Twitter</div>
                <div className="text-[10px] text-text-tertiary font-mono mt-0.5">465 referrals</div>
              </button>

              <button
                onClick={() => setChannelFilter(channelFilter === "direct" ? "all" : "direct")}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  channelFilter === "direct"
                    ? "bg-honey-tint border-honey-dark shadow-xs"
                    : "bg-surface-panel-alt border-border-warm/80 hover:border-honey-dark"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <Mail className="w-4 h-4 text-honey-dark" />
                  <span className="font-mono font-bold text-text-primary text-xs">18%</span>
                </div>
                <div className="text-xs font-bold text-text-primary">Direct 1-on-1</div>
                <div className="text-[10px] text-text-tertiary font-mono mt-0.5">270 referrals</div>
              </button>

              <button
                onClick={() => setChannelFilter(channelFilter === "hn" ? "all" : "hn")}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  channelFilter === "hn"
                    ? "bg-status-success-bg border-status-success shadow-xs"
                    : "bg-surface-panel-alt border-border-warm/80 hover:border-status-success"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <Rocket className="w-4 h-4 text-emerald-600" />
                  <span className="font-mono font-bold text-text-primary text-xs">9%</span>
                </div>
                <div className="text-xs font-bold text-text-primary">Hacker News</div>
                <div className="text-[10px] text-text-tertiary font-mono mt-0.5">135 referrals</div>
              </button>
            </div>
          </div>

          {/* Simulated Persona Dialogue Transcripts */}
          <div className="bg-surface-white border border-border-warm rounded-3xl p-6 shadow-soft-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                  Simulated Persona Dialogue Transcripts
                </h3>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-surface-cream/80 p-1 rounded-xl border border-border-warm text-xs">
                <button
                  onClick={() => setTranscriptFilter("all")}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    transcriptFilter === "all"
                      ? "bg-surface-white text-primary shadow-xs"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  All ({NETWORK_NODES.length})
                </button>
                <button
                  onClick={() => setTranscriptFilter("advocate")}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    transcriptFilter === "advocate"
                      ? "bg-surface-white text-status-success shadow-xs"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  Advocates (+)
                </button>
                <button
                  onClick={() => setTranscriptFilter("friction")}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    transcriptFilter === "friction"
                      ? "bg-surface-white text-status-error shadow-xs"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  Friction &amp; Skeptics (-)
                </button>
              </div>
            </div>

            {/* Transcript Cards Stack */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {filteredNodes.slice(0, 6).map((node) => {
                const isPositive = node.sentiment >= 0;
                return (
                  <div
                    key={node.id}
                    className={`p-4 rounded-2xl bg-surface-panel-alt border border-border-warm border-l-4 transition-all hover:bg-surface-white ${
                      node.cluster === "seed"
                        ? "border-l-primary"
                        : node.cluster === "detractor"
                        ? "border-l-rose-500"
                        : "border-l-lavender-light"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                            node.cluster === "seed"
                              ? "bg-lavender-tint text-primary"
                              : node.cluster === "detractor"
                              ? "bg-status-error-bg text-status-error"
                              : "bg-surface-cream text-text-primary"
                          }`}
                        >
                          {node.id}
                        </span>
                        <span className="font-bold text-text-primary">{node.role}</span>
                      </div>
                      <span className="text-[11px] font-mono capitalize text-text-tertiary">
                        {node.channel === "slacks"
                          ? "Dev Slack"
                          : node.channel === "twitter"
                          ? "X Thread"
                          : node.channel === "hn"
                          ? "Hacker News"
                          : "Direct Memo"}
                      </span>
                    </div>

                    <p className="text-xs text-text-primary italic leading-relaxed">
                      &ldquo;{node.quote}&rdquo;
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-border-subtle/60 flex items-center justify-between text-[11px] text-text-muted">
                      <span
                        className={`flex items-center gap-1 font-semibold ${
                          isPositive ? "text-status-success" : "text-status-error"
                        }`}
                      >
                        {isPositive ? (
                          <ThumbsUp className="w-3 h-3" />
                        ) : (
                          <ShieldAlert className="w-3 h-3" />
                        )}
                        {isPositive ? "Advocate Pulse" : "Friction Concern"}
                      </span>
                      <span>Referrals: {node.shares}</span>
                      <span className="font-mono">
                        Sentiment: {node.sentiment > 0 ? `+${node.sentiment}` : node.sentiment}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Sensitivity Controls & Loop Bottlenecks */}
        <div className="lg:col-span-5 space-y-6">
          {/* Virality Sensitivity Tuning Widget */}
          <div className="bg-surface-white border border-border-warm rounded-3xl p-6 shadow-soft-card space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                  Sensitivity Weights &amp; Tuning
                </h3>
              </div>
              <button
                onClick={resetSensitivity}
                className="text-[11px] font-bold text-primary hover:underline"
              >
                Reset
              </button>
            </div>

            <p className="text-xs text-text-muted">
              Adjust agent behavioral weights to stress-test word-of-mouth loops under varied market conditions.
            </p>

            {/* Sliders Stack */}
            <div className="space-y-4">
              {/* Slider 1: Product Wow-Factor */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <label htmlFor="slider-wow" className="font-bold text-text-primary">
                    Product Wow-Factor Threshold
                  </label>
                  <span className="font-mono font-bold text-primary bg-lavender-tint px-2 py-0.5 rounded text-[11px]">
                    {wowFactor}% ({wowFactor > 75 ? "High" : wowFactor > 50 ? "Moderate" : "Subtle"})
                  </span>
                </div>
                <input
                  id="slider-wow"
                  type="range"
                  min="0"
                  max="100"
                  value={wowFactor}
                  onChange={(e) => setWowFactor(Number(e.target.value))}
                  className="w-full h-1.5 bg-surface-cream rounded-lg appearance-none cursor-pointer accent-purple"
                />
                <div className="flex justify-between text-[10px] text-text-tertiary mt-1">
                  <span>Subtle Utility (30%)</span>
                  <span>Transformative Eureka (90%)</span>
                </div>
              </div>

              {/* Slider 2: Referral Friction Decay */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <label htmlFor="slider-friction" className="font-bold text-text-primary">
                    Referral Friction Decay
                  </label>
                  <span className="font-mono font-bold text-honey-dark bg-honey-tint px-2 py-0.5 rounded text-[11px]">
                    {frictionDecay}% ({frictionDecay < 35 ? "Low" : frictionDecay < 65 ? "Medium" : "High"})
                  </span>
                </div>
                <input
                  id="slider-friction"
                  type="range"
                  min="0"
                  max="100"
                  value={frictionDecay}
                  onChange={(e) => setFrictionDecay(Number(e.target.value))}
                  className="w-full h-1.5 bg-surface-cream rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-text-tertiary mt-1">
                  <span>Frictionless (1-Click)</span>
                  <span>High Gate (Sign-up Required)</span>
                </div>
              </div>

              {/* Slider 3: Social Proof Sensitivity */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <label htmlFor="slider-social" className="font-bold text-text-primary">
                    Social Proof Sensitivity
                  </label>
                  <span className="font-mono font-bold text-status-success bg-status-success-bg px-2 py-0.5 rounded text-[11px]">
                    {socialProof}% ({socialProof > 65 ? "Strong" : "Independent"})
                  </span>
                </div>
                <input
                  id="slider-social"
                  type="range"
                  min="0"
                  max="100"
                  value={socialProof}
                  onChange={(e) => setSocialProof(Number(e.target.value))}
                  className="w-full h-1.5 bg-surface-cream rounded-lg appearance-none cursor-pointer accent-green-600"
                />
                <div className="flex justify-between text-[10px] text-text-tertiary mt-1">
                  <span>Independent Decision</span>
                  <span>Peer-Validated Dependent</span>
                </div>
              </div>
            </div>

            {/* Action Trigger */}
            <div className="pt-2">
              <button
                onClick={() => onRerunSpread && onRerunSpread()}
                disabled={isSimulating || !activeRunId}
                className="w-full py-2.5 rounded-2xl bg-primary-container text-surface-white font-bold text-xs shadow-soft-card hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? "animate-spin" : ""}`} />
                <span>Re-compute Diffusion Cascade</span>
              </button>
              <div className="text-center text-[10px] text-text-muted mt-2">
                Estimated runtime: ~1.2s across {poolSize.toLocaleString()} synthetic agents
              </div>
            </div>
          </div>

          {/* Loop Diagnostics & Bottleneck Analysis */}
          <div className="bg-surface-white border border-border-warm rounded-3xl p-6 shadow-soft-card space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
              <Flame className="w-4 h-4 text-honey-dark" />
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Viral Loop Bottleneck Analysis
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-cream/50 border border-border-warm/70">
                <CheckCircle2 className="w-4 h-4 text-status-success shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-text-primary flex items-center justify-between">
                    <span>Sandbox Visual Hook</span>
                    <span className="font-mono text-status-success font-bold">+89% Conv</span>
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Conversion spikes when seed agents share links including concrete sandbox snapshots.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-cream/50 border border-border-warm/70">
                <AlertTriangle className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-text-primary flex items-center justify-between">
                    <span>Enterprise Sign-up Gate</span>
                    <span className="font-mono text-status-warning font-bold">-14% Drop</span>
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Mandatory corporate email verification drops peer invitation completion by 14%.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-cream/50 border border-border-warm/70">
                <TrendingUp className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-text-primary flex items-center justify-between">
                    <span>Advocacy Longevity</span>
                    <span className="font-mono text-primary font-bold">18.4 Days</span>
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Active champions continue sending referral pulses for an average of 4.3 weeks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
