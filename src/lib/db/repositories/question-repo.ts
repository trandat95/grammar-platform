import { TOEICQuestion, GrammarTopic, ErrorPattern, MilestoneTemplate, Passage, DictationTrack } from '@/types/toeic';

// Bridge to ToeicRepository
const ToeicRepository = require('../../../lib/toeic/toeic-repository');

export const QuestionRepository = {
  getTaxonomy(): GrammarTopic[] {
    return ToeicRepository.getTaxonomy();
  },
  getTopicById(topicId: string): GrammarTopic | null {
    return ToeicRepository.getTopicById(topicId);
  },
  getErrorPatterns(): ErrorPattern[] {
    return ToeicRepository.getErrorPatterns();
  },
  getErrorPatternByCode(code: string): ErrorPattern | null {
    return ToeicRepository.getErrorPatternByCode(code);
  },
  getMilestoneTemplates(): MilestoneTemplate[] {
    return ToeicRepository.getMilestoneTemplates();
  },
  getQuestionById(questionId: string): TOEICQuestion | null {
    return ToeicRepository.getQuestionById(questionId);
  },
  getQuestionsByTopic(topicId: string, limit = 15, excludeIds: string[] = []): TOEICQuestion[] {
    return ToeicRepository.getQuestionsByTopic(topicId, limit, excludeIds);
  },
  getTwinQuestions(questionId: string, limit = 3): TOEICQuestion[] {
    return ToeicRepository.getTwinQuestions(questionId, limit);
  },
  getDiagnosticStage1Questions(): TOEICQuestion[] {
    return ToeicRepository.getDiagnosticStage1Questions();
  },
  getDiagnosticStage2Questions(stage1CorrectCount: number, excludeIds: string[] = []): TOEICQuestion[] {
    return ToeicRepository.getDiagnosticStage2Questions(stage1CorrectCount, excludeIds);
  },
  getDiagnosticStage3Questions(incorrectQuestionIds: string[] = [], excludeIds: string[] = []): { questions: TOEICQuestion[]; passage: Passage | null } {
    return ToeicRepository.getDiagnosticStage3Questions(incorrectQuestionIds, excludeIds);
  },
  getTestQuestionsAndPassages(series = 'ETS2024', testNum = 1, mode = 'full'): {
    series: string;
    testNumber: number;
    mode: string;
    passages: Passage[];
    passageGroups: Record<string, Passage[]>;
    questions: TOEICQuestion[];
  } {
    return ToeicRepository.getTestQuestionsAndPassages(series, testNum, mode);
  },
  getDictationTracks(series = 'ETS2026', testNum = 1): DictationTrack[] {
    return ToeicRepository.getDictationTracks(series, testNum);
  }
};

export default QuestionRepository;
