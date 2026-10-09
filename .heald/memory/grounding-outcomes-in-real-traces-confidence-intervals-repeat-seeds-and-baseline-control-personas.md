---
type: decision
title: "Grounding outcomes in real traces, confidence intervals, repeat seeds, and baseline control personas"
timestamp: 2026-10-08T00:32:20.425630400+00:00
---
Implemented trustworthy evaluation pillars in TestHive: 1) PersonaResults and Steps schema track drop-off point, stated drop-off reason, and screenshots; 2) Wilson score / normal confidence intervals with margin-of-error (±MOE) and min n=10 greyed-out clusters; 3) Persona repetition (2-3 repeats per persona with fixed seeds) with variance reporting; 4) Baseline control personas (highly motivated, simple task) to differentiate agent failure from site failure; 5) Reports cite verifiable trace evidence and screenshots instead of raw keyword fragments.
