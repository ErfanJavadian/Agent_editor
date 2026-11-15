import {
  PROJECT_SCHEMA_VERSION,
  type ProjectDocument,
  type Sequence,
  type TimelineTrack,
} from "./types";

export interface CreateProjectOptions {
  id: string;
  name: string;
  createdAt?: string;
  sequenceId?: string;
  videoTrackId?: string;
  audioTrackId?: string;
  width?: number;
  height?: number;
  frameRateNumerator?: number;
  frameRateDenominator?: number;
}

export function createEmptyProject(options: CreateProjectOptions): ProjectDocument {
  const name = options.name.trim();
  if (!options.id.trim()) throw new Error("Project ID cannot be empty");
  if (!name) throw new Error("Project name cannot be empty");

  const timestamp = options.createdAt ?? new Date().toISOString();
  const sequence: Sequence = {
    id: options.sequenceId ?? "sequence-main",
    name: "Main Sequence",
    width: options.width ?? 1920,
    height: options.height ?? 1080,
    frameRate: {
      numerator: options.frameRateNumerator ?? 30,
      denominator: options.frameRateDenominator ?? 1,
    },
    tracks: [
      {
        id: options.videoTrackId ?? "track-video-1",
        name: "Video 1",
        kind: "video",
        clips: [],
      },
      {
        id: options.audioTrackId ?? "track-audio-1",
        name: "Audio 1",
        kind: "audio",
        clips: [],
      },
    ],
  };

  const project: ProjectDocument = {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    id: options.id,
    name,
    createdAt: timestamp,
    updatedAt: timestamp,
    media: [],
    sequences: [sequence],
  };

  assertValidProject(project);
  return project;
}

export function validateProject(project: ProjectDocument): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const addId = (id: string, label: string): void => {
    if (!id.trim()) errors.push(label + " ID cannot be empty");
    else if (ids.has(id)) errors.push("Duplicate ID: " + id);
    else ids.add(id);
  };
  const positiveInteger = (value: number, label: string): void => {
    if (!Number.isSafeInteger(value) || value <= 0) {
      errors.push(label + " must be a positive safe integer");
    }
  };

  if (project.schemaVersion !== PROJECT_SCHEMA_VERSION) {
    errors.push("Unsupported project schema version");
  }
  addId(project.id, "Project");
  if (!project.name.trim()) errors.push("Project name cannot be empty");
  if (!Number.isFinite(Date.parse(project.createdAt))) errors.push("Invalid createdAt timestamp");
  if (!Number.isFinite(Date.parse(project.updatedAt))) errors.push("Invalid updatedAt timestamp");

  const mediaById = new Map<string, (typeof project.media)[number]>();
  for (const media of project.media) {
    addId(media.id, "Media");
    if (!media.name.trim()) errors.push("Media name cannot be empty: " + media.id);
    if (!media.sourceUri.trim()) errors.push("Media source URI cannot be empty: " + media.id);
    mediaById.set(media.id, media);
    if (media.durationFrames !== undefined) {
      positiveInteger(media.durationFrames, "Media duration");
    }
    if (media.width !== undefined) positiveInteger(media.width, "Media width");
    if (media.height !== undefined) positiveInteger(media.height, "Media height");
  }

  for (const sequence of project.sequences) {
    addId(sequence.id, "Sequence");
    if (!sequence.name.trim()) errors.push("Sequence name cannot be empty: " + sequence.id);
    positiveInteger(sequence.width, "Sequence width");
    positiveInteger(sequence.height, "Sequence height");
    positiveInteger(sequence.frameRate.numerator, "Frame-rate numerator");
    positiveInteger(sequence.frameRate.denominator, "Frame-rate denominator");

    for (const track of sequence.tracks) {
      addId(track.id, "Track");
      if (!track.name.trim()) errors.push("Track name cannot be empty: " + track.id);
      const ordered = [...track.clips].sort(
        (a, b) => a.timelineStartFrame - b.timelineStartFrame,
      );
      let previousEnd = -1;

      for (const clip of ordered) {
        addId(clip.id, "Clip");
        const media = mediaById.get(clip.mediaId);
        if (!media) {
          errors.push("Clip references missing media: " + clip.mediaId);
          continue;
        }
        if (track.kind === "video" && media.kind === "audio") {
          errors.push("Audio media cannot be placed on a video track: " + clip.id);
        }
        if (track.kind === "audio" && media.kind !== "audio") {
          errors.push("Only audio media can be placed on an audio track: " + clip.id);
        }
        if (!Number.isSafeInteger(clip.sourceStartFrame) || clip.sourceStartFrame < 0) {
          errors.push("Clip sourceStartFrame must be a non-negative safe integer: " + clip.id);
        }
        if (!Number.isSafeInteger(clip.sourceEndFrame) ||
            clip.sourceEndFrame <= clip.sourceStartFrame) {
          errors.push("Clip sourceEndFrame must be greater than sourceStartFrame: " + clip.id);
        }
        if (!Number.isSafeInteger(clip.timelineStartFrame) || clip.timelineStartFrame < 0) {
          errors.push("Clip timelineStartFrame must be a non-negative safe integer: " + clip.id);
        }
        if (media.durationFrames !== undefined && clip.sourceEndFrame > media.durationFrames) {
          errors.push("Clip exceeds source media duration: " + clip.id);
        }

        const duration = clip.sourceEndFrame - clip.sourceStartFrame;
        const timelineEnd = clip.timelineStartFrame + duration;
        if (clip.timelineStartFrame < previousEnd) {
          errors.push("Clips overlap on track: " + track.id);
        }
        if (Number.isSafeInteger(timelineEnd)) previousEnd = Math.max(previousEnd, timelineEnd);
        else errors.push("Clip timeline end exceeds safe integer range: " + clip.id);
      }
    }
  }

  return errors;
}

export function assertValidProject(project: ProjectDocument): void {
  const errors = validateProject(project);
  if (errors.length > 0) throw new Error("Invalid project: " + errors.join("; "));
}
