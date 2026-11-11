/**
 * Milestone 2.3.7: Multi-Tab Coordination via Web Locks & BroadcastChannel
 * Ensures concurrent mutations across multiple open tabs trigger at most ONE
 * HTTP sync batch at a time and broadcast state convergence within milliseconds.
 */

const CHANNEL_NAME = "grammar_sync_channel";
const STORAGE_BROADCAST_KEY = "grammar_sync_broadcast_fallback";
const LOCK_NAME = "grammar_platform_sync_mutex";

class SyncCoordinatorClass {
  constructor() {
    this.tabId = `tab_${Math.random().toString(36).slice(2, 10)}`;
    this.isLeader = false;
    this.channel = null;
    this.listeners = new Set();
    this.initialized = false;
  }

  init(onRemoteMessage) {
    if (onRemoteMessage) this.listeners.add(onRemoteMessage);
    if (typeof window === "undefined" || this.initialized) return;
    this.initialized = true;

    if (typeof window.BroadcastChannel === "function") {
      try {
        this.channel = new window.BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event?.data && event.data.senderTabId !== this.tabId) {
            this.notifyListeners(event.data);
          }
        };
      } catch {
        this.channel = null;
      }
    }

    // Universal fallback for browsers without BroadcastChannel
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_BROADCAST_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed.senderTabId !== this.tabId) {
            this.notifyListeners(parsed);
          }
        } catch {}
      }
    });
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notifyListeners(msg) {
    this.listeners.forEach((fn) => {
      try {
        fn(msg);
      } catch {}
    });
  }

  broadcast(type, payload = {}) {
    if (typeof window === "undefined") return;
    const message = {
      type,
      senderTabId: this.tabId,
      timestamp: Date.now(),
      ...payload,
    };

    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch {}
    }

    try {
      localStorage.setItem(STORAGE_BROADCAST_KEY, JSON.stringify(message));
    } catch {}
  }

  /**
   * Executes a sync callback exclusively across all open browser tabs.
   * Uses navigator.locks if available so 5 tabs completing exercises at once
   * do not fire redundant concurrent HTTP sync calls.
   */
  async runExclusiveSync(taskFn) {
    if (typeof navigator !== "undefined" && navigator.locks?.request) {
      return navigator.locks.request(LOCK_NAME, { mode: "exclusive", ifAvailable: true }, async (lock) => {
        if (!lock) {
          this.isLeader = false;
          return { skippedBecauseFollower: true };
        }
        this.isLeader = true;
        try {
          return await taskFn();
        } finally {
          this.isLeader = false;
        }
      });
    }

    // Fallback mutex using timestamp lease in localStorage
    const leaseKey = "grammar_sync_lock_lease";
    const now = Date.now();
    try {
      const existingRaw = localStorage.getItem(leaseKey);
      if (existingRaw) {
        const existing = JSON.parse(existingRaw);
        if (existing && existing.owner !== this.tabId && now - existing.acquiredAt < 8000) {
          this.isLeader = false;
          return { skippedBecauseFollower: true };
        }
      }
      localStorage.setItem(leaseKey, JSON.stringify({ owner: this.tabId, acquiredAt: now }));
      this.isLeader = true;
      return await taskFn();
    } catch {
      return await taskFn();
    } finally {
      this.isLeader = false;
      try {
        localStorage.removeItem(leaseKey);
      } catch {}
    }
  }
}

export const SyncCoordinator = new SyncCoordinatorClass();
