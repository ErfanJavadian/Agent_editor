import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import {
  createEmptyProject,
  insertClip,
  moveClip as moveTimelineClip,
  moveClipToTrack as moveClipAcrossTracks,
  removeClip as removeTimelineClip,
  splitClip as splitTimelineClip,
  trimClip as trimTimelineClip,
  type MediaAsset,
  type ProjectDocument,
  type TimelineClip,
  type TimelineTrack,
} from "../../packages/project-core/src";
import { IndexedDbProjectStore } from "../../packages/browser-project-store/src/indexeddb";

const PIXELS_PER_FRAME = 1.6;
const FRAMES_PER_SECOND = 30;
const LOCAL_PROJECT_ID = "agent-editor-local-project";

type MediaUrlMap = Record<string, string>;

function clipDuration(clip: TimelineClip): number {
  return clip.sourceEndFrame - clip.sourceStartFrame;
}

function timelineEnd(clip: TimelineClip): number {
  return clip.timelineStartFrame + clipDuration(clip);
}

function formatTime(frame: number, fps = FRAMES_PER_SECOND): string {
  const seconds = Math.max(0, Math.floor(frame / fps));
  const minutes = Math.floor(seconds / 60);
  return String(minutes).padStart(2, "0") + ":" +
    String(seconds % 60).padStart(2, "0") + ":" +
    String(Math.floor(frame % fps)).padStart(2, "0");
}

function readMediaMetadata(file: File, url: string): Promise<{
  durationFrames: number;
  width?: number;
  height?: number;
}> {
  return new Promise((resolve, reject) => {
    const isAudio = file.type.startsWith("audio/");
    const element = isAudio ? new Audio() : document.createElement("video");
    element.preload = "metadata";
    element.onloadedmetadata = () => {
      if (!Number.isFinite(element.duration) || element.duration <= 0) {
        reject(new Error("مدت فایل رسانه قابل تشخیص نیست."));
        return;
      }
      const metadata = isAudio ? undefined : element as HTMLVideoElement;
      resolve({
        durationFrames: Math.max(1, Math.ceil(element.duration * FRAMES_PER_SECOND)),
        ...(metadata ? { width: metadata.videoWidth, height: metadata.videoHeight } : {}),
      });
    };
    element.onerror = () => reject(new Error("خواندن اطلاعات فایل ناموفق بود."));
    element.src = url;
  });
}

