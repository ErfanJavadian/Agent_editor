# Repository Instructions for AI Coding Agents

## Product boundary
- This repository builds a private, single-user Agent Engineering Workbench.
- Do not turn it into a SaaS, public multi-tenant platform, marketplace, billing product, or public sign-up service.
- Optimize for local-first operation and a mobile-usable web interface. Android/Termux compatibility is a design constraint, not a reason to weaken security.

## Architecture rules
- Keep domain logic independent from UI frameworks and specific model vendors.
- Route all model calls through the Model Gateway; do not call vendor SDKs from domain services.
- Route all tool execution through the Tool Registry and its permission/approval checks.
- Keep agent definitions, runtime execution, persistence, and presentation as separate modules.
- Treat Skills as versioned, inspectable capability packages. Never silently grant a skill new permissions.
- Keep durable memory separate from transient run context and preserve provenance for stored facts.
- Every run must have a traceable ID, explicit status, timestamps, structured events, and bounded resource limits.
- Prefer a small, understandable dependency set. Do not add Redis, Celery, Kubernetes, or other infrastructure without a demonstrated need.

## Security and privacy
- Bind the local server to 127.0.0.1 by default.
- Never commit API keys, tokens, personal workspace data, local databases, or run outputs.
- Never execute arbitrary shell commands or destructive/external actions without explicit policy checks and user approval.
- Validate tool inputs against schemas and apply timeouts, output limits, and cancellation.
- Do not expose secrets in logs, exceptions, traces, or the UI.

## Engineering workflow
- Read the relevant architecture document before changing module boundaries.
- Make small, testable changes and add tests for behavior and security boundaries.
- Keep configuration explicit and provide safe defaults.
- Update documentation when a decision, interface, or command changes.
- Do not claim a feature is implemented or tested unless the code and test results support that claim.
