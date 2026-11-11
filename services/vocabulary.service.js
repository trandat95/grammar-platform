import { VocabularyRepository } from "../repositories/vocabulary.repository";

export const VocabularyService = {
  async getVocabulary(userId) {
    return await VocabularyRepository.getByUserId(userId);
  },

  async saveWord(userId, wordData) {
    return await VocabularyRepository.insertWord(userId, wordData);
  },

  async removeWord(userId, wordId) {
    return await VocabularyRepository.deleteWord(userId, wordId);
  },
};
