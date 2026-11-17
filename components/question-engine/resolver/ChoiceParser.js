import { normalizeAnswer } from "./AnswerCompatibility.js";

const AMBIGUOUS_SLASH_TOKENS = new Set([
  "and/or",
  "he/she",
  "she/he",
  "his/her",
  "her/his",
  "him/her",
  "her/him",
  "s/he",
  "km/h",
  "m/s",
  "w/o",
  "n/a",
]);

/**
 * Builds canonical choice option descriptors with A/B/C/D keys.
 * @param {Array<string | object>} rawChoices
 * @returns {Array<{ id: string, key: string, label: string, value: string }>}
 */
function normalizeChoiceList(rawChoices) {
  const result = [];
  for (let i = 0; i < rawChoices.length; i += 1) {
    const item = rawChoices[i];
    const key = String.fromCharCode(65 + i);
    if (typeof item === "string") {
      const trimmed = item.trim();
      if (!trimmed) continue;
      result.push({
        id: `${key}:${trimmed}`,
        key,
        label: trimmed,
        value: trimmed,
      });
    } else if (item && typeof item === "object") {
      const rawValue = item.value ?? item.label ?? item.text ?? "";
      const value = String(rawValue).trim();
      const label = String(item.label ?? item.text ?? value).trim();
      if (!value && !label) continue;
      result.push({
        id: item.id ? String(item.id) : `${key}:${value || label}`,
        key: item.key ? String(item.key) : key,
        label: label || value,
        value: value || label,
      });
    }
  }
  return result;
}

/**
 * Extracts structured choices from `question.choices` if present and >= 2 options.
 * @param {object} question
 * @returns {{ valid: boolean, options: Array, reason: string }}
 */
export function parseStructuredChoices(question) {
  if (!question || !Array.isArray(question.choices) || question.choices.length < 2) {
    return { valid: false, options: [], reason: "no_structured_choices" };
  }
  const options = normalizeChoiceList(question.choices);
  if (options.length < 2) {
    return { valid: false, options: [], reason: "insufficient_structured_choices" };
  }
  return { valid: true, options, reason: "structured_choices" };
}

/**
 * Detects multi-blank slash patterns such as `(many/ much)1 ... (plenty/ plenty of)2`
 * or multiple `(opt1/opt2)` groups in a single stem.
 * @param {string} stem
 * @returns {boolean}
 */
export function hasMultiBlankPattern(stem) {
  const text = String(stem ?? "");
  if (!text) return false;
  if (/\([^()]+\/\s*[^()]+\)\s*\d+/.test(text)) return true;
  const groups = [...text.matchAll(/\(([^()]+)\)/g)].filter((m) => m[1].includes("/"));
  return groups.length > 1;
}

/**
 * Safely parses a single inline parenthetical `(opt1/opt2)` choice group.
 * Rejects multi-blank stems, malformed parentheses, ambiguous slash tokens,
 * and option counts outside 2..4.
 * @param {string} stem
 * @returns {{ valid: boolean, options: Array, groupText: string | null, reason: string }}
 */
export function parseInlineParentheticalChoices(stem) {
  const text = String(stem ?? "");
  if (!text) {
    return { valid: false, options: [], groupText: null, reason: "empty_stem" };
  }

  if (/\([^()]+\/\s*[^()]+\)\s*\d+/.test(text)) {
    return { valid: false, options: [], groupText: null, reason: "multi_blank_numbered" };
  }

  const allGroups = [...text.matchAll(/\(([^()]+)\)/g)];
  const slashGroups = allGroups.filter((m) => m[1].includes("/"));

  if (slashGroups.length === 0) {
    return { valid: false, options: [], groupText: null, reason: "no_slash_group" };
  }
  if (slashGroups.length > 1) {
    return { valid: false, options: [], groupText: null, reason: "multi_slash_groups" };
  }

  const inner = slashGroups[0][1].trim();
  const compactInner = inner.toLowerCase().replace(/\s+/g, "");
  if (AMBIGUOUS_SLASH_TOKENS.has(compactInner)) {
    return { valid: false, options: [], groupText: null, reason: "ambiguous_slash_token" };
  }

  const rawParts = inner
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  if (rawParts.length < 2 || rawParts.length > 4) {
    return { valid: false, options: [], groupText: null, reason: "invalid_option_count" };
  }

  // Reject duplicate normalized options or standalone common abbreviations inside a part
  const normalizedSet = new Set();
  for (const part of rawParts) {
    const norm = normalizeAnswer(part);
    if (!norm || normalizedSet.has(norm)) {
      return { valid: false, options: [], groupText: null, reason: "duplicate_or_empty_option" };
    }
    normalizedSet.add(norm);
  }

  return {
    valid: true,
    options: normalizeChoiceList(rawParts),
    groupText: slashGroups[0][0],
    reason: "parsed_inline_group",
  };
}
