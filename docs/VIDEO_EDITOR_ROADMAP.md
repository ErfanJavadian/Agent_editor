# Agent Editor — Replatforming Roadmap

**Status:** Proposed  
**Date:** 2026-11-15

## Phase 0 — Product and architecture reset
- [x] Confirm product is a professional video editor with integrated AI agents.
- [x] Confirm target platforms: desktop, web, Android.
- [ ] Approve shared project model and portability principles.
- [ ] Record technology decisions only after prototype evidence.

## Phase 1 — Technical feasibility prototypes
- [ ] Inspect current repository and identify reusable non-product infrastructure.
- [ ] Prototype media probing, thumbnail generation, preview, and short export.
- [ ] Benchmark at least one desktop target and the actual Android target.
- [ ] Verify web media capabilities and memory limits.
- [ ] Evaluate desktop shell and Android application packaging.
- [ ] Record codec and distribution licensing constraints.

## Phase 2 — Shared project foundation
- [ ] Define project manifest schema and version migrations.
- [ ] Implement asset registry and safe media path handling.
- [ ] Implement rational timebase and frame-accurate time arithmetic.
- [ ] Implement project save/load and integrity validation.
- [ ] Add fixture projects and serialization tests.

## Phase 3 — Timeline vertical slice
- [ ] Build multi-track timeline domain operations.
- [ ] Add insert, move, trim, split, undo, and redo.
- [ ] Build desktop timeline UI and preview surface.
- [ ] Add basic audio track and waveform.
- [ ] Add save/reopen and export workflow.

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

## Phase 6 — Web and Android clients
- [ ] Build web client against shared project contracts.
- [ ] Add browser capability detection and supported subset.
- [ ] Build Android client with touch-first interactions.
- [ ] Validate project round-trip across desktop, web, and Android.
- [ ] Document unsupported-feature behavior and media relinking.

## Phase 7 — Hardening and release readiness
- [ ] Cross-platform integration and regression tests.
- [ ] Performance, memory, crash-recovery, and cancellation tests.
- [ ] Security review for imported projects and agent tools.
- [ ] Codec and third-party license review.
- [ ] Installation, backup, recovery, and user documentation.

## Progress vocabulary

- **Planned:** not implemented.
- **Implemented:** code exists, but required verification may be incomplete.
- **Verified:** relevant tests and target-device checks passed.
- Never report a phase as complete based only on documentation or generated code.
