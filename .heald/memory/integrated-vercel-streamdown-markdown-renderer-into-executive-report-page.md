---
type: decision
title: "Integrated Vercel Streamdown markdown renderer into executive report page"
timestamp: 2026-10-09T06:27:27.541546300+00:00
---
Replaced hand-rolled dangerouslySetInnerHTML markdown parser with official Vercel Streamdown (@streamdown and streamdown) renderer in apps/web/src/app/runs/[id]/report/page.tsx and dashboard tab. Configured Tailwind content path and styles for streamdown with copy controls and typography.
