# Design: Beautify Communication Electronics Chapter 1 Notes

## Goal
Improve readability and study efficiency of Chapter 1 Obsidian notes while preserving all content and mobile compatibility. The beautification should create stronger visual hierarchy, reinforce exam memory cues, and make problem practice faster to scan.

## Scope
Applies to Chapter 1 files in `复试相关/通信电子线路/通信电子线路-Study-Vault/01-通信电子线路概述/`:
- `core-concepts.md`
- `quick-ref.md`
- `practice-problems.md`

## Approach
Use Obsidian-friendly formatting only (standard Markdown, wikilinks, callouts, Mermaid, LaTeX). No plugins, no custom CSS, no HTML details. Enhance structure with:
- **Callouts**: add “记忆锚点 / 易混点 / 题型提示” to surface exam-facing cues.
- **Comparison table**: direct amplification vs superheterodyne for quick contrast.
- **Compact diagrams**: keep existing system flowcharts; add a minimal propagation decision flowchart in Mermaid using ASCII-safe labels.
- **Flashcard layout**: in quick-ref, emphasize formula cards and one-page recall bullets.
- **Solution formatting**: highlight final answers and separate reasoning for practice problems.

## Constraints
- Mermaid labels must be ASCII-safe (no Unicode operators).
- Avoid long paragraphs; prefer concise bullets.
- Preserve all core definitions and formulas from the existing notes.

## Success Criteria
- Notes scan quickly on mobile without plugin dependencies.
- Key exam points visible within the first screen per file.
- Practice solutions show a clear “Answer vs Reasoning” structure.

