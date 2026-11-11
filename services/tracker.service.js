import { UserRepository } from "../repositories/user.repository";

export const TrackerService = {
  async getTracker(userId) {
    return await UserRepository.getTracker(userId);
  },

  async syncTracker(userId, trackerData) {
    return await UserRepository.upsertTracker(userId, trackerData);
  },

  async calculateStreak(lastActiveDate, currentStreak = 1) {
    const today = new Date().toISOString().split("T")[0];
    if (!lastActiveDate) return 1;

    const last = new Date(lastActiveDate);
    const curr = new Date(today);
    const diffDays = Math.floor((curr - last) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return currentStreak; // Already logged today
    } else if (diffDays === 1) {
      return currentStreak + 1; // Consecutive day
    } else {
      return 1; // Streak broken
    }
  },
};
