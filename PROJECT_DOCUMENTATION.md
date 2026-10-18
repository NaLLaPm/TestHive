# TestHive — Autonomous Synthetic Persona Testing & UX Simulation Platform

> **TestHive** is an AI-native testing framework that spins up hundreds of autonomous synthetic user personas to interact with web applications, discover UX friction, trace conversion funnels, simulate viral adoption spreads, and generate actionable engineering reports.

---

## 1. Core Functionality

TestHive automates user testing and product validation through synthetic simulation:
- **Autonomous Agent Exploration**: Uses headless browser automation (Playwright) orchestrated by synthetic persona agents to test web UI flows end-to-end.
- **Dynamic Persona Generation**: Synthesizes diverse user personas with defined behavioral traits, technical proficiencies, accessibility requirements, and cognitive biases.
- **UX Friction & Funnel Analytics**: Traces user interaction steps, calculates stage-by-stage conversion drop-offs, and pinpoints DOM elements causing user friction.
- **Social Graph & Adoption Spread Simulation**: Models network communities (using Louvain community detection) and simulates product adoption or churn spread across interconnected cohorts.
- **Automated Comprehensive Reporting**: Synthesizes persona test traces into structured executive and technical markdown reports with severity rankings and fix recommendations.

---

## 2. Project Architecture & Modules

TestHive is architected as a high-performance monorepo powered by Bun, Turborepo, TypeScript, Fastify, and Next.js:

```
TestHive/
├── apps/
│   ├── api/          # Fastify REST & Server-Sent Events (SSE) API server
│   └── web/          # Next.js 14 dashboard & Material You visualization UI
├── packages/
│   ├── analytics/    # Conversion funnels, UX friction heatmaps, issue clustering
│   ├── api-client/   # Typed API client and real-time SSE streaming hooks
│   ├── config/       # Shared environment configuration and runtime defaults
│   ├── contracts/    # Zod schemas, TypeScript types, and validation contracts
│   ├── db/           # SQLite database layer with Drizzle ORM and repositories
│   ├── engine/       # Playwright browser manager, orchestrator, and pipeline runner
│   ├── graph/        # Network graphs, Louvain community clustering, and spread simulation
│   ├── llm/          # Multi-provider LLM connector (Google Gemini, Ollama, Fake fallback)
│   ├── personas/     # Persona library, trait sampling, and device profile generator
│   └── report/       # Markdown & structured report synthesis engine
└── demo-site/        # Built-in e-commerce target app (Shopping Time) for benchmarking
```

### Module Breakdown:

| Module | Purpose & Capabilities |
| :--- | :--- |
| **`@testhive/engine`** | **Execution Engine**: Manages headless browser instances via Playwright, executes persona actions (click, fill, navigate, evaluate), captures screenshots, and coordinates run lifecycles. |
| **`@testhive/personas`** | **Persona Synthesis**: Generates persona pools across demographics, tech skill levels, patience thresholds, and screen devices. Translates persona traits into actionable system prompts. |
| **`@testhive/analytics`** | **Behavioral Analysis**: Aggregates persona step traces, computes conversion funnels, identifies drop-off anomalies, and clusters friction issues by severity. |
| **`@testhive/graph`** | **Network Dynamics**: Constructs persona relationship graphs, detects interest clusters (Louvain algorithm), and runs epidemic/adoption diffusion simulations (word-of-mouth propagation). |
| **`@testhive/report`** | **Synthesis & Insights**: Aggregates quantitative metrics (completion rates, friction points) into detailed markdown reports with executive summaries and prioritized bug fixes. |
| **`@testhive/llm`** | **AI Reasoning**: Unified abstraction supporting Google Gemini API, local Ollama models, and deterministic mock providers for testing persona decision-making. |
| **`@testhive/db`** | **Persistence Layer**: Lightweight, self-contained SQLite database using Drizzle ORM for runs, persona definitions, traces, graphs, and issues. |
| **`@testhive/contracts`** | **Type Safety**: Centralized Zod schemas guaranteeing end-to-end type safety between frontend, backend, engine, and storage. |
| **`apps/api`** | **Orchestration Backend**: Fastify-based backend exposing REST endpoints for run creation, pool management, metrics querying, and live SSE progress streaming. |
| **`apps/web`** | **Interactive Dashboard**: Next.js 14 web application featuring Material You UI, live benchmark execution monitors, force-directed graph views, and funnel visualizations. |

---

## 3. Real-World Applications

1. **Pre-Launch UX & Usability Audits**: Test web applications with 1,000 synthetic users before going live to uncover dead links, confusing navigation, or form validation issues.
2. **Accessibility & Device Inclusivity Testing**: Simulate users with screen readers, low digital literacy, or outdated mobile devices to verify digital equity and WCAG compliance.
3. **E-Commerce Conversion Optimization**: Uncover checkout funnel drop-offs and test price sensitivity or layout changes against diverse consumer archetypes.
4. **Stress & Behavioral Load Testing**: Emulate concurrent user interaction patterns to stress-test APIs and reactive frontend interfaces under human-like usage rather than synthetic burst traffic.

---

## 4. Utilization in a College Campus

TestHive has direct practical applications within university and academic ecosystems:

- **Campus Portal & ERP Testing**:
  - Test university portals (course registration, fee payment, hostel allotment, grade viewers) with synthetic student and faculty personas before critical launch windows (e.g., semester registration rush).
  - Simulate diverse student demographics (undergraduates, research scholars, non-native English speakers, first-time users) to ensure portals are intuitive.
- **Student Hackathon & Project Prototyping**:
  - Provides computer science students and developer clubs with an automated user feedback platform for evaluating hackathon apps without needing manual focus groups.
- **Academic Research in HCI & Multi-Agent Systems**:
  - Serves as an open testbed for Human-Computer Interaction (HCI) research, evaluating how LLM-driven agents interact with digital environments.
  - Enables research in computational social science by modeling viral adoption and opinion dynamics across student campus networks.
- **Accessible Learning Verification**:
  - Audits university learning management systems (e.g., Moodle, Canvas, custom department portals) against student personas with accessibility needs or varying network speeds.

---

## 5. Future Scope & Roadmap

1. **Multimodal Visual & Audio Agents**: Enable personas to process UI screenshots visually (Vision LLMs) and interact with voice interfaces or video learning tools.
2. **Autonomous Self-Healing Web Fixes**: Integrate automated code generation to suggest and open pull requests directly fixing identified UI and usability bugs.
3. **Federated Persona Knowledge Bases**: Allow teams to create shared, domain-specific persona libraries (e.g., medical patients, enterprise IT admins, elementary school students).
4. **Live A/B Testing Emulation**: Concurrently run synthetic cohort splits across two live URLs to statistically predict winning designs before real customer deployment.
5. **Distributed Cloud Worker Execution**: Scale browser execution across serverless worker clusters (Kubernetes / AWS ECS) to run 10,000+ persona simulations in minutes.
