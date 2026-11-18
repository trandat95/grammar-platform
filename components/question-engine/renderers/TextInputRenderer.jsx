import React from "react";

export default function TextInputRenderer({
  question,
  value = "",
  onChange,
  onCheck,
  onShowAnswer,
  isAnswerOpen = false,
  checkResult = null,
  disabled = false,
  isSubmitting = false,
  showCheckButton = true,
  showAnswerButton = true,
  placeholder = "",
}) {
  const isLocked = disabled || isSubmitting;
  const starter = question?.starter_prompt ? String(question.starter_prompt).trim() : "";
  const resolvedPlaceholder =
    placeholder ||
    (starter ? `Tiếp tục câu: "${starter}..."` : "Nhập câu trả lời...");

  const inputBorder = checkResult?.checked
    ? checkResult.isCorrect
      ? "1.5px solid var(--ds-success)"
      : "1.5px solid var(--ds-danger)"
    : "1px solid var(--ds-border)";

  return (
    <div
      style={{
        display: "flex",
        gap: "0.55rem",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <input
        type="text"
        value={value}
        disabled={isLocked}
        placeholder={resolvedPlaceholder}
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        aria-label={
          question?.num
            ? `Nhập câu trả lời cho câu ${question.num}`
            : "Nhập câu trả lời"
        }
        className="ds-focusable"
        onChange={(e) => {
          if (typeof onChange === "function") {
            onChange(e.target.value);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !isLocked && typeof onCheck === "function") {
            e.preventDefault();
            onCheck(question);
          }
        }}
        style={{
          flex: "1 1 220px",
          minWidth: 0,
          width: "100%",
          minHeight: "46px",
          padding: "0.55rem 0.85rem",
          backgroundColor: isLocked ? "var(--ds-bg-elevated)" : "var(--ds-card)",
          border: inputBorder,
          borderRadius: "var(--ds-radius-md, 8px)",
          color: "var(--ds-text)",
          fontSize: "1rem",
          boxSizing: "border-box",
          outline: "none",
        }}
      />

      {showCheckButton && typeof onCheck === "function" && !disabled && (
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onCheck(question)}
          className="ds-focusable"
          style={{
            padding: "0.55rem 1rem",
            minHeight: "44px",
            backgroundColor: "var(--ds-btn-primary)",
            border: "1px solid var(--ds-btn-primary)",
            borderRadius: "var(--ds-radius-md, 8px)",
            color: "var(--ds-text-on-accent)",
            fontSize: "0.82rem",
            fontWeight: "600",
            cursor: isSubmitting ? "wait" : "pointer",
            opacity: isSubmitting ? 0.72 : 1,
          }}
        >
          {isSubmitting ? "Đang kiểm tra..." : "Kiểm tra"}
        </button>
      )}

      {showAnswerButton && typeof onShowAnswer === "function" && (
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onShowAnswer(question)}
          className="ds-focusable"
          style={{
            padding: "0.55rem 0.85rem",
            minHeight: "44px",
            backgroundColor: "var(--ds-card-subtle)",
            border: "1px solid var(--ds-border)",
            borderRadius: "var(--ds-radius-md, 8px)",
            color: "var(--ds-text-secondary)",
            fontSize: "0.82rem",
            fontWeight: "500",
            cursor: isSubmitting ? "wait" : "pointer",
          }}
        >
          {isAnswerOpen ? "Ẩn đáp án" : "Đáp án"}
        </button>
      )}
    </div>
  );
}
