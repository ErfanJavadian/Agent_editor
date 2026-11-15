import {
  parseProjectDocument,
  serializeProjectDocument,
  type ProjectDocument,
} from "../../project-core/src";

interface StoredProject {
  id: string;
  manifest: string;
  updatedAt: string;
}

interface StoredMedia {
  id: string;
  name: string;
  mimeType: string;
  blob: Blob;
  updatedAt: string;
}

function transactionCompleted(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

/**
 * Browser-local persistence for project manifests and imported media blobs.
 * Media bytes never leave the browser through this adapter.
 */
export class IndexedDbProjectStore {
  private databasePromise: Promise<IDBDatabase> | null = null;

  constructor(
    private readonly databaseName = "agent-editor-local",
    private readonly databaseVersion = 1,
  ) {}

  private openDatabase(): Promise<IDBDatabase> {
    if (this.databasePromise) return this.databasePromise;

    this.databasePromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        reject(new Error("IndexedDB is not available in this environment"));
        return;
      }

      const request = indexedDB.open(this.databaseName, this.databaseVersion);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains("projects")) {
          database.createObjectStore("projects", { keyPath: "id" });
        }
        if (!database.objectStoreNames.contains("media")) {
          database.createObjectStore("media", { keyPath: "id" });
        }
      };
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => database.close();
        resolve(database);
      };
      request.onerror = () => {
        this.databasePromise = null;
        reject(request.error ?? new Error("Unable to open local project database"));
      };
      request.onblocked = () => {
        this.databasePromise = null;
        reject(new Error("Local project database upgrade is blocked by another tab"));
      };
    });

    return this.databasePromise;
  }

  async saveProject(project: ProjectDocument): Promise<void> {
    const database = await this.openDatabase();
    const transaction = database.transaction("projects", "readwrite");
    const record: StoredProject = {
      id: project.id,
      manifest: serializeProjectDocument(project),
      updatedAt: project.updatedAt,
    };
    transaction.objectStore("projects").put(record);
    await transactionCompleted(transaction);
  }

  async loadProject(projectId: string): Promise<ProjectDocument | null> {
    const database = await this.openDatabase();
    const transaction = database.transaction("projects", "readonly");
    const request = transaction.objectStore("projects").get(projectId) as IDBRequest<StoredProject | undefined>;
    const record = await requestResult(request);
    await transactionCompleted(transaction);
    return record ? parseProjectDocument(record.manifest) : null;
  }

  async saveMedia(mediaId: string, file: Blob, name: string): Promise<void> {
    if (!mediaId.trim()) throw new Error("Media ID cannot be empty");
    if (!name.trim()) throw new Error("Media name cannot be empty");
    const database = await this.openDatabase();
    const transaction = database.transaction("media", "readwrite");
    const record: StoredMedia = {
      id: mediaId,
      name,
      mimeType: file.type || "application/octet-stream",
      blob: file,
      updatedAt: new Date().toISOString(),
    };
    transaction.objectStore("media").put(record);
    await transactionCompleted(transaction);
  }

  async loadMedia(mediaId: string): Promise<Blob | null> {
    const database = await this.openDatabase();
    const transaction = database.transaction("media", "readonly");
    const request = transaction.objectStore("media").get(mediaId) as IDBRequest<StoredMedia | undefined>;
    const record = await requestResult(request);
    await transactionCompleted(transaction);
    return record?.blob ?? null;
  }

  async deleteMedia(mediaId: string): Promise<void> {
    const database = await this.openDatabase();
    const transaction = database.transaction("media", "readwrite");
    transaction.objectStore("media").delete(mediaId);
    await transactionCompleted(transaction);
  }

  async deleteProject(projectId: string): Promise<void> {
    const database = await this.openDatabase();
    const transaction = database.transaction("projects", "readwrite");
    transaction.objectStore("projects").delete(projectId);
    await transactionCompleted(transaction);
  }

  close(): void {
    void this.databasePromise?.then((database) => database.close());
    this.databasePromise = null;
  }
}
