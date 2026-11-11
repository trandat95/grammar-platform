/**
 * Speech Service Utility Helpers
 */

/**
 * Clean string for SpeechSynthesis: strips markdown tokens, phonetics, and bracketed notes
 */
export function sanitizeSpeechText(rawText) {
  if (!rawText || typeof rawText !== "string") return "";

  return rawText
    // Remove markdown bold/italic/strikethrough
    .replace(/\*\*\*(.*?)\*\*\*/g, "$1")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/\[NOT\s+(.*?)\]/g, "")
    // Remove phonetic transcriptions inside /.../
    .replace(/\/[^/]+\//g, "")
    // Remove translation or note parens containing Vietnamese characters
    .replace(/\([^(]*[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ][^)]*\)/gi, "")
    // Clean extra whitespace
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Select best available SpeechSynthesisVoice for a desired locale
 */
export function matchBestVoice(voices, targetLocale = "en-US") {
  if (!voices || voices.length === 0) return null;

  const normalizedTarget = targetLocale.replace("_", "-").toLowerCase();

  // 1. Exact match with premium/natural voice preference
  const exactMatches = voices.filter(
    (v) => v.lang && v.lang.replace("_", "-").toLowerCase() === normalizedTarget
  );

  if (exactMatches.length > 0) {
    const naturalVoice = exactMatches.find(
      (v) =>
        v.name.includes("Natural") ||
        v.name.includes("Google") ||
        v.name.includes("Daniel") ||
        v.name.includes("Samantha") ||
        v.name.includes("Karen") ||
        v.name.includes("Online")
    );
    return naturalVoice || exactMatches[0];
  }

  // 2. Fallback to any English voice (en-*)
  const englishVoices = voices.filter(
    (v) => v.lang && v.lang.toLowerCase().startsWith("en")
  );
  if (englishVoices.length > 0) {
    return englishVoices[0];
  }

  // 3. Absolute fallback: default voice
  return voices.find((v) => v.default) || voices[0] || null;
}
