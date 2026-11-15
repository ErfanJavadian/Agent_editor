import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { createEmptyProject } from "../../packages/project-core/src";
import { IndexedDbProjectStore } from "../../packages/browser-project-store/src/indexeddb";

let testCounter = 0;

function createStore(): IndexedDbProjectStore {
  testCounter += 1;
  return new IndexedDbProjectStore("agent-editor-test-" + testCounter);
}

describe("IndexedDbProjectStore", () => {
  it("persists and restores a validated project manifest", async () => {
    const store = createStore();
    const project = createEmptyProject({
      id: "project-persisted",
      name: "Persistent project",
      createdAt: "2026-01-01T00:00:00.000Z",
    });

    await store.saveProject(project);
    await expect(store.loadProject(project.id)).resolves.toEqual(project);
    await expect(store.loadProject("missing-project")).resolves.toBeNull();
    store.close();
  });

  it("persists imported media blobs without changing their bytes", async () => {
    const store = createStore();
    const original = new Blob(["video-fixture-bytes"], { type: "video/mp4" });

    await store.saveMedia("media-1", original, "sample.mp4");
    const restored = await store.loadMedia("media-1");

    expect(restored).not.toBeNull();
    expect(restored?.type).toBe("video/mp4");
    expect(await restored?.text()).toBe("video-fixture-bytes");
    store.close();
  });

  it("deletes media and project records independently", async () => {
    const store = createStore();
    const project = createEmptyProject({
      id: "project-delete",
      name: "Delete test",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    await store.saveProject(project);
    await store.saveMedia("media-delete", new Blob(["x"]), "x.bin");

    await store.deleteMedia("media-delete");
    await store.deleteProject(project.id);

    await expect(store.loadMedia("media-delete")).resolves.toBeNull();
    await expect(store.loadProject(project.id)).resolves.toBeNull();
    store.close();
  });
});
