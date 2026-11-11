import React, { useState } from "react";
import AudioPlayer from "../audio/AudioPlayer";

export default function DecisionTreeVisualization({ data, isLight = false }) {
  const nodes = data?.nodes || {};
  const results = data?.results || {};

  const [history, setHistory] = useState([]);
  const [currentNodeId, setCurrentNodeId] = useState("root");

  const currentNode = nodes[currentNodeId];
  const isAtResult = results[currentNodeId] !== undefined;
  const currentResult = isAtResult ? results[currentNodeId] : null;

  const handleSelectOption = (option) => {
    setHistory([...history, { nodeId: currentNodeId, label: option.label }]);
    setCurrentNodeId(option.next);
  };

  const handleBack = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setCurrentNodeId(prev.nodeId);
  };

  const handleReset = () => {
    setHistory([]);
    setCurrentNodeId("root");
  };

  const jumpDirectToType = (typeKey) => {
    handleReset();
    setCurrentNodeId(typeKey);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* 1. Header Toolbar: Breadcrumb & Quick Shortcuts */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
        {/* Breadcrumb Steps */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
          <button
            onClick={handleReset}
            style={{
              padding: "0.25rem 0.55rem",
              fontSize: "0.72rem",
              fontWeight: "700",
              borderRadius: "4px",
              backgroundColor: isLight ? "#f1f5f9" : "#18181f",
              color: isLight ? "#0f172a" : "#fafafa",
              border: `1px solid ${isLight ? "#cbd5e1" : "#272733"}`,
              cursor: "pointer",
            }}
          >
            🌳 Bắt đầu lại
          </button>

          {history.map((step, idx) => (
            <React.Fragment key={idx}>
              <span style={{ fontSize: "0.75rem", color: isLight ? "#94a3b8" : "#52525b" }}>→</span>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontFamily: "Geist Mono",
                  backgroundColor: isLight ? "#eff6ff" : "rgba(59, 130, 246, 0.15)",
                  color: isLight ? "#1d4ed8" : "#60a5fa",
                  padding: "0.15rem 0.45rem",
                  borderRadius: "4px",
                  border: `1px solid ${isLight ? "#bfdbfe" : "#3b82f650"}`,
                  maxWidth: "180px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={step.label}
              >
                {step.label}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Quick Jump Buttons */}
        <div style={{ display: "flex", gap: "0.3rem", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.7rem", color: isLight ? "#64748b" : "#a1a1aa", fontWeight: "600" }}>Xem nhanh:</span>
          {[
            { key: "type_0", label: "Loại 0" },
            { key: "type_1", label: "Loại 1" },
            { key: "type_2", label: "Loại 2" },
            { key: "type_3", label: "Loại 3" },
            { key: "type_mixed", label: "Hỗn hợp" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => jumpDirectToType(item.key)}
              style={{
                padding: "0.2rem 0.5rem",
                fontSize: "0.7rem",
                fontWeight: currentNodeId === item.key ? "700" : "500",
                borderRadius: "4px",
                backgroundColor: currentNodeId === item.key ? (isLight ? "#ecfdf5" : "#064e3b40") : (isLight ? "#ffffff" : "#18181f"),
                color: currentNodeId === item.key ? (isLight ? "#047857" : "#34d399") : (isLight ? "#475569" : "#a1a1aa"),
                border: `1px solid ${currentNodeId === item.key ? (isLight ? "#a7f3d0" : "#05966980") : (isLight ? "#cbd5e1" : "#272733")}`,
                cursor: "pointer",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Interactive Decision Node Box (If not at final result) */}
      {!isAtResult && currentNode && (
        <div
          style={{
            backgroundColor: isLight ? "#ffffff" : "#111116",
            border: `1px solid ${isLight ? "#cbd5e1" : "#272733"}`,
            borderRadius: "12px",
            padding: "1.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            boxShadow: isLight ? "0 4px 12px rgba(0,0,0,0.04)" : "none",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", fontFamily: "Geist Mono", backgroundColor: isLight ? "#eff6ff" : "#1e293b", color: isLight ? "#1d4ed8" : "#60a5fa", padding: "0.15rem 0.45rem", borderRadius: "4px", fontWeight: "700" }}>
                BƯỚC {history.length + 1} CỦA CÂY QUYẾT ĐỊNH
              </span>
            </div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: isLight ? "#0f172a" : "#ffffff", margin: 0, lineHeight: "1.4" }}>
              {currentNode.question}
            </h3>
            <p style={{ fontSize: "0.825rem", color: isLight ? "#64748b" : "#a1a1aa", fontStyle: "italic", margin: "0.3rem 0 0 0" }}>
              {currentNode.question_en}
            </p>
          </div>

          {/* Decision Options */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.85rem" }}>
            {currentNode.options.map((opt, oIdx) => (
              <button
                key={oIdx}
                onClick={() => handleSelectOption(opt)}
                style={{
                  padding: "1rem 1.25rem",
                  backgroundColor: opt.highlight ? (isLight ? "#f0fdf4" : "rgba(16, 185, 129, 0.1)") : (isLight ? "#f8fafc" : "#16161e"),
                  border: `1px solid ${opt.highlight ? (isLight ? "#86efac" : "#10b98160") : (isLight ? "#cbd5e1" : "#2b2b3a")}`,
                  borderRadius: "8px",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontSize: "0.875rem", fontWeight: "700", color: opt.highlight ? (isLight ? "#15803d" : "#34d399") : (isLight ? "#0f172a" : "#fafafa") }}>
                  {opt.label}
                </span>
                <span style={{ fontSize: "1rem", color: isLight ? "#15803d" : "#34d399" }}>➔</span>
              </button>
            ))}
          </div>

          {history.length > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <button
                onClick={handleBack}
                style={{
                  padding: "0.35rem 0.85rem",
                  backgroundColor: "transparent",
                  border: `1px solid ${isLight ? "#cbd5e1" : "#3f3f46"}`,
                  borderRadius: "6px",
                  color: isLight ? "#475569" : "#a1a1aa",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                }}
              >
                ← Quay lại bước trước
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. Final Result Display Card (When a Conditional Type is Reached) */}
      {isAtResult && currentResult && (
        <div
          style={{
            backgroundColor: isLight ? "#ffffff" : "#111116",
            border: `2px solid ${isLight ? "#a7f3d0" : "#10b98180"}`,
            borderRadius: "12px",
            padding: "1.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            boxShadow: isLight ? "0 4px 15px rgba(16, 185, 129, 0.08)" : "none",
          }}
        >
          {/* Result Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <span style={{ fontSize: "0.72rem", fontFamily: "Geist Mono", backgroundColor: isLight ? "#ecfdf5" : "rgba(16, 185, 129, 0.2)", color: isLight ? "#047857" : "#34d399", padding: "0.15rem 0.5rem", borderRadius: "999px", fontWeight: "700" }}>
                KẾT QUẢ ĐÃ XÁC ĐỊNH
              </span>
              <h3 style={{ fontSize: "1.35rem", fontWeight: "800", color: isLight ? "#0f172a" : "#ffffff", margin: "0.35rem 0 0 0" }}>
                {currentResult.name_vi}
              </h3>
              <div style={{ fontSize: "0.85rem", color: isLight ? "#64748b" : "#a1a1aa", fontFamily: "Geist Mono" }}>
                {currentResult.name_en}
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={handleBack}
                style={{
                  padding: "0.4rem 0.85rem",
                  backgroundColor: isLight ? "#f1f5f9" : "#1e1e28",
                  border: `1px solid ${isLight ? "#cbd5e1" : "#333342"}`,
                  borderRadius: "6px",
                  color: isLight ? "#334155" : "#e4e4e7",
                  fontSize: "0.78rem",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                ← Bước trước
              </button>
              <button
                onClick={handleReset}
                style={{
                  padding: "0.4rem 0.95rem",
                  backgroundColor: "#10b981",
                  border: "none",
                  borderRadius: "6px",
                  color: "#042f1a",
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Khám phá câu khác
              </button>
            </div>
          </div>

          {/* Formula Card */}
          <div
            style={{
              backgroundColor: isLight ? "#f8fafc" : "#0a0a0e",
              border: `1px solid ${isLight ? "#cbd5e1" : "#22222d"}`,
              borderRadius: "8px",
              padding: "1rem 1.25rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <div>
              <div style={{ fontSize: "0.7rem", fontFamily: "Geist Mono", color: isLight ? "#059669" : "#34d399", fontWeight: "700", textTransform: "uppercase" }}>
                CÔNG THỨC CHUẨN XÁC:
              </div>
              <div style={{ fontSize: "1.05rem", fontFamily: "Geist Mono", fontWeight: "800", color: isLight ? "#0f172a" : "#fafafa", marginTop: "0.2rem" }}>
                {currentResult.formula}
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", borderRadius: "4px", backgroundColor: isLight ? "#eff6ff" : "#1e3a8a30", color: isLight ? "#1d4ed8" : "#60a5fa", fontWeight: "600" }}>
                Mệnh đề If: {currentResult.if_tense}
              </span>
              <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", borderRadius: "4px", backgroundColor: isLight ? "#ecfdf5" : "#064e3b30", color: isLight ? "#047857" : "#34d399", fontWeight: "600" }}>
                Mệnh đề chính: {currentResult.main_tense}
              </span>
            </div>
          </div>

          {/* "Why this answer?" Logic Explanation */}
          <div
            style={{
              backgroundColor: isLight ? "#eff6ff" : "rgba(30, 58, 138, 0.15)",
              border: `1px solid ${isLight ? "#bfdbfe" : "#3b82f650"}`,
              borderRadius: "8px",
              padding: "0.85rem 1rem",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: isLight ? "#1d4ed8" : "#60a5fa", fontWeight: "800", textTransform: "uppercase", marginBottom: "0.2rem" }}>
              🧠 TẠI SAO LẠI CHỌN LOẠI CÂU ĐIỀU KIỆN NÀY? (WHY THIS TYPE?):
            </div>
            <div style={{ fontSize: "0.875rem", color: isLight ? "#1e293b" : "#e2e8f0", lineHeight: "1.5" }}>
              {currentResult.reason}
            </div>
          </div>

          {/* Example with Audio */}
          <div
            style={{
              backgroundColor: isLight ? "#f8fafc" : "#14141a",
              border: `1px solid ${isLight ? "#e2e8f0" : "#272733"}`,
              borderRadius: "8px",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <div style={{ fontSize: "0.7rem", fontFamily: "Geist Mono", color: isLight ? "#2563eb" : "#38bdf8", fontWeight: "700", textTransform: "uppercase" }}>
                  VÍ DỤ VẬN DỤNG THỰC TẾ:
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: "700", color: isLight ? "#0f172a" : "#fafafa", marginTop: "0.15rem" }}>
                  "{currentResult.example.en}"
                </div>
                <div style={{ fontSize: "0.825rem", color: isLight ? "#475569" : "#a1a1aa", fontStyle: "italic", marginTop: "0.1rem" }}>
                  {currentResult.example.vi}
                </div>
              </div>

              <AudioPlayer text={currentResult.example.en} compact={true} isLight={isLight} />
            </div>

            <div style={{ fontSize: "0.78rem", color: isLight ? "#059669" : "#34d399", borderTop: `1px dashed ${isLight ? "#cbd5e1" : "#2a2a38"}`, paddingTop: "0.45rem" }}>
              🔍 {currentResult.example.breakdown}
            </div>
          </div>

          {/* Common Mistakes */}
          <div style={{ fontSize: "0.78rem", color: isLight ? "#b45309" : "#fbbf24", backgroundColor: isLight ? "#fffbeb" : "rgba(245, 158, 11, 0.1)", border: `1px solid ${isLight ? "#fde68a" : "rgba(245, 158, 11, 0.3)"}`, borderRadius: "6px", padding: "0.6rem 0.85rem" }}>
            ⚠️ <strong>Lỗi kinh điển khi làm bài thi:</strong> {currentResult.common_mistakes}
          </div>
        </div>
      )}
    </div>
  );
}
