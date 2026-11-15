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
- [ ] Implement persistent asset registry and safe media relinking.

## Phase 3 — Timeline vertical slice
- [x] Implement immutable insert, move, trim, and split operations.
- [x] Enforce non-negative integer frame positions and no same-track overlaps.
- [x] Add browser prototype with media bin, preview, two tracks, playhead, and clip selection.
- [x] Add basic UI undo/redo history.
- [ ] Add direct drag-and-drop clip editing and keyboard shortcuts.
- [ ] Add persistent save/reopen and project recovery.
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
- [x] Add CI for project-core tests, frontend typecheck/build, backend tests, and backend lint.
- [ ] Add cross-platform integration tests.
- [ ] Add performance, memory, crash-recovery, and cancellation tests.
- [ ] Security review for imported projects and agent tools.
- [ ] Codec and third-party license review.
- [ ] Installation, backup, recovery, and user documentation.

## Verified evidence

- Project core: **14/14 tests passed** in GitHub Actions at commit `3b4ce9a`.
- Frontend: TypeScript check and Vite production build passed at the same commit.
- Backend: existing pytest suite and Ruff lint passed in the same workflow.
- Manual testing on Android and desktop has **not** yet been performed.
- The browser editor currently keeps imported media in temporary object URLs; persistent media management and export are not implemented.

## Progress vocabulary

- **Planned:** not implemented.
- **Implemented:** code exists, but required verification may be incomplete.
- **Verified:** relevant automated tests and target-device checks passed.
- Never report a phase as complete based only on documentation or generated code.
