import React from "react";

export default function VisualizationLegend({ type, isLight = false }) {
  if (type === "timeline") {
    return (
      <div
        style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          padding: "0.65rem 1rem",
          backgroundColor: isLight ? "#f8fafc" : "#14141c",
          border: `1px solid ${isLight ? "#e2e8f0" : "#272733"}`,
          borderRadius: "8px",
          fontSize: "0.75rem",
          fontFamily: "Geist Mono",
          marginTop: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#3b82f6" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>Đơn (Simple): Chấm điểm xác định</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#10b981" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>Tiếp diễn (Continuous): Khoảng kéo dài ~</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#f59e0b" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>Hoàn thành (Perfect): Cầu nối trước ➔ sau</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#8b5cf6" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>Hoàn thành tiếp diễn: Kéo dài liên tục</span>
        </div>
      </div>
    );
  }

  if (type === "decision-tree") {
    return (
      <div
        style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          padding: "0.65rem 1rem",
          backgroundColor: isLight ? "#f8fafc" : "#14141c",
          border: `1px solid ${isLight ? "#e2e8f0" : "#272733"}`,
          borderRadius: "8px",
          fontSize: "0.75rem",
          fontFamily: "Geist Mono",
          marginTop: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#3b82f6" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>Câu hỏi rẽ nhánh (Question Node)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#10b981" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>Kết luận loại câu điều kiện (Leaf Node)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#f59e0b" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>Đảo ngữ (Inversion Rule)</span>
        </div>
      </div>
    );
  }

  return null;
}
