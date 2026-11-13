/**
 * 3-Stage Adaptive Diagnostic Selector (Milestone E2)
 * Matches specification in Section 3.2 verbatim.
 */

const ToeicRepository = require('../toeic/toeic-repository');

const DiagnosticSelector = {
  /**
   * Chặng 1: 10 câu baseline level 2 thuộc 10 chủ điểm cốt lõi
   */
  getStage1() {
    return ToeicRepository.getDiagnosticStage1Questions();
  },

  /**
   * Chặng 2: 10 câu phân nhánh thích ứng theo kết quả Chặng 1
   * @param {number} stage1CorrectCount Số câu đúng ở Chặng 1 (0..10)
   * @param {string[]} excludeIds Các câu đã làm ở Chặng 1
   */
  getStage2(stage1CorrectCount, excludeIds = []) {
    return ToeicRepository.getDiagnosticStage2Questions(stage1CorrectCount, excludeIds);
  },

  /**
   * Chặng 3: 10 câu (6 câu Twin Questions từ các câu làm sai ở Chặng 1 & 2 + 4 câu bài đọc Part 7)
   * @param {string[]} incorrectQuestionIds Danh sách các câu làm sai
   * @param {string[]} excludeIds Các câu đã làm ở Chặng 1 & 2
   */
  getStage3(incorrectQuestionIds = [], excludeIds = []) {
    return ToeicRepository.getDiagnosticStage3Questions(incorrectQuestionIds, excludeIds);
  }
};

module.exports = DiagnosticSelector;
