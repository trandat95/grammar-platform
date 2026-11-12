import React, { useState } from "react";
import AudioPlayer from "../audio/AudioPlayer";
import { getAspectColor, getTimeSphereInfo } from "../../lib/visualization/visualization.utils";

export default function TimelineVisualization({ data, initialFocusId = null, isLight = false }) {
  const tenses = data?.tenses || [];

  const [selectedTenseId, setSelectedTenseId] = useState(
    initialFocusId && tenses.some((t) => t.id === initialFocusId)
      ? initialFocusId
      : tenses[0]?.id || ""
  );

  const [activeFilter, setActiveFilter] = useState("ALL"); // 'ALL' | 'present' | 'past' | 'future'
  const [aspectFilter, setAspectFilter] = useState("ALL"); // 'ALL' | 'simple' | 'continuous' | 'perfect' | 'perfect_continuous'
  const [compareMode, setCompareMode] = useState(false);
  const [compareTenseId, setCompareTenseId] = useState("TENSE_PAST_SIMPLE");

  const selectedTense = tenses.find((t) => t.id === selectedTenseId) || tenses[0];
  const compareTense = tenses.find((t) => t.id === compareTenseId) || tenses[4];

  const filteredTenses = tenses.filter((t) => {
    const matchSphere = activeFilter === "ALL" || t.time_sphere === activeFilter;
    const matchAspect = aspectFilter === "ALL" || t.aspect === aspectFilter;
    return matchSphere && matchAspect;
  });

  const renderTimelineGraphic = (tense) => {
    const isPast = tense.time_sphere === "past";
    const isPresent = tense.time_sphere === "present";
    const isFuture = tense.time_sphere === "future";
    const isContinuous = tense.aspect.includes("continuous");
    const isPerfect = tense.aspect.includes("perfect");

    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "80px",
          backgroundColor: "var(--ds-bg-elevated)",
          border: `1px solid ${"var(--ds-border)"}`,
          borderRadius: "8px",
          padding: "0.5rem 1rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* Horizontal Axis Line */}
        <div
          style={{
            position: "absolute",
            left: "10%",
            right: "10%",
            top: "50%",
            height: "3px",
            backgroundColor: "var(--ds-border-strong)",
            transform: "translateY(-50%)",
          }}
        />

        {/* 3 Core Time Nodes: Past, Present (Now), Future */}
        <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 10%" }}>
          {/* Past Reference Node */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2 }}>
            <span style={{ fontSize: "0.65rem", fontFamily: "Geist Mono", color: "var(--ds-warning)", fontWeight: "700" }}>QUÁ KHỨ</span>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "var(--ds-warning)", marginTop: "2px" }} />
          </div>

          {/* Present (Now) Reference Node */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2 }}>
            <span style={{ fontSize: "0.65rem", fontFamily: "Geist Mono", color: "var(--ds-success)", fontWeight: "800" }}>HIỆN TẠI (NOW)</span>
            <div style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: "var(--ds-btn-success)", border: "2px solid #ffffff", marginTop: "2px", boxShadow: "0 0 8px rgba(16, 185, 129, 0.6)" }} />
          </div>

          {/* Future Reference Node */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2 }}>
            <span style={{ fontSize: "0.65rem", fontFamily: "Geist Mono", color: "var(--ds-accent)", fontWeight: "700" }}>TƯƠNG LAI</span>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "var(--ds-accent)", marginTop: "2px" }} />
          </div>

          {/* Dynamic Action Span / Marker */}
          {tense.timeline.type === "point" && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: isPast ? "25%" : isPresent ? "50%" : "75%",
                transform: "translate(-50%, -50%)",
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                backgroundColor: isPast ? "var(--ds-warning)" : isPresent ? "var(--ds-success)" : "var(--ds-accent)",
                border: "3px solid #ffffff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                zIndex: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.65rem",
                color: "#ffffff",
                fontWeight: "800",
              }}
              title="Thời điểm diễn ra hành động đơn"
            >
              ★
            </div>
          )}

          {tense.timeline.type === "continuous_range" && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: isPast ? "20%" : isPresent ? "42%" : "68%",
                width: isPast ? "22%" : isPresent ? "18%" : "22%",
                height: "14px",
                transform: "translateY(-50%)",
                backgroundColor: isLight ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.5)",
                border: "2px dashed var(--ds-success)",
                borderRadius: "999px",
                zIndex: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.6rem",
                fontFamily: "Geist Mono",
                color: "var(--ds-success)",
                fontWeight: "700",
              }}
            >
              〰️ đang diễn ra
            </div>
          )}

          {tense.timeline.type === "continuing_to" && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "22%",
                width: "28%",
                height: "8px",
                transform: "translateY(-50%)",
                background: "linear-gradient(90deg, var(--ds-warning) 0%, var(--ds-success) 100%)",
                borderRadius: "999px",
                zIndex: 3,
                boxShadow: "0 0 6px rgba(16, 185, 129, 0.5)",
              }}
              title="Bắt đầu trong quá khứ kéo dài chạm mốc Hiện tại"
            />
          )}

          {tense.timeline.type === "completed_before" && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: isPast ? "14%" : "60%",
                width: "16%",
                height: "10px",
                transform: "translateY(-50%)",
                backgroundColor: isLight ? "var(--ds-purple-bg)" : "rgba(99, 102, 241, 0.4)",
                border: "2px solid var(--ds-accent)",
                borderRadius: "4px",
                zIndex: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.55rem",
                color: "var(--ds-accent-border)",
                fontWeight: "700",
              }}
            >
              ✓ hoàn tất trước
            </div>
          )}

          {tense.timeline.type === "habitual" && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "15%",
                right: "15%",
                height: "2px",
                transform: "translateY(-50%)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                zIndex: 3,
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((pt) => (
                <div
                  key={pt}
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "var(--ds-btn-success)",
                    border: "1px solid #ffffff",
                  }}
                  title="Thói quen / Sự thật lặp đi lặp lại"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* 1. Header Toolbar: Filters & Compare Toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
        {/* Time Sphere Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--ds-text-muted)", fontWeight: "700" }}>Thời gian:</span>
          {[
            { id: "ALL", label: "Tất cả (13)" },
            { id: "present", label: "🟢 Hiện tại (4)" },
            { id: "past", label: "🟡 Quá khứ (4)" },
            { id: "future", label: "🔵 Tương lai (5)" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              style={{
                padding: "0.25rem 0.6rem",
                fontSize: "0.72rem",
                fontWeight: activeFilter === f.id ? "700" : "500",
                borderRadius: "6px",
                backgroundColor: activeFilter === f.id ? "var(--ds-accent-bg)" : "var(--ds-card)",
                color: activeFilter === f.id ? "var(--ds-accent)" : "var(--ds-text-muted)",
                border: `1px solid ${activeFilter === f.id ? "var(--ds-accent-border)" : "var(--ds-border)"}`,
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Aspect Filters & Compare Mode */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            onClick={() => setCompareMode(!compareMode)}
            style={{
              padding: "0.3rem 0.75rem",
              fontSize: "0.75rem",
              fontWeight: "700",
              borderRadius: "6px",
              backgroundColor: compareMode ? "var(--ds-warning-bg)" : "var(--ds-card)",
              color: compareMode ? "var(--ds-warning)" : "var(--ds-text-muted)",
              border: `1px solid ${compareMode ? "var(--ds-warning-border)" : "var(--ds-border)"}`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            <span>⚖️</span>
            <span>{compareMode ? "Tắt So Sánh" : "So Sánh 2 Thì"}</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Tense Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "0.6rem",
        }}
      >
        {filteredTenses.map((t) => {
          const isSelected = t.id === selectedTenseId;
          const isComparing = compareMode && t.id === compareTenseId;
          const aspectMeta = getAspectColor(t.aspect, isLight);

          return (
            <div
              key={t.id}
              onClick={() => {
                if (compareMode && t.id !== selectedTenseId) {
                  setCompareTenseId(t.id);
                } else {
                  setSelectedTenseId(t.id);
                }
              }}
              style={{
                backgroundColor: isSelected
                  ? (isLight ? "var(--ds-accent-bg)" : "rgba(30, 58, 138, 0.25)")
                  : isComparing
                  ? (isLight ? "var(--ds-warning-bg)" : "rgba(120, 53, 15, 0.25)")
                  : "var(--ds-card)",
                border: `1px solid ${
                  isSelected
                    ? "var(--ds-accent)"
                    : isComparing
                    ? "var(--ds-warning)"
                    : "var(--ds-card-border)"
                }`,
                borderRadius: "8px",
                padding: "0.65rem 0.85rem",
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: isSelected ? "0 2px 8px rgba(59, 130, 246, 0.15)" : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "0.68rem", fontFamily: "Geist Mono", fontWeight: "700", color: aspectMeta.text }}>
                  {aspectMeta.label}
                </span>
                {isSelected && (
                  <span style={{ fontSize: "0.65rem", backgroundColor: "var(--ds-btn-primary)", color: "#ffffff", padding: "0.1rem 0.35rem", borderRadius: "999px", fontWeight: "700" }}>
                    ĐANG XEM
                  </span>
                )}
                {isComparing && (
                  <span style={{ fontSize: "0.65rem", backgroundColor: "var(--ds-btn-warning)", color: "#ffffff", padding: "0.1rem 0.35rem", borderRadius: "999px", fontWeight: "700" }}>
                    SO SÁNH
                  </span>
                )}
              </div>
              <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--ds-text-heading)", lineHeight: "1.3" }}>
                {t.name_vi}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--ds-text-muted)", fontFamily: "Geist Mono", marginTop: "0.15rem" }}>
                {t.name_en}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Focused Interactive Timeline Display */}
      <div
        style={{
          backgroundColor: "var(--ds-card)",
          border: `1px solid ${"var(--ds-border)"}`,
          borderRadius: "12px",
          padding: "1.25rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.1rem" }}>⏱️</span>
              <h4 style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--ds-text-heading)", margin: 0 }}>
                {selectedTense.name_vi} ({selectedTense.name_en})
              </h4>
            </div>
            <div style={{ fontSize: "0.825rem", color: "var(--ds-text-secondary)", marginTop: "0.25rem" }}>
              {selectedTense.usage}
            </div>
          </div>

          {/* Formula Badge */}
          <div
            style={{
              padding: "0.35rem 0.75rem",
              backgroundColor: "var(--ds-bg-elevated)",
              border: `1px solid ${"var(--ds-border)"}`,
              borderRadius: "6px",
              fontFamily: "Geist Mono",
              fontSize: "0.825rem",
              fontWeight: "700",
              color: "var(--ds-success)",
            }}
          >
            {selectedTense.formula}
          </div>
        </div>

        {/* Visual Axis Graphic */}
        {renderTimelineGraphic(selectedTense)}

        {/* Example Sentence with Audio Player */}
        <div
          style={{
            backgroundColor: "var(--ds-bg-elevated)",
            border: `1px solid ${"var(--ds-card-border)"}`,
            borderRadius: "8px",
            padding: "0.85rem 1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <div style={{ fontSize: "0.7rem", fontFamily: "Geist Mono", color: "var(--ds-accent)", fontWeight: "700", textTransform: "uppercase" }}>
                VÍ DỤ TRỰC QUAN:
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--ds-text-heading)", marginTop: "0.15rem" }}>
                "{selectedTense.example.en}"
              </div>
              <div style={{ fontSize: "0.825rem", color: "var(--ds-text-muted)", fontStyle: "italic", marginTop: "0.1rem" }}>
                {selectedTense.example.vi}
              </div>
            </div>

            {/* Audio Player Button */}
            <AudioPlayer text={selectedTense.example.en} compact={true} isLight={isLight} />
          </div>

          <div style={{ fontSize: "0.75rem", color: "var(--ds-success)", borderTop: `1px dashed ${"var(--ds-card-border)"}`, paddingTop: "0.4rem" }}>
            💡 <strong>Phân tích ngữ pháp:</strong> {selectedTense.example.breakdown}
          </div>
        </div>

        {/* Common Mistakes Callout */}
        <div style={{ fontSize: "0.78rem", color: "var(--ds-warning)", backgroundColor: isLight ? "var(--ds-warning-bg)" : "rgba(245, 158, 11, 0.1)", border: `1px solid ${isLight ? "var(--ds-warning-border)" : "rgba(245, 158, 11, 0.3)"}`, borderRadius: "6px", padding: "0.5rem 0.75rem" }}>
          ⚠️ <strong>Lỗi người học hay gặp:</strong> {selectedTense.common_mistakes}
        </div>
      </div>

      {/* 4. Compare Side-by-Side Panel (If Active) */}
      {compareMode && (
        <div
          style={{
            backgroundColor: "var(--ds-warning-bg)",
            border: `2px solid ${"var(--ds-warning-border)"}`,
            borderRadius: "12px",
            padding: "1.25rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.85rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 style={{ fontSize: "0.95rem", fontWeight: "800", color: "var(--ds-warning)", margin: 0 }}>
              ⚖️ Đối So Sánh: {selectedTense.name_vi} VS {compareTense.name_vi}
            </h4>
            <span style={{ fontSize: "0.75rem", color: "var(--ds-warning)" }}>
              Bấm chọn thẻ bất kỳ để đổi đối tượng so sánh
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ backgroundColor: "var(--ds-card)", padding: "0.85rem", borderRadius: "8px", border: `1px solid ${"var(--ds-warning-border)"}` }}>
              <div style={{ fontWeight: "700", color: "var(--ds-accent)", fontSize: "0.85rem", marginBottom: "0.3rem" }}>{selectedTense.name_vi}</div>
              <div style={{ fontSize: "0.75rem", fontFamily: "Geist Mono", color: "var(--ds-success)", marginBottom: "0.3rem" }}>{selectedTense.formula}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--ds-text-secondary)", lineHeight: "1.4" }}>{selectedTense.usage}</div>
            </div>

            <div style={{ backgroundColor: "var(--ds-card)", padding: "0.85rem", borderRadius: "8px", border: `1px solid ${"var(--ds-warning-border)"}` }}>
              <div style={{ fontWeight: "700", color: "var(--ds-warning)", fontSize: "0.85rem", marginBottom: "0.3rem" }}>{compareTense.name_vi}</div>
              <div style={{ fontSize: "0.75rem", fontFamily: "Geist Mono", color: "var(--ds-success)", marginBottom: "0.3rem" }}>{compareTense.formula}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--ds-text-secondary)", lineHeight: "1.4" }}>{compareTense.usage}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
