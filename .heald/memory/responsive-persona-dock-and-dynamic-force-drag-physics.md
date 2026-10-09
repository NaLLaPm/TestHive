---
type: decision
title: "Responsive Persona Dock and dynamic force drag physics"
timestamp: 2026-10-09T17:28:33.501582059+00:00
---
1) Made Persona Dock responsive with dynamic right clearance: expands to full width when personality drawer is closed and leaves 440px on desktop when drawer is open. 2) Removed redundant inspectable badge and chips nested index badges to eliminate UI cramping. 3) Elevated zoom controls above dock with controlsClassName. 4) Added onNodeDrag simulation reheating (d3AlphaTarget 0.3) so connected and neighboring nodes move fluidly with the dragged node while onNodeDragEnd permanently pins the placed node without resetting.
