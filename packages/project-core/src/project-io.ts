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
  if (value.schemaVersion !== 1) {
    throw new Error("Unsupported project schema version: " + value.schemaVersion);
  }

  for (const mediaValue of value.media) {
    if (!isRecord(mediaValue)) throw new Error("Project contains an invalid media asset");
    if (!hasString(mediaValue, "id") ||
        !hasString(mediaValue, "kind") ||
        !hasString(mediaValue, "name") ||
        !hasString(mediaValue, "sourceUri")) {
      throw new Error("Project media asset is missing required fields");
    }
    for (const key of ["durationFrames", "width", "height"]) {
      if (mediaValue[key] !== undefined && typeof mediaValue[key] !== "number") {
        throw new Error("Media field must be numeric: " + key);
      }
    }
  }

  for (const sequenceValue of value.sequences) {
    if (!isRecord(sequenceValue)) throw new Error("Project contains an invalid sequence object");
    if (!hasString(sequenceValue, "id") ||
        !hasString(sequenceValue, "name") ||
        !hasNumber(sequenceValue, "width") ||
        !hasNumber(sequenceValue, "height")) {
      throw new Error("Project sequence is missing required fields");
    }

    const frameRateValue = sequenceValue.frameRate;
    if (!isRecord(frameRateValue)) {
      throw new Error("Project sequence frameRate must be an object");
    }
    if (!hasNumber(frameRateValue, "numerator") ||
        !hasNumber(frameRateValue, "denominator")) {
      throw new Error("Project sequence frameRate is invalid");
    }

    const tracksValue = sequenceValue.tracks;
    if (!Array.isArray(tracksValue)) throw new Error("Project sequence tracks must be an array");

    for (const trackValue of tracksValue) {
      if (!isRecord(trackValue)) throw new Error("Project contains an invalid track object");
      if (!hasString(trackValue, "id") ||
          !hasString(trackValue, "name") ||
          !hasString(trackValue, "kind")) {
        throw new Error("Project track is missing required fields");
      }
      const clipsValue = trackValue.clips;
      if (!Array.isArray(clipsValue)) throw new Error("Project track clips must be an array");

      for (const clipValue of clipsValue) {
        if (!isRecord(clipValue) ||
            !hasString(clipValue, "id") ||
            !hasString(clipValue, "mediaId") ||
            !hasNumber(clipValue, "sourceStartFrame") ||
            !hasNumber(clipValue, "sourceEndFrame") ||
            !hasNumber(clipValue, "timelineStartFrame")) {
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