export default function App() {
  const [project, setProject] = useState<ProjectDocument>(() =>
    createEmptyProject({ id: LOCAL_PROJECT_ID, name: "پروژه بدون عنوان" }),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [mediaUrls, setMediaUrls] = useState<MediaUrlMap>({});
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [playhead, setPlayhead] = useState(0);
  const [notice, setNotice] = useState("برای شروع، فایل ویدئو یا صدا را وارد کن.");
  const [isPlaying, setIsPlaying] = useState(false);
  const [past, setPast] = useState<ProjectDocument[]>([]);
  const [future, setFuture] = useState<ProjectDocument[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const objectUrlsRef = useRef<string[]>([]);
  const storeRef = useRef<IndexedDbProjectStore | null>(null);
  if (!storeRef.current) storeRef.current = new IndexedDbProjectStore();
  const store = storeRef.current;

  const sequence = project.sequences[0]!;
  const fps = sequence.frameRate.numerator / sequence.frameRate.denominator;
  const selectedMedia = project.media.find((item) => item.id === selectedMediaId) ?? null;
  const tracks = sequence.tracks;
  const allClips = tracks.flatMap((track) =>
    track.clips.map((clip) => ({ clip, track })),
  );
  const selectedEntry = allClips.find((entry) => entry.clip.id === selectedClipId) ?? null;
  const durationFrames = Math.max(
    300,
    ...allClips.map(({ clip }) => timelineEnd(clip)),
  );
  const activeVideoEntry = allClips.find(({ clip, track }) =>
    track.kind === "video" &&
    playhead >= clip.timelineStartFrame &&
    playhead < timelineEnd(clip),
  ) ?? null;
  const activeVideoMedia = activeVideoEntry
    ? project.media.find((item) => item.id === activeVideoEntry.clip.mediaId) ?? null
    : null;
  const activeVideoUrl = activeVideoMedia ? mediaUrls[activeVideoMedia.id] : undefined;

  const sortedMedia = useMemo(
    () => [...project.media].sort((a, b) => a.name.localeCompare(b.name)),
    [project.media],
  );

  useEffect(() => {
    let cancelled = false;
    async function restoreProject() {
      try {
        const stored = await store.loadProject(LOCAL_PROJECT_ID);
        const restored = stored ?? createEmptyProject({
          id: LOCAL_PROJECT_ID,
          name: "پروژه بدون عنوان",
        });
        const restoredUrls: MediaUrlMap = {};
        for (const media of restored.media) {
          const blob = await store.loadMedia(media.id);
          if (blob) {
            const url = URL.createObjectURL(blob);
            restoredUrls[media.id] = url;
            objectUrlsRef.current.push(url);
          }
        }
        if (cancelled) {
          Object.values(restoredUrls).forEach((url) => URL.revokeObjectURL(url));
          return;
        }
        setProject(restored);
        setMediaUrls(restoredUrls);
        setIsLoading(false);
        if (!stored) await store.saveProject(restored);
        if (stored && restored.media.length !== Object.keys(restoredUrls).length) {
          setNotice("برخی فایل‌های رسانه در حافظه محلی پیدا نشدند؛ باید دوباره وارد شوند.");
        } else {
          setNotice("پروژه و رسانه‌های ذخیره‌شده از حافظه محلی بازیابی شدند.");
        }
      } catch (error) {
        if (!cancelled) {
          setNotice(error instanceof Error ? error.message : "بازیابی پروژه محلی ناموفق بود.");
          setIsLoading(false);
        }
      }
    }
    void restoreProject();
    return () => {
      cancelled = true;
      for (const url of objectUrlsRef.current) URL.revokeObjectURL(url);
      objectUrlsRef.current = [];
      store.close();
    };
  }, [store]);

  useEffect(() => {
    if (isLoading) return;
    let active = true;
    void store.saveProject(project).then(() => {
      if (active) setNotice((current) =>
        current.startsWith("پروژه") ? current : "پروژه به‌صورت خودکار در حافظه محلی ذخیره شد.",
      );
    }).catch((error: unknown) => {
      if (active) setNotice(error instanceof Error ? error.message : "ذخیره محلی پروژه ناموفق بود.");
    });
    return () => { active = false; };
  }, [project, isLoading, store]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeVideoEntry || !activeVideoUrl || isPlaying) return;
    const sourceFrame = activeVideoEntry.clip.sourceStartFrame +
      (playhead - activeVideoEntry.clip.timelineStartFrame);
    const targetTime = Math.max(0, sourceFrame / fps);
    if (Number.isFinite(targetTime) && Math.abs(video.currentTime - targetTime) > 0.08) {
      video.currentTime = targetTime;
    }
  }, [activeVideoEntry, activeVideoUrl, fps, isPlaying, playhead]);

  function applyProject(next: ProjectDocument) {
    setPast((items) => [...items, project].slice(-40));
    setFuture([]);
    setProject(next);
  }

  async function importFiles(files: FileList | null) {
    if (!files?.length) return;
    const imported: MediaAsset[] = [];
    const urls: MediaUrlMap = {};

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("video/") && !file.type.startsWith("audio/")) {
        setNotice("این نسخه فعلاً فقط فایل‌های ویدئو و صدا را وارد می‌کند: " + file.name);
        continue;
      }
      const id = crypto.randomUUID();
      const url = URL.createObjectURL(file);
      try {
        const metadata = await readMediaMetadata(file, url);
        await store.saveMedia(id, file, file.name);
        objectUrlsRef.current.push(url);
        urls[id] = url;
        imported.push({
          id,
          kind: file.type.startsWith("audio/") ? "audio" : "video",
          name: file.name,
          sourceUri: "indexeddb://media/" + id,
          ...metadata,
        });
      } catch (error) {
        URL.revokeObjectURL(url);
        setNotice(error instanceof Error ? error.message : "واردکردن فایل ناموفق بود.");
      }
    }

    if (imported.length) {
      const next = {
        ...project,
        media: [...project.media, ...imported],
        updatedAt: new Date().toISOString(),
      };
      setProject(next);
      setMediaUrls((current) => ({ ...current, ...urls }));
      setSelectedMediaId(imported[0]!.id);
      setNotice(imported.length + " فایل رسانه در حافظه محلی ذخیره و به پروژه اضافه شد.");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function addSelectedToTimeline() {
    if (!selectedMedia) return;
    const targetTrack = tracks.find((track) => track.kind === selectedMedia.kind) ??
      tracks.find((track) => track.kind === "video");
    if (!targetTrack) return;
    const end = Math.max(0, ...targetTrack.clips.map(timelineEnd));
    const clip: TimelineClip = {
      id: crypto.randomUUID(),
      mediaId: selectedMedia.id,
      sourceStartFrame: 0,
      sourceEndFrame: selectedMedia.durationFrames ?? 150,
      timelineStartFrame: end,
    };
    try {
      const next = insertClip(project, sequence.id, targetTrack.id, clip);
      applyProject(next);
      setSelectedClipId(clip.id);
      setPlayhead(clip.timelineStartFrame);
      setNotice("کلیپ به تایم‌لاین اضافه شد.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "افزودن کلیپ ناموفق بود.");
    }
  }

  function runTimelineOperation(operation: () => ProjectDocument, success: string): boolean {
    try {
      applyProject(operation());
      setNotice(success);
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "عملیات تدوین ناموفق بود.");
      return false;
    }
  }

  function handleTimelineDrop(event: DragEvent<HTMLDivElement>, targetTrack: TimelineTrack) {
    event.preventDefault();
    const raw = event.dataTransfer.getData("application/x-agent-editor-item");
    if (!raw) return;

    let payload: { type?: string; mediaId?: string; clipId?: string; trackId?: string };
    try {
      payload = JSON.parse(raw) as typeof payload;
    } catch {
      setNotice("اطلاعات Drag & Drop معتبر نیست.");
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const frame = Math.max(0, Math.round((event.clientX - bounds.left) / PIXELS_PER_FRAME));

    if (payload.type === "clip" && payload.clipId && payload.trackId) {
      const entry = allClips.find((item) => item.clip.id === payload.clipId);
      if (!entry || entry.track.id !== payload.trackId) return;
      const succeeded = runTimelineOperation(
        () => moveClipAcrossTracks(
          project, sequence.id, entry.track.id, targetTrack.id, entry.clip.id, frame,
        ),
        "کلیپ به موقعیت جدید منتقل شد.",
      );
      if (succeeded) {
        setSelectedClipId(entry.clip.id);
        setPlayhead(frame);
      }
      return;
    }

    if (payload.type === "media" && payload.mediaId) {
      const media = project.media.find((item) => item.id === payload.mediaId);
      if (!media) return;
      const clip: TimelineClip = {
        id: crypto.randomUUID(),
        mediaId: media.id,
        sourceStartFrame: 0,
        sourceEndFrame: media.durationFrames ?? 150,
        timelineStartFrame: frame,
      };
      const succeeded = runTimelineOperation(
        () => insertClip(project, sequence.id, targetTrack.id, clip),
        "رسانه در محل رهاشده به تایم‌لاین اضافه شد.",
      );
      if (succeeded) {
        setSelectedClipId(clip.id);
        setPlayhead(frame);
      }
    }
  }

  function splitSelectedClip() {
    if (!selectedEntry) return;
    const rightId = crypto.randomUUID();
    const succeeded = runTimelineOperation(
      () => splitTimelineClip(
        project, sequence.id, selectedEntry.track.id, selectedEntry.clip.id, playhead, rightId,
      ),
      "کلیپ در محل نشانگر پخش برش خورد.",
    );
    if (succeeded) setSelectedClipId(rightId);
  }

  function moveSelectedClip(delta: number) {
    if (!selectedEntry) return;
    const nextStart = Math.max(0, selectedEntry.clip.timelineStartFrame + delta);
    runTimelineOperation(
      () => moveTimelineClip(
        project, sequence.id, selectedEntry.track.id, selectedEntry.clip.id, nextStart,
      ),
      "موقعیت کلیپ تغییر کرد.",
    );
  }

  function deleteSelectedClip() {
    if (!selectedEntry) return;
    const succeeded = runTimelineOperation(
      () => removeTimelineClip(project, sequence.id, selectedEntry.track.id, selectedEntry.clip.id),
      "کلیپ از تایم‌لاین حذف شد؛ فایل اصلی رسانه دست‌نخورده باقی ماند.",
    );
    if (succeeded) setSelectedClipId(null);
  }

  function trimSelectedEnd() {
    if (!selectedEntry) return;
    runTimelineOperation(
      () => trimTimelineClip(
        project, sequence.id, selectedEntry.track.id, selectedEntry.clip.id, "end", playhead,
      ),
      "انتهای کلیپ تا محل نشانگر پخش کوتاه شد.",
    );
  }

  function undo() {
    if (!past.length) return;
    const previous = past[past.length - 1]!;
    setFuture((items) => [project, ...items]);
    setPast((items) => items.slice(0, -1));
    setProject(previous);
    setNotice("آخرین تغییر پروژه بازگردانی شد.");
  }

  function redo() {
    if (!future.length) return;
    const next = future[0]!;
    setPast((items) => [...items, project].slice(-40));
    setFuture((items) => items.slice(1));
    setProject(next);
    setNotice("تغییر پروژه دوباره اعمال شد.");
  }

  function handleVideoTimeUpdate() {
    if (!videoRef.current || !activeVideoEntry) return;
    const sourceFrame = Math.floor(videoRef.current.currentTime * fps);
    setPlayhead(
      activeVideoEntry.clip.timelineStartFrame +
      sourceFrame - activeVideoEntry.clip.sourceStartFrame,
    );
  }

  function seek(frame: number) {
    const bounded = Math.max(0, Math.min(durationFrames, frame));
    setPlayhead(bounded);
    if (videoRef.current) videoRef.current.pause();
    setIsPlaying(false);
  }

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      if (target?.isContentEditable || tagName === "INPUT" ||
          tagName === "TEXTAREA" || tagName === "SELECT") return;

      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (modifier && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
      }
      if (event.code === "Space") {
        event.preventDefault();
        if (videoRef.current) {
          if (videoRef.current.paused) void videoRef.current.play();
          else videoRef.current.pause();
        }
        return;
      }
      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        splitSelectedClip();
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteSelectedClip();
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [project, selectedEntry, playhead, past, future, isPlaying]);

  if (isLoading) {
    return <main className="loading-screen" dir="rtl">
      <div className="preview-mark">AE</div>
      <strong>در حال بازیابی پروژه</strong>
      <span>در حال خواندن پروژه و رسانه‌ها از حافظه محلی مرورگر…</span>
    </main>;
  }

  return (
    <main className="editor-app" dir="rtl">
      <header className="editor-topbar">
        <a className="editor-brand" href="/" aria-label="Agent Editor">
          <span className="brand-symbol">AE</span>
          <span><strong>AGENT EDITOR</strong><small>AI VIDEO WORKSTATION</small></span>
        </a>
        <div className="project-heading">
          <span className="live-dot" />
          <input
            aria-label="نام پروژه"
            value={project.name}
            onChange={(event) => setProject({
              ...project, name: event.target.value, updatedAt: new Date().toISOString(),
            })}
          />
          <span className="project-format">{sequence.width} × {sequence.height} · {fps} FPS</span>
        </div>
        <div className="topbar-actions">
          <span className="local-badge">LOCAL STORAGE</span>
          <button className="primary-button" disabled={isLoading} onClick={() => fileInputRef.current?.click()}>
            <span>＋</span> واردکردن رسانه
          </button>
          <input
            ref={fileInputRef}
            className="visually-hidden"
            type="file"
            accept="video/*,audio/*"
            multiple
            onChange={(event) => void importFiles(event.target.files)}
          />
        </div>
      </header>

      <div className="workspace">
        <aside className="media-panel">
          <div className="panel-title">
            <div><span className="overline">PROJECT ASSETS</span><h2>رسانه‌ها</h2></div>
            <span className="count-pill">{project.media.length}</span>
          </div>
          <button className="import-dropzone" disabled={isLoading} onClick={() => fileInputRef.current?.click()}>
            <span className="upload-icon">↥</span>
            <strong>افزودن فایل ویدئو یا صدا</strong>
            <small>MP4 · MOV · WEBM · MP3 · WAV</small>
          </button>
          <div className="asset-list">
            {sortedMedia.length === 0 ? (
              <div className="empty-assets">
                <span>▧</span><p>هنوز رسانه‌ای وارد نشده است.</p>
                <small>فایل‌ها در همین نشست مرورگر نگهداری می‌شوند.</small>
              </div>
            ) : sortedMedia.map((media) => (
              <button
                key={media.id}
                className={"asset-item" + (selectedMediaId === media.id ? " selected" : "")}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("application/x-agent-editor-item", JSON.stringify({ type: "media", mediaId: media.id }));
                  event.dataTransfer.effectAllowed = "copy";
                }}
                onClick={() => setSelectedMediaId(media.id)}
              >
                <span className={"asset-thumb " + media.kind}>
                  {media.kind === "audio" ? "♫" : "▶"}
                </span>
                <span className="asset-meta">
                  <strong title={media.name}>{media.name}</strong>
                  <small>{media.kind === "audio" ? "صوتی" : "ویدئو"} · {formatTime(media.durationFrames ?? 0)}</small>
                </span>
              </button>
            ))}
          </div>
          <div className="media-panel-bottom">
            <span className="tiny-status" /> رسانه‌ها در حافظه محلی مرورگر ذخیره می‌شوند
          </div>
        </aside>

        <section className="main-stage">
          <div className="stage-toolbar">
            <div className="stage-tabs"><span className="active-tab">پیش‌نمایش</span><span>مانیتور خروجی</span></div>
            <span className="stage-resolution">{sequence.width} × {sequence.height}</span>
          </div>
          <div className="preview-area">
            {activeVideoUrl ? (
              <video
                key={activeVideoUrl}
                ref={videoRef}
                src={activeVideoUrl}
                onTimeUpdate={handleVideoTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                controls
                playsInline
              />
            ) : (
              <div className="preview-placeholder">
                <div className="preview-mark">AE</div>
                <strong>پیش‌نمایش پروژه</strong>
                <span>{project.media.length ? "یک کلیپ ویدئویی را در تایم‌لاین انتخاب کن." : "برای شروع، رسانه وارد کن."}</span>
                <small>REAL-TIME PREVIEW · FRAME ACCURATE TIMELINE</small>
              </div>
            )}
            <div className="preview-timecode">{formatTime(playhead, fps)}</div>
          </div>

          <div className="timeline-toolbar">
            <div className="tool-group">
              <button title="Undo" onClick={undo} disabled={!past.length}>↶</button>
              <button title="Redo" onClick={redo} disabled={!future.length}>↷</button>
              <span className="tool-divider" />
              <button title="انتقال به ابتدای تایم‌لاین" onClick={() => seek(0)}>|◀</button>
              <button title="پخش/توقف" onClick={() => {
                if (videoRef.current) {
                  if (videoRef.current.paused) void videoRef.current.play();
                  else videoRef.current.pause();
                }
              }}>{isPlaying ? "Ⅱ" : "▶"}</button>
            </div>
            <div className="tool-group edit-tools">
              <button onClick={splitSelectedClip} disabled={!selectedEntry}>✂ برش در نشانگر</button>
              <button onClick={() => moveSelectedClip(-fps)} disabled={!selectedEntry}>−۱ ثانیه</button>
              <button onClick={() => moveSelectedClip(fps)} disabled={!selectedEntry}>+۱ ثانیه</button>
              <button onClick={trimSelectedEnd} disabled={!selectedEntry}>Trim پایان</button>
              <button onClick={deleteSelectedClip} disabled={!selectedEntry}>حذف کلیپ</button>
            </div>
            <div className="time-display">{formatTime(playhead, fps)}</div>
          </div>

          <div className="timeline-heading">
            <div><span className="overline">EDIT SEQUENCE</span><h2>تایم‌لاین</h2></div>
            <button className="add-timeline-button" onClick={addSelectedToTimeline} disabled={!selectedMedia}>
              ＋ افزودن انتخاب‌شده به تایم‌لاین
            </button>
          </div>
          <div className="timeline-scroll">
            <div className="timeline-canvas" style={{ width: Math.max(720, durationFrames * PIXELS_PER_FRAME + 120) }}>
              <div className="ruler">
                {Array.from({ length: Math.ceil(durationFrames / (fps * 5)) + 1 }, (_, index) => {
                  const frame = index * fps * 5;
                  return <button key={frame} style={{ left: frame * PIXELS_PER_FRAME }} onClick={() => seek(frame)}>
                    {formatTime(frame, fps).slice(0, 5)}
                  </button>;
                })}
              </div>
              <div className="track-stack">
                {tracks.map((track: TimelineTrack) => (
                  <div className="track-row" key={track.id}>
                    <button
                      className={"track-label " + track.kind}
                      onClick={() => setNotice(track.name + " انتخاب شد.")}
                    >
                      <strong>{track.kind === "video" ? "▣" : "♫"} {track.name}</strong>
                      <small>{track.kind === "video" ? "VIDEO" : "AUDIO"}</small>
                    </button>
                    <div
                      className="track-lane"
                      onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }}
                      onDrop={(event) => handleTimelineDrop(event, track)}
                    >
                      {track.clips.map((clip) => {
                        const media = project.media.find((item) => item.id === clip.mediaId);
                        return (
                          <button
                            key={clip.id}
                            className={"timeline-clip " + track.kind +
                              (selectedClipId === clip.id ? " clip-selected" : "")}
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.setData("application/x-agent-editor-item", JSON.stringify({ type: "clip", clipId: clip.id, trackId: track.id }));
                              event.dataTransfer.effectAllowed = "move";
                            }}
                            style={{
                              left: clip.timelineStartFrame * PIXELS_PER_FRAME,
                              width: Math.max(76, clipDuration(clip) * PIXELS_PER_FRAME),
                            }}
                            onClick={() => {
                              setSelectedClipId(clip.id);
                              seek(clip.timelineStartFrame);
                            }}
                            title={media?.name ?? "Media"}
                          >
                            <span className="clip-name">{media?.name ?? "Unknown media"}</span>
                            <span className="clip-duration">{formatTime(clipDuration(clip), fps)}</span>
                            <span className="clip-wave" />
                          </button>
                        );
                      })}
                      {track.clips.length === 0 && <span className="lane-hint">رسانه یا کلیپ را اینجا رها کن</span>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="playhead-line" style={{ left: playhead * PIXELS_PER_FRAME + 80 }}>
                <span />
              </div>
            </div>
          </div>
          <div className="timeline-footer">
            <span>{tracks.reduce((sum, track) => sum + track.clips.length, 0)} کلیپ</span>
            <span>Space پخش · S برش · Ctrl+Z بازگشت · Delete حذف</span>
            <span>زمان بر اساس فریم صحیح · {fps} فریم بر ثانیه</span>
            <span>{formatTime(durationFrames, fps)} محدوده نمایش</span>
          </div>
        </section>

        <aside className="inspector-panel">
          <div className="panel-title"><div><span className="overline">INSPECTOR</span><h2>ویژگی‌ها</h2></div></div>
          {selectedEntry ? (
            <div className="inspector-content">
              <div className="inspector-preview-icon">{selectedEntry.track.kind === "video" ? "▣" : "♫"}</div>
              <strong className="inspector-name">
                {project.media.find((item) => item.id === selectedEntry.clip.mediaId)?.name}
              </strong>
              <div className="property-row"><span>شروع تایم‌لاین</span><b>{formatTime(selectedEntry.clip.timelineStartFrame, fps)}</b></div>
              <div className="property-row"><span>شروع منبع</span><b>{formatTime(selectedEntry.clip.sourceStartFrame, fps)}</b></div>
              <div className="property-row"><span>پایان منبع</span><b>{formatTime(selectedEntry.clip.sourceEndFrame, fps)}</b></div>
              <div className="property-row"><span>مدت کلیپ</span><b>{formatTime(clipDuration(selectedEntry.clip), fps)}</b></div>
              <div className="property-row"><span>ترک</span><b>{selectedEntry.track.name}</b></div>
            </div>
          ) : selectedMedia ? (
            <div className="inspector-content">
              <div className="inspector-preview-icon">{selectedMedia.kind === "audio" ? "♫" : "▶"}</div>
              <strong className="inspector-name">{selectedMedia.name}</strong>
              <div className="property-row"><span>نوع</span><b>{selectedMedia.kind === "audio" ? "صوتی" : "ویدئو"}</b></div>
              <div className="property-row"><span>مدت</span><b>{formatTime(selectedMedia.durationFrames ?? 0, fps)}</b></div>
              {selectedMedia.width && <div className="property-row"><span>ابعاد</span><b>{selectedMedia.width} × {selectedMedia.height}</b></div>}
              <button className="inspector-add" onClick={addSelectedToTimeline}>افزودن به تایم‌لاین</button>
            </div>
          ) : (
            <div className="inspector-empty">برای مشاهده جزئیات، یک رسانه یا کلیپ را انتخاب کن.</div>
          )}
          <div className="agent-card">
            <span className="agent-orb">✳</span>
            <span className="overline">AI EDITING AGENT</span>
            <h3>دستیار تدوین</h3>
            <p>ایجنت در مرحله اتصال به موتور تدوین است. در نسخه بعدی می‌تواند پروژه را تحلیل کند و تغییرات پیشنهادی بسازد.</p>
            <button disabled>به‌زودی فعال می‌شود</button>
          </div>
        </aside>
      </div>

      <footer className="editor-statusbar">
        <span><i /> {notice}</span>
        <span>ذخیره خودکار محلی · رسانه‌ها به سرور آپلود نمی‌شوند</span>
      </footer>
    </main>
  );
}
