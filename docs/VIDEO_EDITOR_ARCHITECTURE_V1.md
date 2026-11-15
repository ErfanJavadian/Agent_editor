# Agent Editor — Cross-Platform Video Editor Architecture V1

**Status:** Initial architecture proposal  
**Product:** Professional AI-native non-linear video editor  
**Date:** 2026-11-15

## 1. Architecture decision

Build one product around a shared editing domain and versioned project format, with platform-specific clients and media execution adapters.

Do not attempt to force every media operation into one runtime. Timeline semantics and project state are shared; decoding, preview, GPU effects, and export are provided by capability-aware platform adapters behind stable interfaces.

## 2. System overview

```text
                    AGENT EDITOR PRODUCT
                            |
          +-----------------+------------------+
          |                 |                  |
       DESKTOP             WEB              ANDROID
     Windows/Linux        Browser           Native app
          |                 |                  |
          +-----------------+------------------+
                            |
                 SHARED PRODUCT DOMAIN
                            |
       +--------------------+---------------------+
       |                    |                     |
  Project Model       Timeline Engine       Editing Commands
       |                    |                     |
       +--------------------+---------------------+
                            |
                  MEDIA ABSTRACTION LAYER
                            |
       +--------------------+---------------------+
       |                    |                     |
  Media Ingest         Preview/Decode        Render/Export
       |                    |                     |
       +--------------------+---------------------+
                            |
                    AGENT ORCHESTRATOR
                            |
       Project Context → Planner → Typed Tools
                            |
                  Validation / Permissions
                            |
                 Proposed Change Set / Diff
                            |
                 Human Approval / Apply
                            |
                    Undo / Audit Events
```

## 3. Major subsystems

### 3.1 Shared Project Domain
Owns project identity, media references, sequences, tracks, clips, transforms, effects, keyframes, markers, captions, audio routing, export profiles, and project version migrations.

It must not depend on React, a desktop shell, a specific codec library, or a model provider.

### 3.2 Project Format
Use a versioned, documented project manifest. Store metadata and edit decisions separately from original media. Large binary assets, proxies, thumbnails, waveforms, and render cache live in managed asset/cache directories rather than being embedded in the manifest.

Required concepts:
- project ID and schema version
- timebase / rational frame rates
- sequences and dimensions
- tracks with stable IDs and explicit ordering
- clips with source in/out and timeline placement
- media asset IDs and relative/managed paths
- transforms, effects, keyframes, transitions
- audio routing and gain
- captions and text/title objects
- provenance for agent-authored operations
- migration metadata

Time must be represented without floating-point frame drift. Prefer integer ticks or rational time values with an explicit project timebase.

### 3.3 Timeline Engine
Provides deterministic operations:
- create/delete/reorder tracks
- insert, move, trim, split, ripple-delete clips
- set clip source ranges and timeline positions
- add transitions, markers, captions, and keyframes
- validate overlaps and track constraints
- calculate sequence duration and render ranges

Operations should be command-based, validated, undoable, and replayable.

### 3.4 Media Abstraction Layer
Defines interfaces for:
- probing metadata
- decoding and preview
- thumbnail and waveform generation
- proxy generation
- audio processing
- effects execution
- export/rendering

Each platform adapter reports supported codecs, pixel formats, acceleration, effects, and limits. The product must not assume that browser, Android, and desktop media stacks are identical.

### 3.5 Agent Orchestrator
The agent is an editing operator, not an unrestricted system administrator.

Its workflow:
1. Read project summary and selected media metadata.
2. Inspect requested ranges or media through approved analysis tools.
3. Produce a typed edit plan.
4. Validate all operations against the project schema and timeline rules.
5. Present a human-readable change set and preview where feasible.
6. Request approval for destructive, expensive, external, or broad-scope changes.
7. Apply accepted commands through the Timeline Engine.
8. Record provenance, results, and undo information.
9. Reinspect the project and report what changed.

Agent tools should be narrow operations such as `timeline.split_clip`, `timeline.move_clip`, `timeline.set_gain`, `caption.create`, `media.analyze_scenes`, and `project.create_export_job`. Do not expose arbitrary shell commands as editing tools.

