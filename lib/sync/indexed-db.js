/**
 * Milestone 2.3.5: Multi-Store Transactional IndexedDB Store & Fallback Adapter
 * Upgrades single queue storage into a resilient local-first store supporting
 * offline pending events, lesson cache, quiz cache, device metadata & telemetry.
 */

const DB_NAME = "grammar_platform_db";
const DB_VERSION = 2;

export const STORES = {
  SYNC_QUEUE: "pending_sync_queue",
  LEGACY_QUEUE: "offline_sync_queue",
  LESSON_CACHE: "lesson_cache",
  QUIZ_CACHE: "quiz_cache",
  META: "sync_meta",
};

const LS_KEYS = {
  QUEUE: "grammar_sync_queue_v2",
  DEVICE_ID: "grammar_device_id",
  LAST_CURSOR: "grammar_sync_cursor",
  LESSON_CACHE: "grammar_lesson_cache",
};

function generateUUIDv4() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let dbPromise = null;

function openDB() {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.resolve(null);
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        const tx = e.target.transaction;

        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const queueStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: "idempotency_key" });
          queueStore.createIndex("by_status", "status", { unique: false });
          queueStore.createIndex("by_timestamp", "client_timestamp", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.LESSON_CACHE)) {
          db.createObjectStore(STORES.LESSON_CACHE, { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains(STORES.QUIZ_CACHE)) {
          db.createObjectStore(STORES.QUIZ_CACHE, { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains(STORES.META)) {
          db.createObjectStore(STORES.META, { keyPath: "key" });
        }

        if (db.objectStoreNames.contains(STORES.LEGACY_QUEUE) && tx) {
          try {
            const legacyStore = tx.objectStore(STORES.LEGACY_QUEUE);
            const targetStore = tx.objectStore(STORES.SYNC_QUEUE);
            const getAllReq = legacyStore.getAll();
            getAllReq.onsuccess = () => {
              const oldItems = getAllReq.result || [];
              for (const item of oldItems) {
                targetStore.put({
                  ...item,
                  idempotency_key: item.idempotency_key || generateUUIDv4(),
                  client_timestamp: item.client_timestamp || Date.now(),
                  status: item.status || "PENDING",
                  retry_count: item.retry_count || 0,
                });
              }
            };
          } catch {}
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        resolve(null);
      };
    } catch {
      dbPromise = null;
      resolve(null);
    }
  });

  return dbPromise;
}

async function runTx(storeName, mode, operation, fallbackFn) {
  const db = await openDB();
  if (!db) {
    return fallbackFn();
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      let result;
      tx.oncomplete = () => resolve(result);
      tx.onabort = () => resolve(fallbackFn());
      tx.onerror = () => resolve(fallbackFn());
      operation(store, (val) => {
        result = val;
      });
    } catch {
      resolve(fallbackFn());
    }
  });
}

