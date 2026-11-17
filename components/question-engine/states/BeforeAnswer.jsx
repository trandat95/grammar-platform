import React from "react";

/**
 * BeforeAnswer state wrapper:
 * Clean, distraction-free surface with zero mascots or decorative clutter.
 */
export default function BeforeAnswer({
  children,
  className = "",
  style = {},
}) {
  return (
    <div
      data-question-state="before-answer"
      className={className}
      style={{
        backgroundColor: "var(--ds-card)",
        border: "1px solid var(--ds-card-border)",
        borderRadius: "var(--ds-radius-xl, 16px)",
        padding: "var(--ds-space-4, 16px)",
        boxShadow: "var(--ds-shadow-sm)",
        maxWidth: "100%",
        boxSizing: "border-box",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
