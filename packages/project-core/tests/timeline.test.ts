import { describe, expect, it } from "vitest";
import { createEmptyProject, validateProject } from "../src/project";
import { parseProjectDocument, serializeProjectDocument } from "../src/project-io";
import { insertClip, moveClip, splitClip, trimClip } from "../src/timeline";
import type { ProjectDocument } from "../src/types";

function fixture(): ProjectDocument {
  const project = createEmptyProject({
    id: "project-1",
    name: "Test Project",
    createdAt: "2026-01-01T00:00:00.000Z",
  });
  project.media.push({
    id: "media-1",
    kind: "video",
    name: "sample.mp4",
    sourceUri: "file:///media/sample.mp4",
    durationFrames: 300,
    width: 1920,
    height: 1080,
  });
  return project;
}

const clip = {
  id: "clip-1",
  mediaId: "media-1",
  sourceStartFrame: 0,
  sourceEndFrame: 120,
  timelineStartFrame: 0,
};

describe("project core", () => {
  it("round-trips a valid project manifest", () => {
    const project = fixture();
    const parsed = parseProjectDocument(serializeProjectDocument(project));
    expect(parsed).toEqual(project);
  });

  it("rejects malformed project JSON", () => {
    expect(() => parseProjectDocument("{not-json")).toThrow(/valid JSON/i);
    expect(() => parseProjectDocument(JSON.stringify({ schemaVersion: 1 })))
      .toThrow(/missing required fields/i);
  });

  it("rejects an unsupported project schema version", () => {
    const project = fixture();
    const unsupported = { ...project, schemaVersion: 99 };
    expect(() => parseProjectDocument(JSON.stringify(unsupported)))
      .toThrow(/unsupported project schema/i);
  });

  it("creates a versioned project with video and audio tracks", () => {
    const project = fixture();
    expect(project.schemaVersion).toBe(1);
    expect(project.sequences[0]?.tracks.map((track) => track.kind)).toEqual(["video", "audio"]);
    expect(validateProject(project)).toEqual([]);
  });

  it("rejects a clip that references missing media", () => {
    const project = fixture();
    const invalid = structuredClone(project);
    invalid.sequences[0]!.tracks[0]!.clips.push({ ...clip, mediaId: "missing" });
    expect(validateProject(invalid).some((error) => error.includes("missing media"))).toBe(true);
  });

  it("inserts a clip without mutating the original project", () => {
    const project = fixture();
    const result = insertClip(project, "sequence-main", "track-video-1", clip);
    expect(project.sequences[0]?.tracks[0]?.clips).toHaveLength(0);
    expect(result.sequences[0]?.tracks[0]?.clips).toEqual([clip]);
  });

  it("rejects overlapping clips on the same track", () => {
    const project = insertClip(fixture(), "sequence-main", "track-video-1", clip);
    expect(() => insertClip(project, "sequence-main", "track-video-1", {
      ...clip, id: "clip-2", timelineStartFrame: 100,
    })).toThrow(/overlap/i);
  });

  it("moves a clip to a valid timeline position", () => {
    const project = insertClip(fixture(), "sequence-main", "track-video-1", clip);
    const moved = moveClip(project, "sequence-main", "track-video-1", "clip-1", 150);
    expect(moved.sequences[0]?.tracks[0]?.clips[0]?.timelineStartFrame).toBe(150);
    expect(project.sequences[0]?.tracks[0]?.clips[0]?.timelineStartFrame).toBe(0);
  });

  it("rejects moving a clip into another clip", () => {
    const project = insertClip(fixture(), "sequence-main", "track-video-1", clip);
    const withSecond = insertClip(project, "sequence-main", "track-video-1", {
      ...clip, id: "clip-2", sourceStartFrame: 120, sourceEndFrame: 240, timelineStartFrame: 120,
    });
    expect(() => moveClip(withSecond, "sequence-main", "track-video-1", "clip-1", 30))
      .toThrow(/overlap/i);
  });

  it("trims the start while keeping source and timeline frames aligned", () => {
    const project = insertClip(fixture(), "sequence-main", "track-video-1", clip);
    const trimmed = trimClip(project, "sequence-main", "track-video-1", "clip-1", "start", 20);
    const result = trimmed.sequences[0]?.tracks[0]?.clips[0];
    expect(result).toMatchObject({
      sourceStartFrame: 20, sourceEndFrame: 120, timelineStartFrame: 20,
    });
  });

  it("trims the end using an exclusive end frame", () => {
    const project = insertClip(fixture(), "sequence-main", "track-video-1", clip);
    const trimmed = trimClip(project, "sequence-main", "track-video-1", "clip-1", "end", 90);
    expect(trimmed.sequences[0]?.tracks[0]?.clips[0]?.sourceEndFrame).toBe(90);
  });

  it("splits a clip into two frame-contiguous clips", () => {
    const project = insertClip(fixture(), "sequence-main", "track-video-1", clip);
    const split = splitClip(project, "sequence-main", "track-video-1", "clip-1", 45, "clip-2");
    expect(split.sequences[0]?.tracks[0]?.clips).toEqual([
      { ...clip, sourceEndFrame: 45 },
      {
        id: "clip-2", mediaId: "media-1", sourceStartFrame: 45,
        sourceEndFrame: 120, timelineStartFrame: 45,
      },
    ]);
  });

  it("rejects a split at the clip boundary", () => {
    const project = insertClip(fixture(), "sequence-main", "track-video-1", clip);
    expect(() => splitClip(project, "sequence-main", "track-video-1", "clip-1", 0, "clip-2"))
      .toThrow(/strictly inside/i);
  });

  it("rejects placing audio media on a video track", () => {
    const project = fixture();
    project.media.push({
      id: "audio-1", kind: "audio", name: "music.wav", sourceUri: "file:///music.wav",
    });
    expect(() => insertClip(project, "sequence-main", "track-video-1", {
      id: "audio-clip", mediaId: "audio-1",
      sourceStartFrame: 0, sourceEndFrame: 60, timelineStartFrame: 0,
    })).toThrow(/audio media cannot be placed/i);
  });
});
