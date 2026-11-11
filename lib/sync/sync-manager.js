import { SyncQueue } from "./sync-queue";
import { StorageAdapter } from "./indexed-db";
import { SyncCoordinator } from "./sync-coordinator";
import { supabase } from "../supabase/client";

/**
 * Milestone 2.3.8 & 2.3.11: Resilient Sync Manager
 * Coordinates micro-batch draining (max 50), Exponential Backoff with Full Jitter,
 * Multi-Tab Leader Lock coordination, Heartbeat Liveness (/api/health),
 * Multi-Device delta Pull (/api/sync/pull), and Sync Telemetry metrics.
 */

const MAX_BATCH_SIZE = 50;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;
const MAX_RETRIES = 6;
const HEARTBEAT_INTERVAL_MS = 60000;

export function calculateBackoffWithJitter(retryCount = 0) {
  const exp = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * Math.pow(2, Math.max(0, retryCount)));
  const jitter = 0.5 + Math.random(); // [0.5, 1.5] Full Jitter
  return Math.round(exp * jitter);
}

class SyncManagerClass {
  constructor() {
    this.userId = null;
    this.status = "SYNCED"; // SYNCED | SYNCING | PENDING | ERROR | OFFLINE
    this.lastSyncTime = null;
    this.pendingCount = 0;
    this.deviceId = null;
    this.telemetry = null;
    this.clockSkewMs = 0;
    this.listeners = new Set();
    this.isSyncing = false;
    this.retryTimer = null;
    this.heartbeatTimer = null;
    this.consecutiveFailures = 0;
    this.initialized = false;
    this.pullListeners = new Set();
  }

  async init(userId, onStateChange, onRemotePull) {
    this.userId = userId;
    if (onStateChange) this.subscribe(onStateChange);
    if (onRemotePull) this.pullListeners.add(onRemotePull);

    if (typeof window === "undefined") return;

    this.deviceId = await StorageAdapter.getOrCreateDeviceId();
    this.telemetry = await StorageAdapter.getTelemetrySummary();
    this.pendingCount = await SyncQueue.getPendingCount();

    SyncCoordinator.init((msg) => {
      if (msg.type === "SYNC_STATE_UPDATE") {
        this.status = msg.status || this.status;
        this.pendingCount = typeof msg.pendingCount === "number" ? msg.pendingCount : this.pendingCount;
        this.lastSyncTime = msg.lastSyncTime || this.lastSyncTime;
        this.telemetry = msg.telemetry || this.telemetry;
        this.emitState();
      } else if (msg.type === "DATA_PULLED" && msg.data) {
        this.emitPullData(msg.data);
      }
    });

    if (!this.initialized) {
      this.initialized = true;
      this.status = navigator.onLine ? (this.pendingCount > 0 ? "PENDING" : "SYNCED") : "OFFLINE";

      window.addEventListener("online", () => {
        this.consecutiveFailures = 0;
        this.clearRetryTimer();
        this.notifyStatus("PENDING");
        this.triggerSync();
      });

      window.addEventListener("offline", () => {
        this.clearRetryTimer();
        this.notifyStatus("OFFLINE");
      });

      this.heartbeatTimer = setInterval(() => {
        if (typeof document !== "undefined" && document.visibilityState === "visible") {
          this.checkLivenessAndSync();
        }
      }, HEARTBEAT_INTERVAL_MS);
    }

    this.emitState();
    await this.checkPendingQueue();
  }

  clearRetryTimer() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  emitState() {
    const snapshot = this.getStatus();
    this.listeners.forEach((fn) => {
      try {
        fn(snapshot);
      } catch (err) {
        console.warn("Sync listener error:", err);
      }
    });
  }

  emitPullData(data) {
    this.pullListeners.forEach((fn) => {
      try {
        fn(data);
      } catch (err) {
        console.warn("Pull listener error:", err);
      }
    });
  }

  async notifyStatus(status) {
    this.status = status;
    this.pendingCount = await SyncQueue.getPendingCount();
    this.telemetry = await StorageAdapter.getTelemetrySummary();
    this.emitState();
    SyncCoordinator.broadcast("SYNC_STATE_UPDATE", {
      status: this.status,
      pendingCount: this.pendingCount,
      lastSyncTime: this.lastSyncTime,
      telemetry: this.telemetry,
    });
  }

