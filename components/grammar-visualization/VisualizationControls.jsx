import React from "react";
import { getThemeTokens } from "../../lib/tokens/design-tokens";

export default function VisualizationControls({
  onReset,
  isExpanded = false,
  onToggleExpand,
  isLight = false,
}) {
  const T = getThemeTokens(isLight);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
      }}
    >
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          title="Đặt lại trạng thái ban đầu"
          className="ds-focusable"
          style={{
            padding: "0.3rem 0.6rem",
            fontSize: "0.75rem",
            fontFamily: "var(--font-sans)",
            backgroundColor: T.bgElevated,
            border: `1px solid ${T.border}`,
            borderRadius: "6px",
            color: T.textSecondary,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <span>↺</span>
          <span>Đặt lại</span>
        </button>
      )}

      {onToggleExpand && (
        <button
          type="button"
          onClick={onToggleExpand}
          title={isExpanded ? "Thu gọn giao diện" : "Mở rộng giao diện"}
          className="ds-focusable"
          style={{
            padding: "0.3rem 0.6rem",
            fontSize: "0.75rem",
            fontFamily: "var(--font-sans)",
            backgroundColor: T.bgElevated,
            border: `1px solid ${T.border}`,
            borderRadius: "6px",
            color: T.textSecondary,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <span>{isExpanded ? "⤡" : "⤢"}</span>
          <span>{isExpanded ? "Thu nhỏ" : "Phóng to"}</span>
        </button>
      )}
    </div>
  );
}
