---
type: decision
title: "Resolved Next.js webpack chunk 345.js mismatch via cache wipe and clean dev restart"
timestamp: 2026-10-09T09:29:43.032194300+00:00
---
Running 
ext build while an active 
ext dev instance was alive caused a stale chunk manifest mismatch (missing ./345.js). Killed zombie process PID 31256 on port 3000, purged apps/web/.next cache directory, and restarted bun dev with HTTP 200 verification.
