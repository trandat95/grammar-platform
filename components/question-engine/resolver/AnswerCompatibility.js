/**
 * Answer normalization and compatibility verification helpers.
 * Ensures radio choice options strictly match at least one canonical answer
 * before promoting an inline question to MultipleChoiceRenderer.
 */

/**
 * Normalizes an answer or option string for safe comparison without mutating originals.
 * @param {unknown} s
 * @returns {string}
 */
export function normalizeAnswer(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\s+/g, " ");
}

/**
 * Extracts a comparable string value from either a string option or a choice object.
 * @param {string | { value?: string, label?: string, text?: string, key?: string }} option
 * @returns {string}
 */
export function getOptionValue(option) {
  if (typeof option === "string") return option;
  if (option && typeof option === "object") {
    if (option.value !== undefined && option.value !== null) return String(option.value);
    if (option.label !== undefined && option.label !== null) return String(option.label);
    if (option.text !== undefined && option.text !== null) return String(option.text);
  }
  return "";
}

/**
 * Extracts flat string answer candidates from either string[] (`quiz_bank.json`)
 * or `{ correct, alternatives }[]` (`preview_data.json`).
 * Never mutates the original `answers` array.
 * @param {Array<string | { correct?: string, alternatives?: string[], text?: string, value?: string }>} answers
 * @returns {string[]}
 */
export function extractAnswerStrings(answers) {
  if (!Array.isArray(answers)) return [];
  const out = [];
  for (const item of answers) {
    if (typeof item === "string") {
      if (item.trim()) out.push(item);
    } else if (item && typeof item === "object") {
      if (typeof item.correct === "string" && item.correct.trim()) {
        out.push(item.correct);
      }
      if (Array.isArray(item.alternatives)) {
        for (const alt of item.alternatives) {
          if (typeof alt === "string" && alt.trim()) out.push(alt);
        }
      }
      if (typeof item.text === "string" && item.text.trim()) {
        out.push(item.text);
      }
      if (typeof item.value === "string" && item.value.trim()) {
        out.push(item.value);
      }
    }
  }
  return out;
}

/**
 * Verifies that at least one answer in `answers` matches an extracted option after normalization.
 * @param {Array<string | object>} options
 * @param {Array<string | object>} answers
 * @returns {boolean}
 */
export function isAnswerCompatibleWithOptions(options, answers) {
  if (!Array.isArray(options) || options.length < 2) return false;
  const candidateAnswers = extractAnswerStrings(answers);
  if (candidateAnswers.length === 0) return false;

  const normalizedOptions = new Set();
  for (const opt of options) {
    const val = normalizeAnswer(getOptionValue(opt));
    if (val) normalizedOptions.add(val);
    if (opt && typeof opt === "object" && opt.label) {
      const lbl = normalizeAnswer(opt.label);
      if (lbl) normalizedOptions.add(lbl);
    }
  }

  if (normalizedOptions.size < 2) return false;

  return candidateAnswers.some((ans) => {
    const normAns = normalizeAnswer(ans);
    return normAns.length > 0 && normalizedOptions.has(normAns);
  });
}

/**
 * Finds the matching option object for a given answer or user value.
 * @param {Array<{ value: string, label?: string, key?: string }>} options
 * @param {string | null | undefined} targetValue
 * @returns {object | null}
 */
export function findMatchingOption(options, targetValue) {
  if (!Array.isArray(options) || !targetValue) return null;
  const normTarget = normalizeAnswer(targetValue);
  if (!normTarget) return null;

  return (
    options.find((opt) => {
      const val = normalizeAnswer(getOptionValue(opt));
      const lbl = opt && typeof opt === "object" && opt.label ? normalizeAnswer(opt.label) : "";
      return val === normTarget || (lbl && lbl === normTarget);
    }) || null
  );
}
