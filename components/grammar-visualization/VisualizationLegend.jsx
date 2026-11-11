import React from "react";

export default function VisualizationLegend({ type, isLight = false }) {
  const containerStyle = {
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
  };

  if (type === "timeline") {
    return (
      <div style={containerStyle}>
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
      <div style={containerStyle}>
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

  if (type === "transformation") {
    return (
      <div style={containerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#3b82f6" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>Chủ ngữ (Subject - S)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#f59e0b" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>Động từ (Verb - V)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#10b981" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>Tân ngữ (Object - O)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#06b6d4" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>Tác nhân (By + O)</span>
        </div>
      </div>
    );
  }

  if (type === "conversion-flow") {
    return (
      <div style={containerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#3b82f6" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>Câu trực tiếp (Direct Speech)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#8b5cf6" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>Lùi thì (Backshift Step)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#10b981" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>Câu gián tiếp (Reported Speech)</span>
        </div>
      </div>
    );
  }

  if (type === "sentence-tree") {
    return (
      <div style={containerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#3b82f6" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>Danh từ đi trước (Antecedent)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#9333ea" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>Đại từ quan hệ (Pronoun)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#f59e0b" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>Vị ngữ mệnh đề quan hệ</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#10b981" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>Vị ngữ mệnh đề chính</span>
        </div>
      </div>
    );
  }

  if (type === "comparison-scale") {
    return (
      <div style={containerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#10b981" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>Bằng nhau (=): as... as</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#3b82f6" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>Hơn (&gt;): -er / more ... than</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#8b5cf6" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>Nhất (MAX): the -est / the most</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#f59e0b" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>Kép (↗↗): The more... the more...</span>
        </div>
      </div>
    );
  }

  if (type === "modal-matrix") {
    return (
      <div style={containerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#ef4444" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>0% Impossible (can't)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#f59e0b" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>30-50% Possibility (might, may)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#3b82f6" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>75% Expectation (should)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#10b981" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>100% Certainty (must)</span>
        </div>
      </div>
    );
  }

  if (type === "word-family-tree") {
    return (
      <div style={containerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#10b981" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>Danh từ (Noun)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#ef4444" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>Động từ (Verb)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#3b82f6" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>Tính từ (Adjective)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#8b5cf6" }} />
          <span style={{ color: isLight ? "#334155" : "#cbd5e1" }}>Trạng từ (Adverb)</span>
        </div>
      </div>
    );
  }

  return null;
}
