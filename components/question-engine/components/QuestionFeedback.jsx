import React from "react";
import { extractAnswerStrings } from "../resolver/AnswerCompatibility";

/**
 * Extracts factual pedagogical fallback details strictly from existing question metadata.
 * Never fabricates explanations, common mistakes, or rules not present in source data.
 * @param {object} question
 * @returns {{ ruleHint: string | null, signalHint: string | null, commonMistakes: string[] }}
 */
export function extractFactualFallbackMeta(question) {
  if (!question || typeof question !== "object") {
    return { ruleHint: null, signalHint: null, commonMistakes: [] };
  }

  const ped = question.pedagogy && typeof question.pedagogy === "object" ? question.pedagogy : null;
  let rawRuleHint =
    (typeof ped?.rule === "string" && ped.rule.trim()) ||
    (typeof question.topic_name === "string" && question.topic_name.trim()
      ? `Chủ điểm ngữ pháp: ${question.topic_name.trim()}`
      : null) ||
    (typeof question.instruction === "string" && question.instruction.trim()
      ? `Yêu cầu bài học: ${question.instruction.trim()}`
      : null);

  if (rawRuleHint) {
    const answerTokens = extractAnswerStrings(question)
      .flatMap((ans) => String(ans).split(/\s*[-/|,]\s*/))
      .map((s) => s.trim())
      .filter((s) => s.length >= 2);
    for (const tok of answerTokens) {
      const escaped = tok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      rawRuleHint = rawRuleHint
        .replace(new RegExp(`['"“”]?\\b${escaped}\\b['"“”]?`, "gi"), "___")
        .replace(/\s{2,}/g, " ")
        .trim();
    }
  }
  const ruleHint = rawRuleHint;

  const signalHint =
    (typeof ped?.signal === "string" && ped.signal.trim()) || null;

  const commonMistakes = Array.isArray(question.common_mistakes)
    ? question.common_mistakes.filter(Boolean).map(String)
    : Array.isArray(ped?.common_mistakes)
      ? ped.common_mistakes.filter(Boolean).map(String)
      : [];

  return { ruleHint, signalHint, commonMistakes };
}

export default function QuestionFeedback({
  question,
  checkResult = null,
  isAnswerOpen = false,
  userValue = "",
  renderExplanation = null,
  renderPostAnswerExtra = null,
}) {
  if (!question) return null;

  const isChecked = Boolean(checkResult?.checked);
  const isCorrect = Boolean(checkResult?.isCorrect);
  const answersList = extractAnswerStrings(question.answers);
  const { ruleHint, signalHint, commonMistakes } = extractFactualFallbackMeta(question);

  const shouldShowExplanation = (isChecked || isAnswerOpen) && Boolean(
    renderExplanation || question.explanation || question.pedagogy
  );

  return (
    <div style={{ marginTop: "var(--ds-space-3, 12px)" }}>
      {/* Result Status Banner */}
      {isChecked && checkResult?.feedback && (
        <div
          role="status"
          aria-live="polite"
          style={{
            padding: "0.55rem 0.85rem",
            borderRadius: "var(--ds-radius-md, 8px)",
            backgroundColor: isCorrect ? "var(--ds-success-bg)" : "var(--ds-warning-bg)",
            border: isCorrect
              ? "1px solid var(--ds-success-border)"
              : "1px solid var(--ds-warning-border)",
            color: isCorrect ? "var(--ds-success)" : "var(--ds-warning)",
            fontSize: "0.85rem",
            fontWeight: "600",
            lineHeight: "1.5",
            overflowWrap: "anywhere",
          }}
        >
          {checkResult.feedback}
        </div>
      )}

      {/* Canonical Answer Key Reveal */}
      {isAnswerOpen && answersList.length > 0 && (
        <div
          style={{
            marginTop: "0.65rem",
            padding: "0.7rem 0.9rem",
            borderRadius: "var(--ds-radius-md, 8px)",
            backgroundColor: "var(--ds-success-bg)",
            border: "1px solid var(--ds-success-border)",
            fontSize: "0.85rem",
            color: "var(--ds-text)",
            lineHeight: "1.55",
            overflowWrap: "anywhere",
          }}
        >
          <div style={{ fontWeight: "700", color: "var(--ds-success)", marginBottom: "0.2rem" }}>
            Đáp án chuẩn:
          </div>
          {userValue && isChecked && !isCorrect && (
            <div style={{ fontSize: "0.8rem", color: "var(--ds-text-muted)", marginBottom: "0.25rem" }}>
              Câu trả lời của bạn: <strong style={{ color: "var(--ds-text)" }}>{userValue}</strong>
            </div>
          )}
          <div style={{ fontWeight: "600", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {answersList.join(" / ")}
          </div>
        </div>
      )}

      {/* Post-Answer Extra Slot (e.g. RemedialRecommendationCard) */}
      {typeof renderPostAnswerExtra === "function" &&
        renderPostAnswerExtra(question, checkResult)}

      {/* Explanation Slot (StructuredExplanation 5-step) or Factual Fallback */}
      {shouldShowExplanation && (
        <div style={{ marginTop: "0.75rem" }}>
          {typeof renderExplanation === "function" ? (
            renderExplanation(question)
          ) : (
            <div
              style={{
                padding: "0.85rem 1rem",
                borderRadius: "var(--ds-radius-lg, 12px)",
                backgroundColor: "var(--ds-card-subtle)",
                border: "1px solid var(--ds-card-border)",
                fontSize: "0.85rem",
                color: "var(--ds-text-secondary)",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                overflowWrap: "anywhere",
              }}
            >
              {question.explanation ? (
                <div>{question.explanation}</div>
              ) : (
                <>
                  {signalHint && (
                    <div style={{ marginBottom: "0.4rem" }}>
                      <strong>Dấu hiệu:</strong> {signalHint}
                    </div>
                  )}
                  {ruleHint && (
                    <div>
                      <strong>Quy tắc bài học:</strong> {ruleHint}
                    </div>
                  )}
                </>
              )}

              {commonMistakes.length > 0 ? (
                <div style={{ marginTop: "0.5rem" }}>
                  <strong>Lỗi thường gặp:</strong> {commonMistakes.join(" • ")}
                </div>
              ) : (
                ruleHint &&
                question.explanation && (
                  <div
                    style={{
                      marginTop: "0.55rem",
                      paddingTop: "0.5rem",
                      borderTop: "1px solid var(--ds-border-subtle)",
                      fontSize: "0.78rem",
                      color: "var(--ds-text-muted)",
                    }}
                  >
                    Đối chiếu quy tắc bài học: {ruleHint}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
