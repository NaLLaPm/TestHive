---
type: decision
title: "Icon-only desktop sidebar rail with hover tooltips"
timestamp: 2026-10-09T08:07:03.365326+00:00
---
Refactored the desktop sidebar in nav.tsx into an icon-only slim rail (w-20). Each navigation item now displays only its icon with smooth scale micro-interactions, revealing an accessible floating tooltip pill on hover and focus-visible. Updated layout-shell.tsx padding to md:pl-20 and synchronized default collapsed state in sidebar-context.tsx.
