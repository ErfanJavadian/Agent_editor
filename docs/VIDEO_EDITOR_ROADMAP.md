# Agent Editor — Replatforming Roadmap

**Status:** Active  
**Last updated:** 2026-11-15

## Phase 0 — Product and architecture reset
- [x] Confirm product is a professional video editor with integrated AI agents.
- [x] Confirm target platforms: desktop, web, Android.
- [x] Define shared project model and portability principles.
- [x] Create isolated product-pivot branch and preserve `main`.
- [x] Replace active repository instructions and README; mark old Agent Workbench docs historical.
- [ ] Finalize platform and media-engine decisions through device prototypes.

## Phase 1 — Technical feasibility prototypes
- [x] Inspect current repository and identify reusable non-product infrastructure.
- [x] Build a browser-only media import and metadata prototype.
- [x] Build basic browser video preview using HTMLVideoElement.
- [ ] Add thumbnail and waveform generation.
- [ ] Prototype short export using a real media backend.
- [ ] Benchmark desktop and the actual Android target.
- [ ] Record codec and distribution licensing constraints.

## Phase 2 — Shared project foundation
- [x] Define a version-1 project manifest with Project, Media, Sequence, Track, and Clip.
- [x] Implement strict structural parsing and project integrity validation.
- [x] Implement project JSON serialization and parsing.
- [x] Add fixture tests for schema, serialization, and invalid references.
- [ ] Add schema migrations and compatibility tests for future versions.
- [ ] Add rational timebase conversion utilities.
- [x] Implement browser-local IndexedDB persistence for project manifests and imported media blobs.
- [ ] Implement safe media relinking and cross-device asset packaging.

## Phase 3 — Timeline vertical slice
- [x] Implement immutable insert, move, trim, and split operations.
- [x] Enforce non-negative integer frame positions and no same-track overlaps.
- [x] Add browser prototype with media bin, preview, two tracks, playhead, and clip selection.
- [x] Add basic UI undo/redo history.
- [x] Add clip removal without deleting source media.
- [x] Add direct drag-and-drop media placement and clip movement across compatible tracks.
- [x] Add keyboard shortcuts for playback, split, delete, undo, and redo.
- [x] Add browser-local persistent save/reopen and automatic project recovery.
- [ ] Add audio preview synchronization and waveform display.
- [ ] Add a desktop timeline UI and export workflow.

## Phase 3.5 — Media engine foundation
- [x] Define platform-neutral media engine, probe, capability, and render-job contracts.
- [x] Validate render ranges, output filename safety, profile dimensions, codecs, and engine limits.
- [x] Add unit tests for valid and invalid render requests.
- [ ] Implement a real media adapter after platform benchmark and codec/license review.
- [ ] Add cancellation, progress, bounded queue execution, and integration tests.

## Phase 4 — Agent editing system
- [ ] Define typed editing tool contracts.
- [ ] Add project inspection and media analysis tools.
- [ ] Implement plan → validate → preview diff → approve → apply.
- [ ] Record agent provenance and operation audit.
- [ ] Add rollback/undo and agent safety tests.

## Phase 5 — Professional editing capabilities
- [ ] Captions and text/title tools.
- [ ] Audio controls and processing.
- [ ] Color correction and effect pipeline.
- [ ] Transitions, keyframes, and speed controls.
- [ ] Proxy workflow and background render queue.
- [ ] Advanced compositing and motion graphics after core stability.

## Phase 6 — Web, desktop, and Android clients
- [x] Start the browser client against shared project contracts.
- [ ] Add browser capability detection and supported subset.
- [ ] Evaluate and build desktop shell for Windows/Linux.
- [ ] Build Android client with touch-first interactions.
- [ ] Validate project round-trip across all three platforms.
- [ ] Document unsupported-feature behavior and media relinking.

## Phase 7 — Hardening and release readiness
- [x] Add CI for project-core and IndexedDB tests, frontend typecheck/build, backend tests, and backend lint.
- [x] Upgrade Vitest to a patched release; npm audit reported zero vulnerabilities in prior CI.
- [ ] Add cross-platform integration tests.
- [ ] Add performance, memory, crash-recovery, and cancellation tests.
- [ ] Security review for imported projects and agent tools.
- [ ] Codec and third-party license review.
- [ ] Installation, backup, recovery, and user documentation.

## Verified evidence

- Earlier baseline: project core 17 tests and IndexedDB adapter 3 tests passed (20 total) at commit `84722f2`.
- Earlier baseline: frontend TypeScript check and Vite production build passed.
- Earlier baseline: backend pytest and Ruff checks passed.
- New media-engine contract tests are added; their GitHub Actions run must pass before they are marked verified.
- Manual testing on Android and desktop has not yet been completed.
- No real media decoder/encoder or MP4 export is connected.
- Project manifests and imported media blobs persist in browser IndexedDB; media package export, relinking, and native asset management are not implemented.

## Progress vocabulary

- **Planned:** not implemented.
- **Implemented:** code exists, but required verification may be incomplete.
- **Verified:** relevant automated tests and target-device checks passed.
- Never report a phase as complete based only on documentation or generated code.
