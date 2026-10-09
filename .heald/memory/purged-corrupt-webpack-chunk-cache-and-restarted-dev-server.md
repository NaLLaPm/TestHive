---
type: decision
title: "Purged corrupt webpack chunk cache and restarted dev server"
timestamp: 2026-10-09T08:51:14.999326700+00:00
---
Terminated zombie Next.js server processes, deleted apps/web/.next to clear stale webpack cache chunks including missing ./98.js, and restarted bun dev on port 3000 returning HTTP 200.
