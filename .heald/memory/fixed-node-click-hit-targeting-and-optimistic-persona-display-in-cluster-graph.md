---
type: decision
title: "Fixed node click hit targeting and optimistic persona display in cluster graph"
timestamp: 2026-10-09T17:19:52.734687910+00:00
---
Resolved persona inspection bug where clicking nodes failed to open persona personality details: 1) Dynamically scaled nodePointerAreaPaint hit radius in NetworkGraph so high-density canvas nodes provide a comfortable click target (minimum 8px screen space, 1.5x visual radius) at all zoom levels; 2) Added selectedNode memo and optimistic preview in PoolDetailPage so persona identity, cluster, device, and demographics immediately render in the personality slide-over panel even while full async traits sync.
