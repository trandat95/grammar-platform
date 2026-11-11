import React, { useState } from "react";
import VisualizationRenderer from "./VisualizationRenderer";
import VisualizationLegend from "./VisualizationLegend";
import VisualizationControls from "./VisualizationControls";
import { getVisualizationForLesson } from "../../lib/visualization/visualization.registry";

export default function GrammarVisualization({
  lesson,
  chapter,
  isLight = false,
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const vis = getVisualizationForLesson(lesson, chapter);
  if (!vis) return null;

  return (
    <div
      style={{
        marginBottom: "1.75rem",
        backgroundColor: isLight ? "#ffffff" : "#111116",
        border: `1px solid ${isLight ? "#cbd5e1" : "#272733"}`,
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: isLight ? "0 4px 12px rgba(0, 0, 0, 0.05)" : "0 8px 30px rgba(0, 0, 0, 0.4)",
        transition: "all 0.2s ease",
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 1.25rem",
          backgroundColor: isLight ? "#f8fafc" : "#14141c",
          borderBottom: isOpen ? `1px solid ${isLight ? "#e2e8f0" : "#272733"}` : "none",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <span
            style={{
              fontSize: "1.2rem",
              backgroundColor: isLight ? "#eff6ff" : "#1e1b4b",
              border: `1px solid ${isLight ? "#bfdbfe" : "#3b82f6"}`,
              padding: "0.25rem 0.5rem",
              borderRadius: "8px",
            }}
          >
            {vis.type === "timeline" ? "⏱️" : vis.type === "decision-tree" ? "🌳" : vis.type === "transformation" ? "🔄" : "💬"}
          </span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: "700",
                  color: isLight ? "#0f172a" : "#fafafa",
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                Mô Hình Trực Quan Hóa Sư Phạm & Âm Thanh (Milestone 2.7)
              </h3>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontFamily: "Geist Mono",
                  backgroundColor: isLight ? "#ecfdf5" : "#064e3b",
                  border: `1px solid ${isLight ? "#a7f3d0" : "#059669"}`,
                  color: isLight ? "#047857" : "#34d399",
                  padding: "0.15rem 0.5rem",
                  borderRadius: "999px",
                  fontWeight: "800",
                  textTransform: "uppercase",
                }}
              >
                Interactive Engine
              </span>
            </div>
            <p style={{ fontSize: "0.78rem", color: isLight ? "#475569" : "#a1a1aa", margin: "0.15rem 0 0 0" }}>
              {vis.type === "timeline" && "Trục thời gian 13 thì, so sánh trực quan điểm & khoảng thời gian ngữ pháp."}
              {vis.type === "decision-tree" && "Cây quyết định logic lựa chọn câu điều kiện Zero / 1 / 2 / 3 / Mixed."}
              {vis.type === "transformation" && "Quy trình chuyển đổi câu chủ động sang bị động với phát âm bản ngữ."}
              {vis.type === "conversion-flow" && "7 giai đoạn chuyển đổi câu gián tiếp, ma trận lùi thì và bảng trạng từ."}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {isOpen && (
            <VisualizationControls
              isExpanded={isExpanded}
              onToggleExpand={() => setIsExpanded(!isExpanded)}
              isLight={isLight}
            />
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              padding: "0.35rem 0.75rem",
              fontSize: "0.75rem",
              fontFamily: "Geist Mono",
              fontWeight: "700",
              backgroundColor: isLight ? "#ffffff" : "#1c1c26",
              border: `1px solid ${isLight ? "#cbd5e1" : "#2d2d3f"}`,
              borderRadius: "6px",
              color: isLight ? "#0f172a" : "#fafafa",
              cursor: "pointer",
            }}
          >
            {isOpen ? "▲ Thu gọn" : "▼ Mở trực quan hóa"}
          </button>
        </div>
      </div>

      {/* Main Body */}
      {isOpen && (
        <div
          style={{
            padding: isExpanded ? "1.75rem" : "1.25rem",
            backgroundColor: isLight ? "#ffffff" : "#0d0d12",
          }}
        >
          <VisualizationRenderer
            type={vis.type}
            data={vis.data}
            isLight={isLight}
          />
          <VisualizationLegend
            type={vis.type}
            isLight={isLight}
          />
        </div>
      )}
    </div>
  );
}
