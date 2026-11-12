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
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const T = getThemeTokens(isLight);

  const recommendedVis = getVisualizationForLesson(lesson, chapter);

  useEffect(() => {
    setSelectedType(recommendedVis ? recommendedVis.type : null);
    setIsOpen(false);
  }, [lesson?.id, chapter?.number]);

  if (!recommendedVis) {
    return null;
  }

  const activeType = selectedType || recommendedVis.type;
  const currentCatalogItem = VISUALIZATION_CATALOG[activeType] || VISUALIZATION_CATALOG[VISUALIZATION_TYPES.TIMELINE];
  const activeIconPath = VIZ_ICON_MAP[activeType] || VIZ_ICON_MAP.timeline;
  const isSingleTenseFocus = activeType === VISUALIZATION_TYPES.TIMELINE && Boolean(recommendedVis.focusedId && lesson?.title_vi);
  const displayTitle = isSingleTenseFocus
    ? `Sơ đồ dòng thời gian: ${lesson.title_vi}`
    : currentCatalogItem.title;
  const displayDescription = isSingleTenseFocus
    ? `Trực quan hóa vị trí hành động trên trục Quá khứ - Hiện tại - Tương lai và câu ví dụ minh họa cho ${lesson.title_vi}.`
    : currentCatalogItem.description;

  return (
    <div
      style={{
        marginBottom: "1.5rem",
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
          padding: "0.9rem 1.2rem",
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
            <img src={activeIconPath} alt={displayTitle} width={22} height={22} />
          </span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <h3
                style={{
                  fontSize: "0.98rem",
                  fontWeight: "700",
                  color: T.textHeading,
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                {displayTitle}
              </h3>
              <span
                style={{
                  fontSize: "0.68rem",
                  backgroundColor: T.successBg,
                  border: `1px solid ${T.successBorder}`,
                  color: T.success,
                  padding: "0.15rem 0.5rem",
                  borderRadius: "999px",
                  fontWeight: "700",
                }}
              >
                {currentCatalogItem.badge}
              </span>
            </div>
            <p style={{ fontSize: "0.78rem", color: T.textMuted, margin: "0.15rem 0 0 0" }}>
              {displayDescription}
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
              padding: "0.4rem 0.85rem",
              fontSize: "0.78rem",
              fontWeight: "700",
              backgroundColor: isOpen ? T.card : "var(--ds-accent-bg)",
              border: `1px solid ${isOpen ? T.border : T.accentBorder}`,
              borderRadius: "6px",
              color: isOpen ? T.text : T.accent,
              cursor: "pointer",
            }}
          >
            {isOpen ? "▲ Thu gọn sơ đồ" : "▼ Xem sơ đồ trực quan"}
          </button>
        </div>
      </div>

      {/* Main Body */}
      {isOpen && (
        <div
          style={{
            padding: isExpanded ? "1.6rem" : "1.2rem",
            backgroundColor: T.card,
          }}
        >
          <VisualizationRenderer
            type={activeType}
            data={currentCatalogItem.data}
            initialFocusId={recommendedVis.focusedId || null}
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
