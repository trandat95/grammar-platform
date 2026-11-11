/**
 * Local Storage & IndexedDB Unified Storage Adapter
 * Provides reliable persistent storage for offline queues and user state.
 */

const DB_NAME = "grammar_platform_db";
const DB_VERSION = 1;
const QUEUE_STORE = "offline_sync_queue";

function openDB() {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          db.createObjectStore(QUEUE_STORE, { keyPath: "id", autoIncrement: true });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export const StorageAdapter = {
  async getQueue() {
    const db = await openDB();
    if (!db) {
      // Fallback to localStorage
      try {
        const raw = localStorage.getItem("grammar_sync_queue");
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(QUEUE_STORE, "readonly");
        const store = tx.objectStore(QUEUE_STORE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  },

  async addToQueue(item) {
    const db = await openDB();
    if (!db) {
      try {
        const raw = localStorage.getItem("grammar_sync_queue");
        const list = raw ? JSON.parse(raw) : [];
        list.push({ ...item, id: Date.now() + Math.random() });
        localStorage.setItem("grammar_sync_queue", JSON.stringify(list));
        return true;
      } catch {
        return false;
      }
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(QUEUE_STORE, "readwrite");
        const store = tx.objectStore(QUEUE_STORE);
        const req = store.add(item);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  },

  async clearQueue() {
    const db = await openDB();
    if (!db) {
      try {
        localStorage.removeItem("grammar_sync_queue");
        return true;
      } catch {
        return false;
      }
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(QUEUE_STORE, "readwrite");
        const store = tx.objectStore(QUEUE_STORE);
        const req = store.clear();
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  },
};
