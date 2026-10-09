---
type: decision
title: "Purged remote GitHub repository history with empty root commit"
timestamp: 2026-10-09T05:32:23.685144800+00:00
---
Purged all commits and tracked files on remote repository NaLLaPm/TestHive by creating a standalone root commit referencing Git empty tree 4b825dc642cb6eb9a060e54bf8d69288fbee4904 and force-pushing to origin/main. Unset local upstream tracking to preserve local working tree without divergence alerts.
