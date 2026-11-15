# Repository Instructions for AI Coding Agents

## Product boundary
- This repository builds Agent Editor: a professional, non-linear, AI-native video editing application targeting desktop (Windows/Linux), web, and Android.
- Do not treat this repository as a generic agent builder, SaaS, public multi-tenant platform, marketplace, or billing product.
- Desktop is the reference environment for advanced editing; web and Android provide capability-aware subsets.
- The shared project format and editing semantics must remain portable across clients.

## Architecture rules
- Keep the project domain independent from React, desktop shells, model vendors, and media backends.
- Keep project serialization versioned and migration-tested.
- Represent timeline time using integer frames/ticks and explicit rational frame rates; avoid floating-point timeline positions.
- Keep source media immutable during ordinary editing. Edits belong to project state.
- Implement timeline changes as typed, validated, deterministic operations.
- Keep media probing, decode, preview, proxy generation, effects, and rendering behind capability-aware adapters.
- Do not assume desktop, browser, and Android media capabilities are identical.
- Agent plans must be converted into typed edit commands and validated before application.
- Agents must not receive arbitrary shell access or unrestricted filesystem access.
- Agent-authored changes must be reviewable, attributable, and reversible.

## Security and privacy
- Treat imported media and project manifests as untrusted input.
- Validate project paths, identifiers, sizes, frame ranges, and media references.
- Prevent path traversal and unintended access outside user-selected folders.
- Never execute scripts or shell commands embedded in project files or model output.
- Keep API keys, private media, local databases, caches, and render outputs out of Git.
- External uploads, deletion, overwrites, and expensive renders require explicit consent.
- Keep local services bound to 127.0.0.1 by default.

## Engineering workflow
- Read `docs/VIDEO_EDITOR_ARCHITECTURE_V1.md` and the relevant package documentation before changing module boundaries.
- Prefer small vertical slices that can be tested independently.
- Add unit tests for project validation, timeline arithmetic, migrations, and agent safety boundaries.
- Run frontend typecheck, tests, and production build after frontend changes.
- Run backend tests and lint after backend changes.
- Do not claim a feature is implemented or tested unless the code and test results support the claim.
- Keep the roadmap and README status accurate; distinguish Planned, Implemented, and Verified.
