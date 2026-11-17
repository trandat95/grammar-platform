import { isAuditedMcId } from "./auditedMcIds.js";
import { isAnswerCompatibleWithOptions } from "./AnswerCompatibility.js";
import {
  hasMultiBlankPattern,
  parseInlineParentheticalChoices,
  parseStructuredChoices,
} from "./ChoiceParser.js";

export const QUESTION_MODES = Object.freeze({
  MULTIPLE_CHOICE: "multiple_choice",
  MULTI_BLANK: "multi_blank",
  TEXT_INPUT: "text_input",
});

/**
 * Resolves the safe UI presentation mode for any Study or Quiz question
 * without mutating `question` or its canonical `answers[]`.
 *
 * Priority:
 *  (a) Structured `question.choices` (>= 2 options) -> "multiple_choice"
 *  (b) Audited MC ID registry (or strict 5-condition runtime check + compatibility) -> "multiple_choice"
 *  (c) Multi-blank `(a/b)1 ... (c/d)2` or multi-slash group -> "multi_blank" (renders safe text input)
 *  (d) Fallback -> "text_input"
 *
 * @param {object} question
 * @param {string} [fallbackType]
 * @returns {{ mode: 'multiple_choice' | 'text_input' | 'multi_blank', options: Array, reason: string }}
 */
export function resolveQuestionPresentation(question, fallbackType = "") {
  if (!question || typeof question !== "object") {
    return {
      mode: QUESTION_MODES.TEXT_INPUT,
      options: [],
      reason: "invalid_question_object",
    };
  }

  // (a) Structured choices array always takes highest priority
  const structured = parseStructuredChoices(question);
  if (structured.valid) {
    return {
      mode: QUESTION_MODES.MULTIPLE_CHOICE,
      options: structured.options,
      reason: "structured_choices",
    };
  }

  const effectiveType = String(question.type || fallbackType || "").toUpperCase();
  const hasStarterPrompt = Boolean(question.starter_prompt && String(question.starter_prompt).trim());
  const stem = String(question.stem ?? "");

  // Non-MC question types stay in text_input (preserving starter_prompt, rewrite, error correction, etc.)
  if (effectiveType !== "MULTIPLE_CHOICE") {
    return {
      mode: QUESTION_MODES.TEXT_INPUT,
      options: [],
      reason: effectiveType ? `type_${effectiveType.toLowerCase()}` : "default_text_input",
    };
  }

  // Questions with starter_prompt must remain text_input
  if (hasStarterPrompt) {
    return {
      mode: QUESTION_MODES.TEXT_INPUT,
      options: [],
      reason: "has_starter_prompt",
    };
  }

  // (c) Multi-blank inline slash questions safely resolve to multi_blank (text input)
  if (hasMultiBlankPattern(stem)) {
    return {
      mode: QUESTION_MODES.MULTI_BLANK,
      options: [],
      reason: "multi_blank_excluded",
    };
  }

  // (b) Audited MC ID registry + strict runtime parser & answer compatibility guard
  const parsed = parseInlineParentheticalChoices(stem);
  if (!parsed.valid) {
    return {
      mode: QUESTION_MODES.TEXT_INPUT,
      options: [],
      reason: parsed.reason,
    };
  }

  const isCompatible = isAnswerCompatibleWithOptions(parsed.options, question.answers);
  if (!isCompatible) {
    return {
      mode: QUESTION_MODES.TEXT_INPUT,
      options: [],
      reason: "answer_mismatch",
    };
  }

  const inAuditedRegistry = isAuditedMcId(question.id);
  return {
    mode: QUESTION_MODES.MULTIPLE_CHOICE,
    options: parsed.options,
    reason: inAuditedRegistry ? "audited_mc_registry" : "runtime_verified_inline_mc",
  };
}
