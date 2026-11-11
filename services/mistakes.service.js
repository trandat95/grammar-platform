import { MistakesRepository } from "../repositories/mistakes.repository";

export const MistakesService = {
  async getMistakes(userId) {
    return await MistakesRepository.getByUserId(userId);
  },

  async recordMistake(userId, mistakeItem) {
    return await MistakesRepository.upsertMistake(userId, mistakeItem);
  },

  async deleteMistake(userId, mistakeId) {
    return await MistakesRepository.deleteById(userId, mistakeId);
  },

  async clearAllMistakes(userId) {
    return await MistakesRepository.clearAll(userId);
  },
};
