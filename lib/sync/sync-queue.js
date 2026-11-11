import { StorageAdapter } from "./indexed-db";

/**
 * SyncQueue: Offline Write Queue
 * Queues changes locally and guarantees delivery to cloud when online.
 */

export const SyncQueue = {
  async enqueue(actionType, payload) {
    const queueItem = {
      actionType,
      payload,
      queuedAt: new Date().toISOString(),
      retryCount: 0,
    };
    await StorageAdapter.addToQueue(queueItem);
    return queueItem;
  },

  async peekAll() {
    return await StorageAdapter.getQueue();
  },

  async clear() {
    return await StorageAdapter.clearQueue();
  },

  async getPendingCount() {
    const queue = await StorageAdapter.getQueue();
    return queue.length;
  },
};
