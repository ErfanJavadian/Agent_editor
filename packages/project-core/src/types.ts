export const PROJECT_SCHEMA_VERSION = 1 as const;

export type MediaKind = "video" | "audio" | "image";
export type TrackKind = "video" | "audio";
export type FrameRate = Readonly<{ numerator: number; denominator: number }>;

export interface MediaAsset {
  id: string;
  kind: MediaKind;
  name: string;
  /** User-selected source location; never interpreted as executable content. */
  sourceUri: string;
  durationFrames?: number;
  width?: number;
  height?: number;
}

export interface TimelineClip {
  id: string;
  mediaId: string;
  /** Inclusive source frame. */
  sourceStartFrame: number;
  /** Exclusive source frame. */
  sourceEndFrame: number;
  /** Timeline frame where this clip begins. */
  timelineStartFrame: number;
}

export interface TimelineTrack {
  id: string;
  name: string;
  kind: TrackKind;
  clips: TimelineClip[];
}

export interface Sequence {
  id: string;
  name: string;
  width: number;
  height: number;
  frameRate: FrameRate;
  tracks: TimelineTrack[];
}

export interface ProjectDocument {
  schemaVersion: typeof PROJECT_SCHEMA_VERSION;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  media: MediaAsset[];
  sequences: Sequence[];
}