  async checkPendingQueue() {
    this.pendingCount = await SyncQueue.getPendingCount();
    if (this.pendingCount > 0) {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        await this.triggerSync();
      } else {
        await this.notifyStatus("OFFLINE");
      }
    } else {
      await this.notifyStatus(typeof navigator !== "undefined" && !navigator.onLine ? "OFFLINE" : "SYNCED");
    }
  }

  async checkLivenessAndSync() {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      if (this.status !== "OFFLINE") await this.notifyStatus("OFFLINE");
      return false;
    }
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 4000);
      const res = await fetch("/api/health", { method: "GET", signal: controller.signal });
      clearTimeout(t);
      if (res.ok) {
        const json = await res.json();
        if (json.serverTime) {
          this.clockSkewMs = new Date(json.serverTime).getTime() - Date.now();
        }
        const pending = await SyncQueue.getPendingCount();
        if (pending > 0 && !this.isSyncing) {
          await this.triggerSync();
        }
        return true;
      }
    } catch {}
    return false;
  }

  async getAuthHeaders() {
    const headers = { "Content-Type": "application/json" };
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        headers["Authorization"] = `Bearer ${data.session.access_token}`;
      }
    } catch {}
    return headers;
  }

  async recordAction(actionType, payload) {
    const uid = this.userId || "guest_session";
    await SyncQueue.enqueue(actionType, payload, uid);
    this.pendingCount = await SyncQueue.getPendingCount();

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await this.notifyStatus("OFFLINE");
      return;
    }

    await this.notifyStatus("PENDING");
    await this.triggerSync();
  }

  async triggerSync() {
    if (this.isSyncing || !this.userId) return;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await this.notifyStatus("OFFLINE");
      return;
    }

    const batchItems = await SyncQueue.peekPending(MAX_BATCH_SIZE);
    if (!batchItems || batchItems.length === 0) {
      await this.notifyStatus("SYNCED");
      return;
    }

    return SyncCoordinator.runExclusiveSync(async () => {
      if (this.isSyncing) return;
      this.isSyncing = true;
      await this.notifyStatus("SYNCING");
      const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();

      try {
        const headers = await this.getAuthHeaders();
        await SyncQueue.markBatchStatus(batchItems, "SYNCING");

        const response = await fetch("/api/sync/batch", {
          method: "POST",
          headers,
          body: JSON.stringify({
            userId: this.userId,
            deviceId: this.deviceId,
            items: batchItems,
          }),
        });

        if (!response.ok) {
          throw new Error(`Sync HTTP ${response.status}`);
        }

        const result = await response.json();
        const elapsed = (typeof performance !== "undefined" ? performance.now() : Date.now()) - startedAt;

        if (result.success) {
          const syncedKeys = batchItems.map((i) => i.idempotency_key);
          await SyncQueue.markResolved(syncedKeys);
          await StorageAdapter.setMeta("last_sync_server_time", result.serverTime || new Date().toISOString());
          this.telemetry = await StorageAdapter.recordTelemetry({
            success: true,
            processedCount: result.processedCount || batchItems.length,
            dedupedCount: result.dedupedCount || 0,
            latencyMs: elapsed,
          });
          this.consecutiveFailures = 0;
          this.clearRetryTimer();
          this.lastSyncTime = new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          });

          const remaining = await SyncQueue.getPendingCount();
          await this.notifyStatus(remaining > 0 ? "PENDING" : "SYNCED");
          if (remaining > 0) {
            setTimeout(() => this.triggerSync(), 120);
          }
          return result.tracker;
        }
        throw new Error(result.error || "Sync batch rejected");
      } catch (err) {
        const elapsed = (typeof performance !== "undefined" ? performance.now() : Date.now()) - startedAt;
        await SyncQueue.markBatchStatus(batchItems, "FAILED", err.message);
        this.telemetry = await StorageAdapter.recordTelemetry({
          success: false,
          latencyMs: elapsed,
        });
        this.consecutiveFailures += 1;
        await this.notifyStatus("ERROR");

        if (this.consecutiveFailures <= MAX_RETRIES) {
          const delayMs = calculateBackoffWithJitter(this.consecutiveFailures - 1);
          this.clearRetryTimer();
          this.retryTimer = setTimeout(() => {
            this.triggerSync();
          }, delayMs);
        }
      } finally {
        this.isSyncing = false;
      }
    });
  }

  async pullRemoteChanges(sinceIso = null) {
    if (!this.userId || (typeof navigator !== "undefined" && !navigator.onLine)) return null;
    try {
      const storedSince = sinceIso || (await StorageAdapter.getMeta("last_sync_server_time")) || "";
      const headers = await this.getAuthHeaders();
      const qs = new URLSearchParams({ userId: this.userId });
      if (storedSince) qs.set("since", storedSince);

      const res = await fetch(`/api/sync/pull?${qs.toString()}`, { method: "GET", headers });
      if (!res.ok) return null;
      const json = await res.json();
      if (json.success) {
        if (json.serverTime) {
          await StorageAdapter.setMeta("last_sync_server_time", json.serverTime);
        }
        this.emitPullData(json);
        SyncCoordinator.broadcast("DATA_PULLED", { data: json });
      }
      return json;
    } catch (err) {
      console.warn("Multi-device pull warning:", err.message);
      return null;
    }
  }

  getStatus() {
    return {
      status: this.status,
      lastSyncTime: this.lastSyncTime,
      pendingCount: this.pendingCount,
      deviceId: this.deviceId,
      isLeader: SyncCoordinator.isLeader,
      clockSkewMs: this.clockSkewMs,
      telemetry: this.telemetry,
    };
  }
}

export const SyncManager = new SyncManagerClass();
