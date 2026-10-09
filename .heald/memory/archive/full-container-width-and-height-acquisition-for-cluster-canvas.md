---
type: decision
title: "Full container width and height acquisition for cluster canvas"
timestamp: 2026-10-08T15:19:26.651234400+00:00
---
Updated NetworkGraph to use ResizeObserver with dynamic dimension detection and custom className support. In apps/web/src/app/library/[poolId]/page.tsx, eliminated restrictive card inner padding on the canvas viewport, attached a clean header bar, and granted full width and 620px responsive container height to the cluster canvas.
