import type {
  MediaEngineCapabilities,
  MediaOperation,
  RenderRequest,
} from "./contracts";

const SAFE_FILENAME = /^[a-zA-Z0-9][a-zA-Z0-9._ -]{0,119}$/;

export function validateRenderRequest(request: RenderRequest): string[] {
  const errors: string[] = [];
  const { range, profile } = request;

  if (!request.projectId.trim()) errors.push("Project ID cannot be empty");
  if (!request.sequenceId.trim()) errors.push("Sequence ID cannot be empty");
  if (!Number.isSafeInteger(range.startFrame) || range.startFrame < 0) {
    errors.push("Render start frame must be a non-negative safe integer");
  }
  if (!Number.isSafeInteger(range.endFrame) || range.endFrame <= range.startFrame) {
    errors.push("Render end frame must be a safe integer greater than start frame");
  }
  if (!SAFE_FILENAME.test(request.outputFileName) ||
      request.outputFileName === "." ||
      request.outputFileName === "..") {
    errors.push("Output must be a plain filename without path separators");
  }
  if (profile.width <= 0 || !Number.isSafeInteger(profile.width)) {
    errors.push("Render width must be a positive safe integer");
  }
  if (profile.height <= 0 || !Number.isSafeInteger(profile.height)) {
    errors.push("Render height must be a positive safe integer");
  }
  if (profile.width % 2 !== 0 || profile.height % 2 !== 0) {
    errors.push("Render dimensions must be even for the supported encoder profiles");
  }
  if (!Number.isSafeInteger(profile.frameRateNumerator) ||
      profile.frameRateNumerator <= 0 ||
      !Number.isSafeInteger(profile.frameRateDenominator) ||
      profile.frameRateDenominator <= 0) {
    errors.push("Frame rate must be a positive rational number");
  }
  if (profile.videoBitrateKbps !== undefined &&
      (!Number.isSafeInteger(profile.videoBitrateKbps) || profile.videoBitrateKbps <= 0)) {
    errors.push("Video bitrate must be a positive safe integer");
  }
  if (profile.audioBitrateKbps !== undefined &&
      (!Number.isSafeInteger(profile.audioBitrateKbps) || profile.audioBitrateKbps <= 0)) {
    errors.push("Audio bitrate must be a positive safe integer");
  }

  return errors;
}

export function assertRenderSupported(
  request: RenderRequest,
  capabilities: MediaEngineCapabilities,
): void {
  const errors = validateRenderRequest(request);
  if (!capabilities.operations.includes("render")) {
    errors.push("This media engine does not support rendering");
  }
  if (!capabilities.containers.includes(request.profile.container)) {
    errors.push("Unsupported export container: " + request.profile.container);
  }
  if (!capabilities.videoCodecs.includes(request.profile.videoCodec)) {
    errors.push("Unsupported video codec: " + request.profile.videoCodec);
  }
  if (!capabilities.audioCodecs.includes(request.profile.audioCodec)) {
    errors.push("Unsupported audio codec: " + request.profile.audioCodec);
  }
  if (request.profile.width > capabilities.maxWidth ||
      request.profile.height > capabilities.maxHeight) {
    errors.push("Requested output dimensions exceed engine capabilities");
  }
  if (!Number.isSafeInteger(capabilities.maxConcurrentJobs) ||
      capabilities.maxConcurrentJobs < 1) {
    errors.push("Media engine concurrency limit must be a positive safe integer");
  }

  if (errors.length) throw new Error("Unsupported render request: " + errors.join("; "));
}

export function supportsOperation(
  capabilities: MediaEngineCapabilities,
  operation: MediaOperation,
): boolean {
  return capabilities.operations.includes(operation);
}
