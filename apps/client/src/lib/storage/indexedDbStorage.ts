// apps/client/src/lib/storage/indexedDbStorage.ts
/**
 * Enterprise IndexedDB Blob & Project Storage for PerfectPic Customizer.
 * Replaces heavy base64 strings and localStorage 5MB quota constraints
 * with asynchronous browser IndexedDB binary Blob storage.
 */

const DB_NAME = 'perfectpic_editor_db';
const DB_VERSION = 1;
const PHOTO_STORE = 'photo_blobs';
const PROJECT_STORE = 'project_snapshots';

class IndexedDbStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private objectUrlCache: Map<string, string> = new Map();

  private getDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('IndexedDB is only available in browser environments'));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(PHOTO_STORE)) {
            db.createObjectStore(PHOTO_STORE, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(PROJECT_STORE)) {
            db.createObjectStore(PROJECT_STORE, { keyPath: 'projectId' });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    }

    return this.dbPromise;
  }

  /**
   * Stores a photo Blob directly in IndexedDB.
   */
  public async storePhotoBlob(id: string, blob: Blob, name?: string): Promise<string> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, 'readwrite');
      const store = tx.objectStore(PHOTO_STORE);
      const record = {
        id,
        blob,
        name: name || id,
        mimeType: blob.type || 'image/jpeg',
        size: blob.size,
        updatedAt: Date.now(),
      };

      const request = store.put(record);
      request.onsuccess = () => {
        // Create an ephemeral Object URL for instant Canvas/DOM rendering
        const objectUrl = URL.createObjectURL(blob);
        this.objectUrlCache.set(id, objectUrl);
        resolve(objectUrl);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retrieves a photo Blob by its ID.
   */
  public async getPhotoBlob(id: string): Promise<Blob | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, 'readonly');
      const store = tx.objectStore(PHOTO_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        const record = request.result;
        resolve(record ? record.blob : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Returns an active object URL for the photo ID, creating one from the Blob if necessary.
   */
  public async getPhotoObjectUrl(id: string): Promise<string | null> {
    if (this.objectUrlCache.has(id)) {
      return this.objectUrlCache.get(id)!;
    }

    const blob = await this.getPhotoBlob(id);
    if (!blob) return null;

    const objectUrl = URL.createObjectURL(blob);
    this.objectUrlCache.set(id, objectUrl);
    return objectUrl;
  }

  /**
   * Persists a full project editor state snapshot to IndexedDB.
   * Completely bypasses localStorage quota limits.
   */
  public async storeProjectSnapshot(projectId: string, snapshot: any): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PROJECT_STORE, 'readwrite');
      const store = tx.objectStore(PROJECT_STORE);
      const record = {
        projectId,
        snapshot,
        updatedAt: Date.now(),
      };

      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retrieves a full project snapshot from IndexedDB.
   */
  public async getProjectSnapshot(projectId: string): Promise<any | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PROJECT_STORE, 'readonly');
      const store = tx.objectStore(PROJECT_STORE);
      const request = store.get(projectId);

      request.onsuccess = () => {
        const record = request.result;
        resolve(record ? record.snapshot : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Removes a project snapshot from IndexedDB.
   */
  public async deleteProjectSnapshot(projectId: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PROJECT_STORE, 'readwrite');
      const store = tx.objectStore(PROJECT_STORE);
      const request = store.delete(projectId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Revokes and clears cached object URLs to prevent browser memory leaks.
   */
  public releaseObjectUrls(): void {
    this.objectUrlCache.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    });
    this.objectUrlCache.clear();
  }
}

export const indexedDbStorage = new IndexedDbStorage();
export default indexedDbStorage;
