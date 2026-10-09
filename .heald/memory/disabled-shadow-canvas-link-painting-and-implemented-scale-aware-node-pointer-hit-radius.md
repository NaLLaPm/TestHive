---
type: decision
title: "Disabled shadow canvas link painting and implemented scale-aware node pointer hit radius"
timestamp: 2026-10-08T16:12:47.475923700+00:00
---
Set linkPointerAreaPaint={() => {}} and dynamic nodePointerAreaPaint radius Math.max(7, 10 / globalScale) so dense edges cannot intercept clicks and zoomed-out nodes remain easily clickable.
