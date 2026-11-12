import React, { useState, useEffect } from "react";
import VisualizationRenderer from "./VisualizationRenderer";
import VisualizationLegend from "./VisualizationLegend";
import VisualizationControls from "./VisualizationControls";
import { getThemeTokens } from "../../lib/tokens/design-tokens";
import { VIZ_ICON_MAP } from "../ui-2026/assetMap";
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
  const T = getThemeTokens(isLight);

  useEffect(() => {
    const recommended = getVisualizationForLesson(lesson, chapter);
    if (recommended) {
      setSelectedType(recommended.type);
    }
  }, [lesson?.id, chapter?.number]);

  const recommendedVis = getVisualizationForLesson(lesson, chapter);
  const activeType = selectedType || recommendedVis?.type || VISUALIZATION_TYPES.TIMELINE;
  const currentCatalogItem = VISUALIZATION_CATALOG[activeType] || VISUALIZATION_CATALOG[VISUALIZATION_TYPES.TIMELINE];
  const activeIconPath = VIZ_ICON_MAP[activeType] || VIZ_ICON_MAP.timeline;

  return (
    <div
      style={{
        marginBottom: "1.75rem",
        backgroundColor: T.card,
        border: `1px solid ${T.cardBorder}`,
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: T.shadow,
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
          backgroundColor: T.bgSub,
          borderBottom: isOpen ? `1px solid ${T.borderSubtle}` : "none",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: T.accentBg,
              border: `1px solid ${T.accentBorder}`,
              padding: "0.4rem",
              borderRadius: "8px",
            }}
          >
            <img src={activeIconPath} alt={currentCatalogItem.title} width={22} height={22} />
          </span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: "700",
                  color: T.textHeading,
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                {currentCatalogItem.title}
              </h3>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontFamily: "var(--font-mono, Geist Mono, monospace)",
                  backgroundColor: T.successBg,
                  border: `1px solid ${T.successBorder}`,
                  color: T.success,
                  padding: "0.15rem 0.5rem",
                  borderRadius: "999px",
                  fontWeight: "800",
                  textTransform: "uppercase",
                }}
              >
                {currentCatalogItem.badge}
              </span>
            </div>
            <p style={{ fontSize: "0.78rem", color: T.textMuted, margin: "0.15rem 0 0 0" }}>
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
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="ds-focusable"
            style={{
              padding: "0.35rem 0.75rem",
              fontSize: "0.75rem",
              fontFamily: "var(--font-mono, Geist Mono, monospace)",
              fontWeight: "700",
              backgroundColor: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: "6px",
              color: T.text,
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
            backgroundColor: T.bgElevated,
            borderBottom: `1px solid ${T.borderSubtle}`,
            overflowX: "auto",
          }}
        >
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: "700",
              color: T.textMuted,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              marginRight: "0.25rem",
            }}
          >
            Mô hình ({Object.keys(VISUALIZATION_CATALOG).length}):
          </span>

          {Object.values(VISUALIZATION_CATALOG).map((item) => {
            const isCurrent = activeType === item.type;
            const isRecommended = recommendedVis?.type === item.type;
            const iconSrc = VIZ_ICON_MAP[item.type] || VIZ_ICON_MAP.timeline;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedType(item.type)}
                title={item.description}
                className="ds-focusable"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.28rem 0.6rem",
                  borderRadius: "6px",
                  fontSize: "0.72rem",
                  fontFamily: "var(--font-mono, Geist Mono, monospace)",
                  fontWeight: isCurrent ? "800" : "500",
                  backgroundColor: isCurrent ? "var(--ds-btn-primary)" : T.card,
                  color: isCurrent ? "#ffffff" : T.textSecondary,
                  border: isCurrent ? "1px solid var(--ds-btn-primary)" : `1px solid ${T.border}`,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <img
                  src={iconSrc}
                  alt=""
                  width={14}
                  height={14}
                  aria-hidden="true"
                  style={{ filter: isCurrent ? "brightness(0) invert(1)" : "none" }}
                />
                <span>{item.badge}</span>
                {isRecommended && !isCurrent && (
                  <span
                    style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: T.success }}
                    title="Gợi ý cho bài học này"
                  />
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
            backgroundColor: T.card,
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
