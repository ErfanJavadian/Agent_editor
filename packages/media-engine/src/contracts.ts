/**
 * Platform-neutral media contracts.
 *
 * These types describe capabilities and jobs only. They deliberately do not
 * claim that a decoder or renderer is implemented by any current platform.
 */

export type MediaOperation = "probe" | "thumbnail" | "waveform" | "proxy" | "render";
export type ExportContainer = "mp4" | "webm";
export type VideoCodec = "h264" | "vp9";
export type AudioCodec = "aac" | "opus";

export interface MediaEngineCapabilities {
  readonly platform: "web" | "desktop" | "android" | "test";
  readonly operations: readonly MediaOperation[];
  readonly containers: readonly ExportContainer[];
  readonly videoCodecs: readonly VideoCodec[];
  readonly audioCodecs: readonly AudioCodec[];
  readonly maxWidth: number;
  readonly maxHeight: number;
  readonly maxConcurrentJobs: number;
  readonly hardwareAcceleration: "none" | "optional" | "required";
}

export interface MediaProbeResult {
  readonly durationSeconds: number;
  readonly width?: number;
  readonly height?: number;
  readonly videoCodec?: string;
  readonly audioCodec?: string;
  readonly hasVideo: boolean;
  readonly hasAudio: boolean;
}

export interface RenderRange {
  /** Inclusive sequence start frame. */
  readonly startFrame: number;
  /** Exclusive sequence end frame. */
  readonly endFrame: number;
}

export interface RenderProfile {
  readonly container: ExportContainer;
  readonly videoCodec: VideoCodec;
  readonly audioCodec: AudioCodec;
  readonly width: number;
  readonly height: number;
  readonly frameRateNumerator: number;
  readonly frameRateDenominator: number;
  readonly videoBitrateKbps?: number;
  readonly audioBitrateKbps?: number;
}

export interface RenderRequest {
  readonly projectId: string;
  readonly sequenceId: string;
  readonly range: RenderRange;
  readonly profile: RenderProfile;
  /** A filename only, never an arbitrary filesystem path. */
  readonly outputFileName: string;
}

export type RenderJobState =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface RenderJobSnapshot {
  readonly id: string;
  readonly request: RenderRequest;
  readonly state: RenderJobState;
  readonly progress: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly outputUri?: string;
  readonly errorMessage?: string;
}

export interface MediaEngine {
  readonly capabilities: MediaEngineCapabilities;
  probe(source: Blob, signal?: AbortSignal): Promise<MediaProbeResult>;
  render(
    request: RenderRequest,
    onProgress?: (progress: number) => void,
    signal?: AbortSignal,
  ): Promise<Blob>;
}
