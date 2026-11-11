import React, { useState, useEffect } from "react";
import VisualizationRenderer from "./VisualizationRenderer";
import VisualizationLegend from "./VisualizationLegend";
import VisualizationControls from "./VisualizationControls";
import {
  getVisualizationForLesson,
  VISUALIZATION_CATALOG,
  VISUALIZATION_TYPES,
} from "../../lib/visualization/visualization.registry";

export default function GrammarVisualization({
  lesson,
  chapter,
  isLight = false,
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  // Auto-detect visualization model when lesson/chapter changes
  useEffect(() => {
    const recommended = getVisualizationForLesson(lesson, chapter);
    if (recommended) {
      setSelectedType(recommended.type);
    }
  }, [lesson?.id, chapter?.number]);

  const recommendedVis = getVisualizationForLesson(lesson, chapter);
  const activeType = selectedType || recommendedVis?.type || VISUALIZATION_TYPES.TIMELINE;
  const currentCatalogItem = VISUALIZATION_CATALOG[activeType] || VISUALIZATION_CATALOG[VISUALIZATION_TYPES.TIMELINE];

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
            {currentCatalogItem.icon}
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
                {currentCatalogItem.title}
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
                {currentCatalogItem.badge}
              </span>
            </div>
            <p style={{ fontSize: "0.78rem", color: isLight ? "#475569" : "#a1a1aa", margin: "0.15rem 0 0 0" }}>
              {currentCatalogItem.description}
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

      {/* Visualizer Catalog Switcher Bar (All 8 Engines) */}
      {isOpen && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.6rem 1.25rem",
            backgroundColor: isLight ? "#f1f5f9" : "#181822",
            borderBottom: `1px solid ${isLight ? "#e2e8f0" : "#272733"}`,
            overflowX: "auto",
          }}
        >
          <span style={{ fontSize: "0.7rem", fontWeight: "700", color: isLight ? "#64748b" : "#94a3b8", textTransform: "uppercase", whiteSpace: "nowrap", marginRight: "0.25rem" }}>
            Mô hình ({Object.keys(VISUALIZATION_CATALOG).length}):
          </span>

          {Object.values(VISUALIZATION_CATALOG).map((item) => {
            const isCurrent = activeType === item.type;
            const isRecommended = recommendedVis?.type === item.type;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedType(item.type)}
                title={item.description}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  padding: "0.25rem 0.55rem",
                  borderRadius: "6px",
                  fontSize: "0.72rem",
                  fontFamily: "Geist Mono",
                  fontWeight: isCurrent ? "800" : "500",
                  backgroundColor: isCurrent ? (isLight ? "#2563eb" : "#3b82f6") : (isLight ? "#ffffff" : "#111116"),
                  color: isCurrent ? "#ffffff" : (isLight ? "#334155" : "#cbd5e1"),
                  border: isCurrent ? "1px solid #2563eb" : `1px solid ${isLight ? "#cbd5e1" : "#2d2d3f"}`,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <span>{item.icon}</span>
                <span>{item.badge}</span>
                {isRecommended && !isCurrent && (
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10b981" }} title="Gợi ý cho bài học này" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Body */}
      {isOpen && (
        <div
          style={{
            padding: isExpanded ? "1.75rem" : "1.25rem",
            backgroundColor: isLight ? "#ffffff" : "#0d0d12",
          }}
        >
          <VisualizationRenderer
            type={activeType}
            data={currentCatalogItem.data}
            isLight={isLight}
          />
          <VisualizationLegend
            type={activeType}
            isLight={isLight}
          />
        </div>
      )}
    </div>
  );
}
