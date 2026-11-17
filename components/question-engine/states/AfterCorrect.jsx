import React from "react";

/**
 * AfterCorrect state wrapper:
 * Soft emerald highlight with concise encouragement and optional Continue action.
 */
export default function AfterCorrect({
  children,
  onContinue = null,
  continueLabel = "Tiếp tục",
  className = "",
  style = {},
}) {
  return (
    <div
      data-question-state="after-correct"
      className={className}
      style={{
        backgroundColor: "var(--ds-card)",
        border: "1.5px solid var(--ds-success-border)",
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
          padding: "0.45rem 0.75rem",
          marginBottom: "0.85rem",
          borderRadius: "var(--ds-radius-md, 8px)",
          backgroundColor: "var(--ds-success-bg)",
          border: "1px solid var(--ds-success-border)",
        }}
      >
        <span
          style={{
            fontSize: "0.82rem",
            fontWeight: "700",
            color: "var(--ds-success)",
          }}
        >
          ✓ Chính xác! Giữ vững phong độ.
        </span>

        {typeof onContinue === "function" && (
          <button
            type="button"
            onClick={onContinue}
            className="ds-focusable"
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: "var(--ds-radius-md, 8px)",
              backgroundColor: "var(--ds-success)",
              color: "var(--ds-text-on-accent)",
              border: "1px solid var(--ds-success)",
              fontSize: "0.78rem",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            {continueLabel} →
          </button>
        )}
      </div>

      {children}
    </div>
  );
}