function getLocalList(key, defaultVal = []) {
  if (typeof localStorage === "undefined") return defaultVal;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocalValue(key, val) {
  if (typeof localStorage === "undefined") return false;
  try {
    localStorage.setItem(key, JSON.stringify(val));
    return true;
  } catch {
    return false;
  }
}

export const StorageAdapter = {
  generateUUIDv4,

  async getOrCreateDeviceId() {
    if (typeof window === "undefined") return "server-ssr";
    const metaVal = await this.getMeta("device_id");
    if (metaVal) return metaVal;

    let cached = null;
    try {
      cached = localStorage.getItem(LS_KEYS.DEVICE_ID);
    } catch {}
    const deviceId = cached || `dev_${generateUUIDv4()}`;
    try {
      localStorage.setItem(LS_KEYS.DEVICE_ID, deviceId);
    } catch {}
    await this.setMeta("device_id", deviceId);
    return deviceId;
  },

  async getMeta(key) {
    return runTx(
      STORES.META,
      "readonly",
      (store, setResult) => {
        const req = store.get(key);
        req.onsuccess = () => setResult(req.result?.value ?? null);
      },
      () => getLocalList(`${LS_KEYS.LAST_CURSOR}_${key}`, null)
    );
  },

  async setMeta(key, value) {
    return runTx(
      STORES.META,
      "readwrite",
      (store, setResult) => {
        store.put({ key, value, updatedAt: Date.now() });
        setResult(true);
      },
      () => setLocalValue(`${LS_KEYS.LAST_CURSOR}_${key}`, value)
    );
  },

  async getQueue() {
    const list = await runTx(
      STORES.SYNC_QUEUE,
      "readonly",
      (store, setResult) => {
        const req = store.getAll();
        req.onsuccess = () => setResult(req.result || []);
      },
      () => getLocalList(LS_KEYS.QUEUE, [])
    );
    return (list || []).sort((a, b) => (a.client_timestamp || 0) - (b.client_timestamp || 0));
  },

  async getPendingQueue() {
    const all = await this.getQueue();
    return all.filter((item) => item.status === "PENDING" || item.status === "FAILED");
  },

  async addToQueue(event) {
    const normalized = {
      ...event,
      idempotency_key: event.idempotency_key || generateUUIDv4(),
      client_timestamp: event.client_timestamp || Date.now(),
      status: event.status || "PENDING",
      retry_count: Number(event.retry_count || 0),
    };

    return runTx(
      STORES.SYNC_QUEUE,
      "readwrite",
      (store, setResult) => {
        store.put(normalized);
        setResult(true);
      },
      () => {
        const list = getLocalList(LS_KEYS.QUEUE, []);
        const idx = list.findIndex((x) => x.idempotency_key === normalized.idempotency_key);
        if (idx >= 0) list[idx] = normalized;
        else list.push(normalized);
        return setLocalValue(LS_KEYS.QUEUE, list);
      }
    );
  },

  async updateQueueItems(updates = []) {
    if (!updates.length) return true;
    return runTx(
      STORES.SYNC_QUEUE,
      "readwrite",
      (store, setResult) => {
        for (const item of updates) {
          if (item.idempotency_key) {
            store.put(item);
          }
        }
        setResult(true);
      },
      () => {
        const list = getLocalList(LS_KEYS.QUEUE, []);
        const map = new Map(list.map((i) => [i.idempotency_key, i]));
        for (const u of updates) map.set(u.idempotency_key, u);
        return setLocalValue(LS_KEYS.QUEUE, Array.from(map.values()));
      }
    );
  },

  async removeQueueItems(idempotencyKeys = []) {
    if (!idempotencyKeys.length) return true;
    const keySet = new Set(idempotencyKeys);
    return runTx(
      STORES.SYNC_QUEUE,
      "readwrite",
      (store, setResult) => {
        for (const key of keySet) {
          store.delete(key);
        }
        setResult(true);
      },
      () => {
        const list = getLocalList(LS_KEYS.QUEUE, []);
        return setLocalValue(
          LS_KEYS.QUEUE,
          list.filter((i) => !keySet.has(i.idempotency_key))
        );
      }
    );
  },

  async clearQueue() {
    return runTx(
      STORES.SYNC_QUEUE,
      "readwrite",
      (store, setResult) => {
        store.clear();
        setResult(true);
      },
      () => {
        try {
          localStorage.removeItem(LS_KEYS.QUEUE);
          return true;
        } catch {
          return false;
        }
      }
    );
  },

  async cacheLessonData(id, payload) {
    return runTx(
      STORES.LESSON_CACHE,
      "readwrite",
      (store, setResult) => {
        store.put({ id: String(id), payload, cachedAt: Date.now() });
        setResult(true);
      },
      () => setLocalValue(`${LS_KEYS.LESSON_CACHE}_${id}`, payload)
    );
  },

  async getCachedLessonData(id) {
    return runTx(
      STORES.LESSON_CACHE,
      "readonly",
      (store, setResult) => {
        const req = store.get(String(id));
        req.onsuccess = () => setResult(req.result?.payload ?? null);
      },
      () => getLocalList(`${LS_KEYS.LESSON_CACHE}_${id}`, null)
    );
  },

  async cacheQuizData(id, payload) {
    return runTx(
      STORES.QUIZ_CACHE,
      "readwrite",
      (store, setResult) => {
        store.put({ id: String(id), payload, cachedAt: Date.now() });
        setResult(true);
      },
      () => setLocalValue(`grammar_quiz_cache_${id}`, payload)
    );
  },

  async getCachedQuizData(id) {
    return runTx(
      STORES.QUIZ_CACHE,
      "readonly",
      (store, setResult) => {
        const req = store.get(String(id));
        req.onsuccess = () => setResult(req.result?.payload ?? null);
      },
      () => getLocalList(`grammar_quiz_cache_${id}`, null)
    );
  },

  async recordTelemetry({ success, dedupedCount = 0, processedCount = 0, latencyMs = 0 }) {
    const current = (await this.getMeta("telemetry")) || {
      totalBatches: 0,
      successfulBatches: 0,
      failedBatches: 0,
      totalEventsSynced: 0,
      totalDeduped: 0,
      latencies: [],
      lastSyncTimestamp: null,
    };

    current.totalBatches += 1;
    if (success) {
      current.successfulBatches += 1;
      current.totalEventsSynced += processedCount;
      current.totalDeduped += dedupedCount;
      current.lastSyncTimestamp = Date.now();
    } else {
      current.failedBatches += 1;
    }

    if (latencyMs > 0) {
      current.latencies = [...(current.latencies || []), Math.round(latencyMs)].slice(-40);
    }

    await this.setMeta("telemetry", current);
    return current;
  },

  async getTelemetrySummary() {
    const raw = (await this.getMeta("telemetry")) || {
      totalBatches: 0,
      successfulBatches: 0,
      failedBatches: 0,
      totalEventsSynced: 0,
      totalDeduped: 0,
      latencies: [],
      lastSyncTimestamp: null,
    };
    const sorted = [...(raw.latencies || [])].sort((a, b) => a - b);
    const p95Idx = sorted.length > 0 ? Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95)) : 0;
    const p95LatencyMs = sorted.length > 0 ? sorted[p95Idx] : 0;
    const successRatePercent =
      raw.totalBatches > 0 ? Math.round((raw.successfulBatches / raw.totalBatches) * 1000) / 10 : 100;

    return {
      ...raw,
      p95LatencyMs,
      successRatePercent,
    };
  },
};
