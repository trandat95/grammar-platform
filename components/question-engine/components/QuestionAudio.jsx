import React from "react";

/**
 * Strips inline parenthetical choice hints or blank markers for natural TTS pronunciation.
 * @param {string} stem
 * @returns {string}
 */
export function sanitizeStemForAudio(stem) {
  return String(stem ?? "")
    .replace(/\\_/g, " ")
    .replace(/\(([^()]+)\)/g, " ")
    .replace(/_+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function QuestionAudio({
  stem = "",
  question = null,
  onListen = null,
  disabled = false,
  label = "Nghe câu",
}) {
  if (typeof onListen !== "function") return null;

  const cleanText = sanitizeStemForAudio(stem || question?.stem || "");

  return (
    <button
      type="button"
      disabled={disabled || !cleanText}
      onClick={() => onListen(cleanText, question)}
      title="Nghe phát âm câu hỏi này"
      aria-label="Nghe phát âm câu hỏi"
      className="ds-focusable"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        backgroundColor: "var(--ds-card)",
        border: "1px solid var(--ds-border)",
        color: "var(--ds-accent)",
        borderRadius: "var(--ds-radius-md, 8px)",
        padding: "0.35rem 0.65rem",
        minHeight: "34px",
        fontSize: "0.75rem",
        fontWeight: "600",
        cursor: disabled || !cleanText ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        flexShrink: 0,
        whiteSpace: "nowrap",
      }}
    >
      <span aria-hidden="true">🔊</span>
      <span>{label}</span>
    </button>
  );
}
