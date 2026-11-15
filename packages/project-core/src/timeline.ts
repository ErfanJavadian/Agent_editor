import { assertValidProject } from "./project";
import type { ProjectDocument, TimelineClip, TimelineTrack } from "./types";

function cloneProject(project: ProjectDocument): ProjectDocument {
  return structuredClone(project);
}

function findTrack(
  project: ProjectDocument,
  sequenceId: string,
  trackId: string,
): TimelineTrack {
  const sequence = project.sequences.find((item) => item.id === sequenceId);
  if (!sequence) throw new Error("Sequence not found: " + sequenceId);
  const track = sequence.tracks.find((item) => item.id === trackId);
  if (!track) throw new Error("Track not found: " + trackId);
  return track;
}

function findClip(track: TimelineTrack, clipId: string): TimelineClip {
  const clip = track.clips.find((item) => item.id === clipId);
  if (!clip) throw new Error("Clip not found: " + clipId);
  return clip;
}

function commit(project: ProjectDocument): ProjectDocument {
  project.updatedAt = new Date().toISOString();
  assertValidProject(project);
  return project;
}

export function insertClip(
  source: ProjectDocument,
  sequenceId: string,
  trackId: string,
  clip: TimelineClip,
): ProjectDocument {
  const project = cloneProject(source);
  const track = findTrack(project, sequenceId, trackId);
  track.clips.push({ ...clip });
  return commit(project);
}

export function moveClipToTrack(
  source: ProjectDocument,
  sequenceId: string,
  fromTrackId: string,
  toTrackId: string,
  clipId: string,
  newTimelineStartFrame: number,
): ProjectDocument {
  if (!Number.isSafeInteger(newTimelineStartFrame) || newTimelineStartFrame < 0) {
    throw new Error("New timeline position must be a non-negative safe integer");
  }
  if (fromTrackId === toTrackId) {
    return moveClip(source, sequenceId, fromTrackId, clipId, newTimelineStartFrame);
  }

  const project = cloneProject(source);
  const fromTrack = findTrack(project, sequenceId, fromTrackId);
  const toTrack = findTrack(project, sequenceId, toTrackId);
  const index = fromTrack.clips.findIndex((clip) => clip.id === clipId);
  if (index < 0) throw new Error("Clip not found: " + clipId);
  const [clip] = fromTrack.clips.splice(index, 1);
  if (!clip) throw new Error("Clip not found: " + clipId);
  clip.timelineStartFrame = newTimelineStartFrame;
  toTrack.clips.push(clip);
  return commit(project);
}

export function removeClip(
  source: ProjectDocument,
  sequenceId: string,
  trackId: string,
  clipId: string,
): ProjectDocument {
  const project = cloneProject(source);
  const track = findTrack(project, sequenceId, trackId);
  const index = track.clips.findIndex((clip) => clip.id === clipId);
  if (index < 0) throw new Error("Clip not found: " + clipId);
  track.clips.splice(index, 1);
  return commit(project);
}

export function moveClip(
  source: ProjectDocument,
  sequenceId: string,
  trackId: string,
  clipId: string,
  newTimelineStartFrame: number,
): ProjectDocument {
  if (!Number.isSafeInteger(newTimelineStartFrame) || newTimelineStartFrame < 0) {
    throw new Error("New timeline position must be a non-negative safe integer");
  }
  const project = cloneProject(source);
  const track = findTrack(project, sequenceId, trackId);
  findClip(track, clipId).timelineStartFrame = newTimelineStartFrame;
  return commit(project);
}

export function trimClip(
  source: ProjectDocument,
  sequenceId: string,
  trackId: string,
  clipId: string,
  edge: "start" | "end",
  timelineFrame: number,
): ProjectDocument {
  if (!Number.isSafeInteger(timelineFrame) || timelineFrame < 0) {
    throw new Error("Trim position must be a non-negative safe integer");
  }
  const project = cloneProject(source);
  const track = findTrack(project, sequenceId, trackId);
  const clip = findClip(track, clipId);
  const oldEnd = clip.timelineStartFrame + (clip.sourceEndFrame - clip.sourceStartFrame);

  if (edge === "start") {
    if (timelineFrame <= clip.timelineStartFrame || timelineFrame >= oldEnd) {
      throw new Error("Start trim must remain inside the existing clip");
    }
    const delta = timelineFrame - clip.timelineStartFrame;
    clip.sourceStartFrame += delta;
    clip.timelineStartFrame = timelineFrame;
  } else {
    if (timelineFrame <= clip.timelineStartFrame || timelineFrame >= oldEnd + 1) {
      throw new Error("End trim must remain after the clip start");
    }
    clip.sourceEndFrame = clip.sourceStartFrame + (timelineFrame - clip.timelineStartFrame);
  }

  return commit(project);
}

export function splitClip(
  source: ProjectDocument,
  sequenceId: string,
  trackId: string,
  clipId: string,
  splitAtTimelineFrame: number,
  rightClipId: string,
): ProjectDocument {
  if (!rightClipId.trim()) throw new Error("New clip ID cannot be empty");
  const project = cloneProject(source);
  const track = findTrack(project, sequenceId, trackId);
  const clip = findClip(track, clipId);
  if (project.sequences.some((sequence) =>
    sequence.tracks.some((item) => item.clips.some((candidate) => candidate.id === rightClipId)),
  )) {
    throw new Error("Clip ID already exists: " + rightClipId);
  }

  const duration = clip.sourceEndFrame - clip.sourceStartFrame;
  const timelineEnd = clip.timelineStartFrame + duration;
  if (!Number.isSafeInteger(splitAtTimelineFrame) ||
      splitAtTimelineFrame <= clip.timelineStartFrame ||
      splitAtTimelineFrame >= timelineEnd) {
    throw new Error("Split position must be strictly inside the clip");
  }

  const sourceSplitFrame = clip.sourceStartFrame +
    (splitAtTimelineFrame - clip.timelineStartFrame);
  const rightClip: TimelineClip = {
    id: rightClipId,
    mediaId: clip.mediaId,
    sourceStartFrame: sourceSplitFrame,
    sourceEndFrame: clip.sourceEndFrame,
    timelineStartFrame: splitAtTimelineFrame,
  };
  clip.sourceEndFrame = sourceSplitFrame;
  track.clips.push(rightClip);
  return commit(project);
}
