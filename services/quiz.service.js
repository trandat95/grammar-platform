import { QuizRepository } from "../repositories/quiz.repository";

export const QuizService = {
  async recordAttempt(userId, payload) {
    return await QuizRepository.insertAttempt(userId, payload);
  },

  async getHistory(userId, limit = 20) {
    return await QuizRepository.getUserHistory(userId, limit);
  },
};
