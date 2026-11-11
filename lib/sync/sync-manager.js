import { SyncQueue } from "./sync-queue";

/**
 * SyncManager: Coordinates Offline Queue Draining & Conflict-Free Cloud Sync
 */

class SyncManagerClass {
  constructor() {
    this.userId = null;
    this.status = "SYNCED"; // SYNCED | SYNCING | PENDING | ERROR | OFFLINE
    this.lastSyncTime = null;
    this.listeners = new Set();
    this.isSyncing = false;
  }

  init(userId, onStateChange) {
    this.userId = userId;
    if (onStateChange) this.subscribe(onStateChange);

    if (typeof window !== "undefined") {
      this.status = navigator.onLine ? "SYNCED" : "OFFLINE";

      window.addEventListener("online", () => {
        this.notifyStatus("PENDING");
        this.triggerSync();
      });

      window.addEventListener("offline", () => {
        this.notifyStatus("OFFLINE");
      });

      // Check if there are existing pending items
      this.checkPendingQueue();
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    // Emit immediate current state
    listener({ status: this.status, lastSyncTime: this.lastSyncTime });
    return () => this.listeners.delete(listener);
  }

  notifyStatus(status) {
    this.status = status;
    this.listeners.forEach((fn) => {
      try {
        fn({ status: this.status, lastSyncTime: this.lastSyncTime });
      } catch (err) {
        console.warn("Sync listener notification error:", err);
      }
    });
  }

  async checkPendingQueue() {
    const pendingCount = await SyncQueue.getPendingCount();
    if (pendingCount > 0) {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        this.triggerSync();
      } else {
        this.notifyStatus("PENDING");
      }
    }
  }

  async recordAction(actionType, payload) {
    await SyncQueue.enqueue(actionType, payload);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      this.notifyStatus("OFFLINE");
      return;
    }

    this.notifyStatus("PENDING");
    await this.triggerSync();
  }

  async triggerSync() {
    if (this.isSyncing || !this.userId) return;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      this.notifyStatus("OFFLINE");
      return;
    }

    const items = await SyncQueue.peekAll();
    if (!items || items.length === 0) {
      this.notifyStatus("SYNCED");
      return;
    }

    this.isSyncing = true;
    this.notifyStatus("SYNCING");

    try {
      const response = await fetch("/api/sync/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: this.userId, items }),
      });

      if (!response.ok) {
        throw new Error(`Sync server responded with ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        await SyncQueue.clear();
        this.lastSyncTime = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
        this.notifyStatus("SYNCED");
        return result.tracker;
      } else {
        throw new Error(result.error || "Sync failed");
      }
    } catch (err) {
      console.warn("Background sync failed, will retry later:", err.message);
      this.notifyStatus("ERROR");
    } finally {
      this.isSyncing = false;
    }
  }

  getStatus() {
    return {
      status: this.status,
      lastSyncTime: this.lastSyncTime,
    };
  }
}

export const SyncManager = new SyncManagerClass();
