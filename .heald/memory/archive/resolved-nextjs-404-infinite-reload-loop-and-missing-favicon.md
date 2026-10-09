---
type: decision
title: "Resolved Next.js 404 infinite reload loop and missing favicon"
timestamp: 2026-10-08T16:53:43.811968800+00:00
---
Cleaned corrupted .next build cache and dead middleware manifest references caused by Bun native runtime dev mode on Windows. Provisioned missing favicon.ico in apps/web/public to prevent browser 404s. Rebuilt production bundle and verified that localhost:3000, /library, /personas, and static assets respond with HTTP 200 OK.
