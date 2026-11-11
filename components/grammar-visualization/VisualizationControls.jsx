import React from "react";

export default function VisualizationControls({
  onReset,
  isExpanded = false,
  onToggleExpand,
  isLight = false,
}) {
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
          onClick={onReset}
          title="Đặt lại trạng thái ban đầu"
          style={{
            padding: "0.3rem 0.6rem",
            fontSize: "0.75rem",
            fontFamily: "Geist Mono",
            backgroundColor: isLight ? "#f1f5f9" : "#1e1e28",
            border: `1px solid ${isLight ? "#cbd5e1" : "#2d2d3d"}`,
            borderRadius: "6px",
            color: isLight ? "#334155" : "#a1a1aa",
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
          onClick={onToggleExpand}
          title={isExpanded ? "Thu gọn giao diện" : "Mở rộng giao diện"}
          style={{
            padding: "0.3rem 0.6rem",
            fontSize: "0.75rem",
            fontFamily: "Geist Mono",
            backgroundColor: isLight ? "#f1f5f9" : "#1e1e28",
            border: `1px solid ${isLight ? "#cbd5e1" : "#2d2d3d"}`,
            borderRadius: "6px",
            color: isLight ? "#334155" : "#a1a1aa",
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
