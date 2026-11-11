import { StorageAdapter } from "./indexed-db";

/**
 * Milestone 2.3.6: Immutable Sync Event Schema v1.0 & Offline Write Queue
 * Supports all 8 canonical SyncEvent types with immutable UUIDv4 idempotency_key
 * plus backwards compatibility with legacy actionType values.
 */

export const SYNC_EVENT_TYPES = {
  XP_EARNED: "XP_EARNED",
  LESSON_COMPLETED: "LESSON_COMPLETED",
  MISTAKE_RECORDED: "MISTAKE_RECORDED",
  MISTAKE_RESOLVED: "MISTAKE_RESOLVED",
  QUIZ_SUBMITTED: "QUIZ_SUBMITTED",
  VOCABULARY_SAVED: "VOCABULARY_SAVED",
  VOCABULARY_DELETED: "VOCABULARY_DELETED",
  DIAGNOSTIC_COMPLETED: "DIAGNOSTIC_COMPLETED",
  SYNC_TRACKER: "SYNC_TRACKER",
};

const LEGACY_ACTION_MAP = {
  INCREMENT_XP: SYNC_EVENT_TYPES.XP_EARNED,
  COMPLETE_LESSON: SYNC_EVENT_TYPES.LESSON_COMPLETED,
  RECORD_MISTAKE: SYNC_EVENT_TYPES.MISTAKE_RECORDED,
  RECORD_QUIZ: SYNC_EVENT_TYPES.QUIZ_SUBMITTED,
  SAVE_VOCAB: SYNC_EVENT_TYPES.VOCABULARY_SAVED,
};

export function normalizeEventType(actionType) {
  return LEGACY_ACTION_MAP[actionType] || actionType || SYNC_EVENT_TYPES.SYNC_TRACKER;
}

export const SyncQueue = {
  async enqueue(actionType, payload, userId = "guest_session") {
    const deviceId = await StorageAdapter.getOrCreateDeviceId();
    const canonicalType = normalizeEventType(actionType);
    const idempotencyKey = StorageAdapter.generateUUIDv4();
    const nowMs = Date.now();

    const syncEvent = {
      idempotency_key: idempotencyKey,
      user_id: userId,
      device_id: deviceId,
      event_type: canonicalType,
      actionType: canonicalType,
      payload: payload || {},
      client_timestamp: nowMs,
      queuedAt: new Date(nowMs).toISOString(),
      retry_count: 0,
      last_error: null,
      status: "PENDING",
    };

    await StorageAdapter.addToQueue(syncEvent);
    return syncEvent;
  },

  async peekAll() {
    return await StorageAdapter.getQueue();
  },

  async peekPending(maxBatch = 50) {
    const pending = await StorageAdapter.getPendingQueue();
    return pending.slice(0, maxBatch);
  },

  async markResolved(idempotencyKeys = []) {
    return await StorageAdapter.removeQueueItems(idempotencyKeys);
  },

  async markBatchStatus(items = [], status = "PENDING", errorMessage = null) {
    const updates = items.map((item) => ({
      ...item,
      status,
      retry_count: status === "FAILED" || errorMessage ? (item.retry_count || 0) + 1 : item.retry_count || 0,
      last_error: errorMessage || item.last_error || null,
    }));
    return await StorageAdapter.updateQueueItems(updates);
  },

  async clear() {
    return await StorageAdapter.clearQueue();
  },

  async getPendingCount() {
    const pending = await StorageAdapter.getPendingQueue();
    return pending.length;
  },
};
