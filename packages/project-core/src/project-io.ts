import { assertValidProject } from "./project";
import type { ProjectDocument } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasString(record: Record<string, unknown>, key: string): boolean {
  return typeof record[key] === "string";
}

function hasNumber(record: Record<string, unknown>, key: string): boolean {
  return typeof record[key] === "number";
}

/** Parse an untrusted project manifest and reject malformed or unsupported data. */
export function parseProjectDocument(source: string): ProjectDocument {
  let value: unknown;
  try {
    value = JSON.parse(source) as unknown;
  } catch {
    throw new Error("Project file is not valid JSON");
  }

  if (!isRecord(value)) throw new Error("Project document must be a JSON object");
  if (!hasNumber(value, "schemaVersion") ||
      !hasString(value, "id") ||
      !hasString(value, "name") ||
      !hasString(value, "createdAt") ||
      !hasString(value, "updatedAt") ||
      !Array.isArray(value.media) ||
      !Array.isArray(value.sequences)) {
    throw new Error("Project document is missing required fields");
  }

  for (const media of value.media) {
    if (!isRecord(media) ||
        !hasString(media, "id") ||
        !hasString(media, "kind") ||
        !hasString(media, "name") ||
        !hasString(media, "sourceUri")) {
      throw new Error("Project contains an invalid media asset");
    }
    for (const key of ["durationFrames", "width", "height"]) {
      if (media[key] !== undefined && typeof media[key] !== "number") {
        throw new Error("Media field must be numeric: " + key);
      }
    }
  }

  for (const sequence of value.sequences) {
    if (!isRecord(sequence) ||
        !hasString(sequence, "id") ||
        !hasString(sequence, "name") ||
        !hasNumber(sequence, "width") ||
        !hasNumber(sequence, "height") ||
        !isRecord(sequence.frameRate) ||
        !hasNumber(sequence.frameRate.numerator) ||
        !hasNumber(sequence.frameRate.denominator) ||
        !Array.isArray(sequence.tracks)) {
      throw new Error("Project contains an invalid sequence");
    }

    for (const track of sequence.tracks) {
      if (!isRecord(track) ||
          !hasString(track, "id") ||
          !hasString(track, "name") ||
          !hasString(track, "kind") ||
          !Array.isArray(track.clips)) {
        throw new Error("Project contains an invalid track");
      }
      for (const clip of track.clips) {
        if (!isRecord(clip) ||
            !hasString(clip, "id") ||
            !hasString(clip, "mediaId") ||
            !hasNumber(clip, "sourceStartFrame") ||
            !hasNumber(clip, "sourceEndFrame") ||
            !hasNumber(clip, "timelineStartFrame")) {
          throw new Error("Project contains an invalid timeline clip");
        }
      }
    }
  }

  const project = value as unknown as ProjectDocument;
  assertValidProject(project);
  return project;
}

export function serializeProjectDocument(project: ProjectDocument): string {
  assertValidProject(project);
  return JSON.stringify(project, null, 2);
}
