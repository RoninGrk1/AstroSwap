/**
 * Browser ArtifactStore backed by IndexedDB.
 * Proving artifacts are large (~50MB+); Wallet SDK downloads them JIT.
 */

const DB_NAME = "astroswap-railgun-artifacts";
const STORE = "files";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

async function idbGet(path: string): Promise<Buffer | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(path);
    req.onsuccess = () => {
      const v = req.result;
      if (!v) {
        resolve(null);
        return;
      }
      if (typeof Buffer !== "undefined") {
        if (Buffer.isBuffer(v)) {
          resolve(v);
          return;
        }
        if (v instanceof Uint8Array) {
          resolve(Buffer.from(v));
          return;
        }
        if (v instanceof ArrayBuffer) {
          resolve(Buffer.from(v));
          return;
        }
      }
      resolve(null);
    };
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(path: string, data: Uint8Array): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(data, path);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbHas(path: string): Promise<boolean> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).count(path);
    req.onsuccess = () => resolve(req.result > 0);
    req.onerror = () => reject(req.error);
  });
}

export async function createBrowserArtifactStore() {
  const { ArtifactStore } = await import("@railgun-community/wallet");
  return new ArtifactStore(
    async (path: string) => idbGet(path),
    async (_dir: string, path: string, item: string | Uint8Array) => {
      const bytes =
        typeof item === "string"
          ? new TextEncoder().encode(item)
          : item instanceof Uint8Array
            ? item
            : new Uint8Array(item as ArrayBuffer);
      await idbPut(path, bytes);
    },
    async (path: string) => idbHas(path),
  );
}
