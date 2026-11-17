export { default as QuestionRenderer } from "./QuestionRenderer";
export { default } from "./QuestionRenderer";

export {
  QUESTION_MODES,
  resolveQuestionPresentation,
} from "./resolver/QuestionTypeResolver";
export {
  AUDITED_MC_IDS,
  AUDITED_MC_ID_SET,
  isAuditedMcId,
} from "./resolver/auditedMcIds";
export {
  parseStructuredChoices,
  parseInlineParentheticalChoices,
  hasMultiBlankPattern,
} from "./resolver/ChoiceParser";
export {
  normalizeAnswer,
  getOptionValue,
  extractAnswerStrings,
  isAnswerCompatibleWithOptions,
  findMatchingOption,
} from "./resolver/AnswerCompatibility";

export {
  useQuestionState,
  buildQuestionStateKey,
  readPersistedQuestionState,
  writePersistedQuestionState,
  clearPersistedQuestionState,
} from "./hooks/useQuestionState";

export { default as QuestionStem, formatQuestionStem } from "./components/QuestionStem";
export { default as RadioChoiceCard } from "./components/RadioChoiceCard";
export { default as QuestionAudio, sanitizeStemForAudio } from "./components/QuestionAudio";
export {
  default as QuestionFeedback,
  extractFactualFallbackMeta,
} from "./components/QuestionFeedback";

export { default as BeforeAnswer } from "./states/BeforeAnswer";
export { default as AfterCorrect } from "./states/AfterCorrect";
export { default as AfterWrong } from "./states/AfterWrong";

export { default as MultipleChoiceRenderer } from "./renderers/MultipleChoiceRenderer";
export { default as TextInputRenderer } from "./renderers/TextInputRenderer";
export { default as MultiBlankRenderer } from "./renderers/MultiBlankRenderer";
