import React from "react";
import { extractFactualFallbackMeta } from "../components/QuestionFeedback";

/**
 * AfterWrong state wrapper:
 * Gentle, non-harsh error feedback with factual rule hint and optional Retry action.
 */
export default function AfterWrong({
  question = null,
  userValue = "",
  onRetry = null,
  retryLabel = "Thử lại",
  disabled = false,
  children,
  className = "",
  style = {},
}) {
  const { ruleHint } = extractFactualFallbackMeta(question);

  return (
    <div
      data-question-state="after-wrong"
      className={className}
      style={{
        backgroundColor: "var(--ds-card)",
        border: "1.5px solid var(--ds-warning-border)",
        borderRadius: "var(--ds-radius-xl, 16px)",
        padding: "var(--ds-space-4, 16px)",
        boxShadow: "var(--ds-shadow-sm)",
        maxWidth: "100%",
        boxSizing: "border-box",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
          flexWrap: "wrap",
          padding: "0.5rem 0.75rem",
          marginBottom: "0.85rem",
          borderRadius: "var(--ds-radius-md, 8px)",
          backgroundColor: "var(--ds-warning-bg)",
          border: "1px solid var(--ds-warning-border)",
        }}
      >
        <div style={{ flex: 1, minWidth: "180px" }}>
          <div
            style={{
              fontSize: "0.82rem",
              fontWeight: "700",
              color: "var(--ds-warning)",
            }}
          >
            Chưa chính xác — hãy đối chiếu quy tắc bên dưới
          </div>
          {userValue && (
            <div
              style={{
                fontSize: "0.76rem",
                color: "var(--ds-text-secondary)",
                marginTop: "0.15rem",
                overflowWrap: "anywhere",
              }}
            >
              Bạn đã chọn/nhập: <strong>{userValue}</strong>
            </div>
          )}
          {ruleHint && (
            <div
              style={{
                fontSize: "0.76rem",
                color: "var(--ds-text-muted)",
                marginTop: "0.15rem",
                overflowWrap: "anywhere",
              }}
            >
              Gợi ý quy tắc: {ruleHint}
            </div>
          )}
        </div>

        {typeof onRetry === "function" && !disabled && (
          <button
            type="button"
            onClick={onRetry}
            className="ds-focusable"
            style={{
              padding: "0.38rem 0.8rem",
              borderRadius: "var(--ds-radius-md, 8px)",
              backgroundColor: "var(--ds-card)",
              color: "var(--ds-warning)",
              border: "1px solid var(--ds-warning-border)",
              fontSize: "0.78rem",
              fontWeight: "700",
              cursor: "pointer",
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span>{retryLabel}</span>
          </button>
        )}
      </div>

      {children}
    </div>
  );
}
