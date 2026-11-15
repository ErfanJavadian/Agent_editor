import { describe, expect, it } from "vitest";
import {
  assertRenderSupported,
  supportsOperation,
  validateRenderRequest,
} from "../src";
import type { MediaEngineCapabilities, RenderRequest } from "../src";

const capabilities: MediaEngineCapabilities = {
  platform: "test",
  operations: ["probe", "render"],
  containers: ["mp4"],
  videoCodecs: ["h264"],
  audioCodecs: ["aac"],
  maxWidth: 3840,
  maxHeight: 2160,
  maxConcurrentJobs: 1,
  hardwareAcceleration: "optional",
};

const request: RenderRequest = {
  projectId: "project-1",
  sequenceId: "sequence-1",
  range: { startFrame: 0, endFrame: 300 },
  profile: {
    container: "mp4",
    videoCodec: "h264",
    audioCodec: "aac",
    width: 1920,
    height: 1080,
    frameRateNumerator: 30,
    frameRateDenominator: 1,
    videoBitrateKbps: 8000,
    audioBitrateKbps: 192,
  },
  outputFileName: "final-export.mp4",
};

describe("media engine contracts", () => {
  it("accepts a valid bounded render request", () => {
    expect(validateRenderRequest(request)).toEqual([]);
    expect(() => assertRenderSupported(request, capabilities)).not.toThrow();
  });

  it("rejects path traversal and unsafe output names", () => {
    const unsafe = { ...request, outputFileName: "../private.mp4" };
    expect(validateRenderRequest(unsafe)).toContain(
      "Output must be a plain filename without path separators",
    );
  });

  it("rejects invalid frame ranges and odd output dimensions", () => {
    const invalid: RenderRequest = {
      ...request,
      range: { startFrame: -1, endFrame: 0 },
      profile: { ...request.profile, width: 1919 },
    };
    const errors = validateRenderRequest(invalid);
    expect(errors).toContain("Render start frame must be a non-negative safe integer");
    expect(errors).toContain("Render end frame must be a safe integer greater than start frame");
    expect(errors).toContain("Render dimensions must be even for the supported encoder profiles");
  });

  it("rejects unsupported codecs, containers, and output sizes", () => {
    const unsupported: RenderRequest = {
      ...request,
      profile: { ...request.profile, container: "webm", videoCodec: "vp9", width: 7680 },
    };
    expect(() => assertRenderSupported(unsupported, capabilities)).toThrow(
      /Unsupported export container.*Unsupported video codec.*exceed engine capabilities/,
    );
  });

  it("reports supported operations without guessing implementation details", () => {
    expect(supportsOperation(capabilities, "probe")).toBe(true);
    expect(supportsOperation(capabilities, "thumbnail")).toBe(false);
  });

  it("rejects an engine that advertises no render operation", () => {
    const probeOnly = { ...capabilities, operations: ["probe"] as const };
    expect(() => assertRenderSupported(request, probeOnly)).toThrow(
      /does not support rendering/,
    );
  });
});
