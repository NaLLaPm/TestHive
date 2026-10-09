---
type: decision
title: "Decongested cluster layout and stabilized graph interaction"
timestamp: 2026-10-09T17:31:52.732423259+00:00
---
1) Eliminated graph congestion and purple hairball by pruning edges to top similarity links (max 3 per node), setting link distance to 95px and link strength to 0.18, and boosting charge repulsion to -260 with 600px max distance. 2) Fixed bug where canvas pan accidentally grabbed nodes by bounding nodePointerAreaPaint hit radius to visual radius + 3px instead of inversely scaling with globalScale. 3) Stabilized drag physics with d3VelocityDecay 0.5, gentle d3AlphaTarget 0.08, and clean alphaTarget 0 cooldown on release without violent reheat.
