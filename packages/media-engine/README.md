# Media Engine Contracts

This package contains platform-neutral TypeScript contracts and request validation.
It does **not** include a decoder, encoder, FFmpeg binary, WebAssembly runtime, or
native media bridge.

## Responsibilities

- Describe platform capabilities explicitly.
- Represent metadata probe results and bounded render requests.
- Reject malformed render ranges, unsafe output filenames, invalid dimensions,
  unsupported codecs/containers, and requests beyond declared engine limits.
- Keep the UI and AI planner independent from a specific media backend.

## Adapter contract

A platform adapter implements `MediaEngine` and advertises only operations it
actually supports. The adapter must honor `AbortSignal`, report monotonic progress
between 0 and 1, and reject with a useful error when an operation fails.

## Security boundary

`outputFileName` is a filename, not a path. A native adapter must resolve it only
inside an application-managed export directory and must never trust a path supplied
by an agent or imported project. Imported media remains untrusted input.

## Current status

Contracts and pure validation are implemented and unit-tested. No real rendering
backend is connected yet; MP4 export remains unimplemented.
