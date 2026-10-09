---
type: decision
title: "Added start-all.ps1 and dev:all script"
timestamp: 2026-10-07T17:14:41.293907100+00:00
---
Created start-all.ps1 to launch Fastify API (8787), shopping-time demo SPA (8989), and Next.js frontend (3000) concurrently in PowerShell jobs with unified streaming logs and graceful cleanup on exit. Added dev:all npm script to package.json.
