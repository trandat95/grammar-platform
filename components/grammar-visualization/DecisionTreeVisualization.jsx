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
              backgroundColor: "var(--ds-bg-elevated)",
              color: "var(--ds-text-heading)",
              border: `1px solid ${"var(--ds-border)"}`,
              cursor: "pointer",
            }}
          >
            🌳 Bắt đầu lại
          </button>

          {history.map((step, idx) => (
            <React.Fragment key={idx}>
              <span style={{ fontSize: "0.75rem", color: "var(--ds-border-strong)" }}>→</span>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontFamily: "Geist Mono",
                  backgroundColor: isLight ? "var(--ds-accent-bg)" : "rgba(59, 130, 246, 0.15)",
                  color: "var(--ds-accent)",
                  padding: "0.15rem 0.45rem",
                  borderRadius: "4px",
                  border: `1px solid ${"var(--ds-accent-border)"}`,
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
          <span style={{ fontSize: "0.7rem", color: "var(--ds-text-muted)", fontWeight: "600" }}>Xem nhanh:</span>
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
                backgroundColor: currentNodeId === item.key ? "var(--ds-success-bg)" : "var(--ds-card)",
                color: currentNodeId === item.key ? "var(--ds-success)" : "var(--ds-text-muted)",
                border: `1px solid ${currentNodeId === item.key ? "var(--ds-success-border)" : "var(--ds-border)"}`,
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
            backgroundColor: "var(--ds-card)",
            border: `1px solid ${"var(--ds-border)"}`,
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
              <span style={{ fontSize: "0.75rem", fontFamily: "Geist Mono", backgroundColor: "var(--ds-accent-bg)", color: "var(--ds-accent)", padding: "0.15rem 0.45rem", borderRadius: "4px", fontWeight: "700" }}>
                BƯỚC {history.length + 1} CỦA CÂY QUYẾT ĐỊNH
              </span>
            </div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--ds-text-heading)", margin: 0, lineHeight: "1.4" }}>
              {currentNode.question}
            </h3>
            <p style={{ fontSize: "0.825rem", color: "var(--ds-text-muted)", fontStyle: "italic", margin: "0.3rem 0 0 0" }}>
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
                  backgroundColor: opt.highlight ? (isLight ? "var(--ds-success-bg)" : "rgba(16, 185, 129, 0.1)") : "var(--ds-bg-elevated)",
                  border: `1px solid ${opt.highlight ? "var(--ds-success-border)" : "var(--ds-border)"}`,
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
                <span style={{ fontSize: "0.875rem", fontWeight: "700", color: opt.highlight ? "var(--ds-success)" : "var(--ds-text-heading)" }}>
                  {opt.label}
                </span>
                <span style={{ fontSize: "1rem", color: "var(--ds-success)" }}>➔</span>
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
                  border: `1px solid ${"var(--ds-border)"}`,
                  borderRadius: "6px",
                  color: "var(--ds-text-muted)",
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
            backgroundColor: "var(--ds-card)",
            border: `2px solid ${"var(--ds-success-border)"}`,
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
              <span style={{ fontSize: "0.72rem", fontFamily: "Geist Mono", backgroundColor: isLight ? "var(--ds-success-bg)" : "rgba(16, 185, 129, 0.2)", color: "var(--ds-success)", padding: "0.15rem 0.5rem", borderRadius: "999px", fontWeight: "700" }}>
                KẾT QUẢ ĐÃ XÁC ĐỊNH
              </span>
              <h3 style={{ fontSize: "1.35rem", fontWeight: "800", color: "var(--ds-text-heading)", margin: "0.35rem 0 0 0" }}>
                {currentResult.name_vi}
              </h3>
              <div style={{ fontSize: "0.85rem", color: "var(--ds-text-muted)", fontFamily: "Geist Mono" }}>
                {currentResult.name_en}
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={handleBack}
                style={{
                  padding: "0.4rem 0.85rem",
                  backgroundColor: "var(--ds-bg-elevated)",
                  border: `1px solid ${"var(--ds-border)"}`,
                  borderRadius: "6px",
                  color: "var(--ds-text-secondary)",
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
                  backgroundColor: "var(--ds-btn-success)",
                  border: "none",
                  borderRadius: "6px",
                  color: "#ffffff",
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
              backgroundColor: "var(--ds-bg-elevated)",
              border: `1px solid ${"var(--ds-border)"}`,
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
              <div style={{ fontSize: "0.7rem", fontFamily: "Geist Mono", color: "var(--ds-success)", fontWeight: "700", textTransform: "uppercase" }}>
                CÔNG THỨC CHUẨN XÁC:
              </div>
              <div style={{ fontSize: "1.05rem", fontFamily: "Geist Mono", fontWeight: "800", color: "var(--ds-text-heading)", marginTop: "0.2rem" }}>
                {currentResult.formula}
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", borderRadius: "4px", backgroundColor: "var(--ds-accent-bg)", color: "var(--ds-accent)", fontWeight: "600" }}>
                Mệnh đề If: {currentResult.if_tense}
              </span>
              <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", borderRadius: "4px", backgroundColor: "var(--ds-success-bg)", color: "var(--ds-success)", fontWeight: "600" }}>
                Mệnh đề chính: {currentResult.main_tense}
              </span>
            </div>
          </div>

          {/* "Why this answer?" Logic Explanation */}
          <div
            style={{
              backgroundColor: isLight ? "var(--ds-accent-bg)" : "rgba(30, 58, 138, 0.15)",
              border: `1px solid ${"var(--ds-accent-border)"}`,
              borderRadius: "8px",
              padding: "0.85rem 1rem",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "var(--ds-accent)", fontWeight: "800", textTransform: "uppercase", marginBottom: "0.2rem" }}>
              🧠 TẠI SAO LẠI CHỌN LOẠI CÂU ĐIỀU KIỆN NÀY? (WHY THIS TYPE?):
            </div>
            <div style={{ fontSize: "0.875rem", color: "var(--ds-text-heading)", lineHeight: "1.5" }}>
              {currentResult.reason}
            </div>
          </div>

          {/* Example with Audio */}
          <div
            style={{
              backgroundColor: "var(--ds-bg-elevated)",
              border: `1px solid ${"var(--ds-card-border)"}`,
              borderRadius: "8px",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <div style={{ fontSize: "0.7rem", fontFamily: "Geist Mono", color: "var(--ds-accent)", fontWeight: "700", textTransform: "uppercase" }}>
                  VÍ DỤ VẬN DỤNG THỰC TẾ:
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--ds-text-heading)", marginTop: "0.15rem" }}>
                  "{currentResult.example.en}"
                </div>
                <div style={{ fontSize: "0.825rem", color: "var(--ds-text-muted)", fontStyle: "italic", marginTop: "0.1rem" }}>
                  {currentResult.example.vi}
                </div>
              </div>

              <AudioPlayer text={currentResult.example.en} compact={true} isLight={isLight} />
            </div>

            <div style={{ fontSize: "0.78rem", color: "var(--ds-success)", borderTop: `1px dashed ${"var(--ds-border)"}`, paddingTop: "0.45rem" }}>
              🔍 {currentResult.example.breakdown}
            </div>
          </div>

          {/* Common Mistakes */}
          <div style={{ fontSize: "0.78rem", color: "var(--ds-warning)", backgroundColor: isLight ? "var(--ds-warning-bg)" : "rgba(245, 158, 11, 0.1)", border: `1px solid ${isLight ? "var(--ds-warning-border)" : "rgba(245, 158, 11, 0.3)"}`, borderRadius: "6px", padding: "0.6rem 0.85rem" }}>
            ⚠️ <strong>Lỗi kinh điển khi làm bài thi:</strong> {currentResult.common_mistakes}
          </div>
        </div>
      )}
    </div>
  );
}
