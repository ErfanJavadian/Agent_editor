# Agent Editor — Product Direction

**Status:** Proposed product direction  
**Branch:** `product/video-editor-pivot`  
**Date:** 2026-11-15

## Product definition

Agent Editor is a cross-platform, professional, AI-native video editing application. It combines a full non-linear video editor with an agent system that can understand editing intent, inspect a project, plan changes, execute editing operations through constrained capabilities, and present the result for human review.

It is not an agent builder, a chat wrapper around FFmpeg, or a cloud-only editing service.

## Product promise

A creator can either edit manually with precise professional controls or describe an outcome in natural language and delegate a bounded editing workflow to an agent. The user retains control over the timeline, project, media, permissions, and final export.

## Target platforms

1. **Desktop — primary professional environment:** Windows and Linux first-class targets. Full multi-track timeline, precision controls, advanced audio/video editing, effects, color workflow, compositing, and high-quality export.
2. **Web — accessible companion and editing surface:** project browsing, review, lightweight editing, agent workflows, collaboration-ready foundations, and browser-supported media processing. Browser limits must be explicit.
3. **Android — mobile editing surface:** touch-first timeline interactions, media ingest, review, captions, quick edits, agent-assisted workflows, and device-appropriate rendering. Do not promise desktop-equivalent performance or every advanced effect on mobile.

All three clients must share a versioned project format and domain-level editing semantics. Feature parity is not required; project portability is.

## Core product principles

- **Non-destructive editing:** edits are represented as project operations and timeline state; source media is not modified by ordinary edits.
- **Project portability:** a project can move between supported clients without silently losing edits. Unsupported features must be surfaced, not discarded.
- **Human control:** agent changes are previewable, reversible, and auditable. High-impact operations require explicit approval.
- **Professional precision:** frame-accurate time, deterministic timeline operations, explicit track/layer semantics, and predictable export settings.
- **Local-first media:** source media remains under user control. Cloud processing is optional, explicit, and never assumed.
- **Capability-bounded agents:** agents operate through typed editing tools, not arbitrary shell access or unrestricted filesystem access.
- **Progressive capability:** desktop is the reference environment for advanced workflows; web and Android expose supported subsets.
- **Honest compatibility:** codecs, effects, hardware acceleration, and browser APIs vary by platform and must be capability-detected.

## Main user workflows

### Manual editing
Import media → organize assets → create timeline → trim and arrange clips → add audio/titles/effects → preview → export.

### Agent-assisted editing
Describe the desired result → agent inspects media and project → agent proposes an edit plan → user reviews the plan/diff → approved operations are applied → preview and revise → export.

### Hybrid editing
The user manually edits, delegates a bounded task to an agent, reviews the proposed changes, and continues editing manually.

## Product boundaries for the first release

The first milestone is not to recreate every feature of Premiere Pro or DaVinci Resolve. It is to establish a reliable shared project model, a playable preview, a basic multi-track timeline, core non-destructive edits, and an agent that can safely perform a small set of real editing operations.

Advanced color grading, node compositing, complex motion graphics, collaborative real-time editing, and full codec parity are later milestones.

## Success criteria

- A project can be created, saved, reopened, and migrated through a versioned format.
- Source files remain unchanged by timeline edits.
- Timeline operations are deterministic and undoable.
- Preview and export use the same project semantics.
- An agent can inspect a project and propose valid typed operations.
- Agent changes can be previewed, approved, applied, undone, and audited.
- Projects can be opened on desktop, web, and Android with explicit capability warnings where needed.