### 3.6 Render Engine
Converts a project sequence into frames/audio and an output file. Rendering must be deterministic for a given project state and render profile where the underlying codecs permit it. It should support background jobs, cancellation, progress, resource limits, and resumable intermediate work where practical.

### 3.7 User Interface
Desktop, web, and Android have separate interaction layouts but consume the same domain/API contracts.

Desktop is the reference for precision and advanced workflows. Web and Android present capability-aware subsets and must clearly identify unsupported project features.

## 4. Recommended implementation direction

The following is a proposal, not a claim that these dependencies have already been installed or validated.

- **Shared domain and project contracts:** TypeScript initially, with strict schemas and migration tests; keep the domain independent from UI frameworks.
- **Web UI:** React + TypeScript.
- **Desktop shell:** evaluate Tauri 2 for Windows/Linux packaging and native integration.
- **Android:** evaluate a native Android shell or a shared UI shell only after validating media performance and plugin access on the target device.
- **Media processing:** evaluate FFmpeg for probing, proxy/transcode, audio utilities, and export, subject to codec licensing and distribution obligations. Keep it behind a media adapter.
- **High-performance effects:** introduce native/GPU-specific backends only when a measured feature requires them.
- **Backend/local services:** keep optional local services separate from the core project format; the editor should not require a cloud backend to open a local project.
- **Persistence:** project manifest plus managed asset directories; use SQLite for indexes, jobs, and metadata where relational queries help.

Do not lock in a cross-platform native core before benchmarking preview, scrubbing, decode, and export on actual target devices.

## 5. Security and data integrity

- Treat imported media and project files as untrusted input.
- Validate project manifests, paths, sizes, and media metadata.
- Prevent path traversal and unintended access outside user-selected folders.
- Never execute scripts or shell commands embedded in a project or agent response.
- Keep API secrets and private media out of Git and logs.
- Agent changes must be validated and reversible.
- External uploads, deletion, overwrites, and expensive renders require explicit user consent.
- Keep a project operation log with actor, timestamp, operation, and before/after references.

## 6. Performance requirements

- Use proxy media and adaptive preview quality for constrained devices.
- Keep UI interactions responsive while media work runs asynchronously.
- Avoid loading full-resolution media into memory for ordinary timeline interactions.
- Cache thumbnails, waveforms, decoded frames, and proxies with clear invalidation rules.
- Support cancellation and bounded concurrency.
- Measure startup, project-open time, seek latency, preview frame rate, memory, and export throughput on each target.

## 7. Testing strategy

- Unit tests for project schema, migrations, time arithmetic, and timeline commands.
- Property-based tests for split/trim/move/ripple operations and undo/redo invariants.
- Golden tests for project serialization and migration.
- Media fixture tests for metadata probing, decode, audio, and export.
- Cross-platform contract tests for media adapter capabilities.
- Agent safety tests: invalid operations rejected, scope respected, approvals enforced, and undo restores prior state.
- End-to-end tests for import → timeline edit → save/reopen → preview → export.
- Performance tests on representative low-, mid-, and high-end devices.

## 8. Architectural risks and decisions still open

1. Exact desktop shell and native media integration.
2. Whether shared domain logic remains TypeScript or moves selected performance-critical pieces to Rust/C++ after profiling.
3. Android rendering strategy and realistic device support matrix.
4. Web preview/export limits imposed by browser APIs and memory.
5. FFmpeg packaging, codec availability, and license compliance.
6. Project package format, asset relinking, and portability rules.
7. Plugin/effect architecture and third-party extension sandboxing.

These decisions must be settled through small prototypes and measurements, not assumptions.

## 9. First implementation milestone

Build a vertical slice before expanding feature count:

1. Create a project with a versioned manifest.
2. Import one video and one audio asset.
3. Probe media metadata and generate a thumbnail.
4. Display a single video track and one audio track.
5. Support clip insert, move, trim, split, undo, and redo.
6. Save and reopen the project without changing source media.
7. Preview the edited sequence.
8. Export a short MP4 using a tested media adapter.
9. Let an agent propose and apply one safe edit operation through a validated change set.

The milestone is complete only after tests and a real-device smoke test pass.
