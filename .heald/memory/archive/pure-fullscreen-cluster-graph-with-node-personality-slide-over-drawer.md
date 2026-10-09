---
type: decision
title: "Pure fullscreen cluster graph with node personality slide-over drawer"
timestamp: 2026-10-08T15:40:48.987850300+00:00
---
Removed pool headers, cluster buttons, and persona roster cards from library/[poolId]/page.tsx. The cluster graph now occupies the full viewport width and height. Attached onNodeClick callback to NetworkGraph; clicking any persona node opens a clean right-side slide-over panel displaying the full persona personality, backstory, voice, behavioral scores, traits, and quirks.
