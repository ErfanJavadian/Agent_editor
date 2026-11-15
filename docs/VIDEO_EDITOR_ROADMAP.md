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
- [ ] Add direct drag-and-drop clip editing and keyboard shortcuts.
- [x] Add browser-local persistent save/reopen and automatic project recovery.
- [ ] Add audio preview synchronization and waveform display.
- [ ] Add a desktop timeline UI and export workflow.

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
- [x] Upgrade Vitest to a patched release; npm audit reported zero vulnerabilities.
- [ ] Add cross-platform integration tests.
- [ ] Add performance, memory, crash-recovery, and cancellation tests.
- [ ] Security review for imported projects and agent tools.
- [ ] Codec and third-party license review.
- [ ] Installation, backup, recovery, and user documentation.

## Verified evidence

- Project core: **15 tests passed**; IndexedDB adapter: **3 tests passed**; total **18/18** in GitHub Actions at commit `27b555b`.
- Frontend: TypeScript check and Vite production build passed at the same commit.
- Frontend dependency audit: **0 vulnerabilities** at commit `27b555b`.
- Backend: existing pytest suite and Ruff lint passed in the same workflow.
- Manual testing on Android and desktop has **not** yet been performed.
- Project manifests and imported media blobs persist in browser IndexedDB; media package export, relinking, and native asset management are not implemented.

## Progress vocabulary

- **Planned:** not implemented.
- **Implemented:** code exists, but required verification may be incomplete.
- **Verified:** relevant automated tests and target-device checks passed.
- Never report a phase as complete based only on documentation or generated code.
