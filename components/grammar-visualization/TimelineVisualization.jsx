import React, { useState, useEffect } from "react";
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
  const [showAllTenses, setShowAllTenses] = useState(!initialFocusId);

  useEffect(() => {
    if (initialFocusId && tenses.some((t) => t.id === initialFocusId)) {
      setSelectedTenseId(initialFocusId);
      setActiveFilter("ALL");
      setAspectFilter("ALL");
      setShowAllTenses(false);
    } else if (!initialFocusId) {
      setShowAllTenses(true);
    }
  }, [initialFocusId]);

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
        className="ge-timeline-graphic"
        style={{
          position: "relative",
          width: "100%",
          height: "112px",
          backgroundColor: "var(--ds-bg-elevated)",
          border: `1px solid ${"var(--ds-border)"}`,
          borderRadius: "10px",
          padding: "0.5rem 0.75rem",
          overflow: "hidden",
        }}
      >
        {/* Top Band: Reference Node Labels + Guide Ticks (Strictly separated from Axis Line) */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "6%",
            right: "6%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            zIndex: 2,
            pointerEvents: "none",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "54px" }}>
            <span style={{ fontSize: "0.64rem", fontFamily: "var(--font-sans)", color: "var(--ds-warning)", fontWeight: "700", whiteSpace: "nowrap" }}>
              QUÁ KHỨ
            </span>
            <span style={{ width: "2px", height: "8px", backgroundColor: "var(--ds-warning)", opacity: 0.55, marginTop: "3px", borderRadius: "1px" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "82px" }}>
            <span style={{ fontSize: "0.64rem", fontFamily: "var(--font-sans)", color: "var(--ds-success)", fontWeight: "800", whiteSpace: "nowrap" }}>
              HIỆN TẠI (NOW)
            </span>
            <span style={{ width: "2px", height: "8px", backgroundColor: "var(--ds-success)", opacity: 0.7, marginTop: "3px", borderRadius: "1px" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "58px" }}>
            <span style={{ fontSize: "0.64rem", fontFamily: "var(--font-sans)", color: "var(--ds-accent)", fontWeight: "700", whiteSpace: "nowrap" }}>
              TƯƠNG LAI
            </span>
            <span style={{ width: "2px", height: "8px", backgroundColor: "var(--ds-accent)", opacity: 0.55, marginTop: "3px", borderRadius: "1px" }} />
          </div>
        </div>

        {/* Middle Band: Horizontal Axis Line & Reference Dots */}
        <div
          style={{
            position: "absolute",
            left: "11%",
            right: "11%",
            top: "52%",
            height: "3px",
            backgroundColor: "var(--ds-border-strong)",
            transform: "translateY(-50%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "11%",
            top: "52%",
            transform: "translate(-50%, -50%)",
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: "var(--ds-warning)",
            zIndex: 2,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "52%",
            transform: "translate(-50%, -50%)",
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            backgroundColor: "var(--ds-btn-success)",
            border: "2px solid var(--ds-card)",
            boxShadow: "0 0 8px rgba(16, 185, 129, 0.6)",
            zIndex: 2,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "89%",
            top: "52%",
            transform: "translate(-50%, -50%)",
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: "var(--ds-accent)",
            zIndex: 2,
          }}
        />

        {/* Dynamic Action Span / Marker on Axis + Clean Non-Overlapping Lower Pill */}
        {tense.timeline.type === "point" && (
          <div
            style={{
              position: "absolute",
              top: "52%",
              left: isPast ? "26%" : isPresent ? "50%" : "74%",
              transform: "translate(-50%, -50%)",
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              backgroundColor: isPast ? "var(--ds-warning)" : isPresent ? "var(--ds-success)" : "var(--ds-accent)",
              border: "3px solid var(--ds-card)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              zIndex: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.65rem",
              color: "var(--ds-text-on-accent)",
              fontWeight: "800",
            }}
            title="Thời điểm diễn ra hành động đơn"
          >
            ★
          </div>
        )}

        {tense.timeline.type === "continuous_range" && (
          <>
            <div
              style={{
                position: "absolute",
                top: "52%",
                left: isPast ? "18%" : isPresent ? "38%" : "58%",
                width: "24%",
                height: "10px",
                transform: "translateY(-50%)",
                backgroundColor: isLight ? "rgba(16, 185, 129, 0.35)" : "rgba(16, 185, 129, 0.45)",
                border: "2px dashed var(--ds-success)",
                borderRadius: "999px",
                zIndex: 3,
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "8px",
                left: isPast ? "30%" : isPresent ? "50%" : "70%",
                transform: "translateX(-50%)",
                padding: "2px 9px",
                borderRadius: "999px",
                backgroundColor: isLight ? "rgba(16, 185, 129, 0.14)" : "rgba(16, 185, 129, 0.22)",
                border: "1px solid var(--ds-success)",
                fontSize: "0.64rem",
                fontFamily: "var(--font-sans)",
                color: "var(--ds-success)",
                fontWeight: "800",
                whiteSpace: "nowrap",
                zIndex: 4,
              }}
            >
              〰️ đang diễn ra
            </div>
          </>
        )}

        {tense.timeline.type === "continuing_to" && (
          <>
            <div
              style={{
                position: "absolute",
                top: "52%",
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
            <div
              style={{
                position: "absolute",
                bottom: "8px",
                left: "36%",
                transform: "translateX(-50%)",
                padding: "2px 8px",
                borderRadius: "999px",
                backgroundColor: isLight ? "rgba(16, 185, 129, 0.12)" : "rgba(16, 185, 129, 0.18)",
                border: "1px solid var(--ds-success)",
                fontSize: "0.6rem",
                fontFamily: "var(--font-sans)",
                color: "var(--ds-success)",
                fontWeight: "700",
                whiteSpace: "nowrap",
                zIndex: 4,
              }}
            >
              ↗ kéo dài tới hiện tại
            </div>
          </>
        )}

        {tense.timeline.type === "completed_before" && (
          <>
            <div
              style={{
                position: "absolute",
                top: "52%",
                left: isPast ? "14%" : "60%",
                width: "18%",
                height: "10px",
                transform: "translateY(-50%)",
                backgroundColor: isLight ? "var(--ds-purple-bg)" : "rgba(99, 102, 241, 0.4)",
                border: "2px solid var(--ds-accent)",
                borderRadius: "4px",
                zIndex: 3,
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "8px",
                left: isPast ? "23%" : "69%",
                transform: "translateX(-50%)",
                padding: "2px 8px",
                borderRadius: "999px",
                backgroundColor: isLight ? "var(--ds-purple-bg)" : "rgba(99, 102, 241, 0.22)",
                border: "1px solid var(--ds-accent)",
                fontSize: "0.6rem",
                fontFamily: "var(--font-sans)",
                color: "var(--ds-accent)",
                fontWeight: "800",
                whiteSpace: "nowrap",
                zIndex: 4,
              }}
            >
              ✓ hoàn tất trước
            </div>
          </>
        )}

        {tense.timeline.type === "habitual" && (
          <div
            style={{
              position: "absolute",
              top: "52%",
              left: "16%",
              right: "16%",
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
                  border: "1px solid var(--ds-card)",
                }}
                title="Thói quen / Sự thật lặp đi lặp lại"
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
      {/* 1. Focused Interactive Timeline Display (Rendered FIRST when focused on a tense lesson) */}
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
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
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
              <div style={{ fontSize: "0.7rem", color: "var(--ds-accent)", fontWeight: "700", textTransform: "uppercase" }}>
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

      {/* 2. Optional 13-Tense Explorer & Side-by-Side Comparison Toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
        <button
          type="button"
          onClick={() => setShowAllTenses((prev) => !prev)}
          className="ds-focusable"
          style={{
            padding: "0.35rem 0.75rem",
            fontSize: "0.76rem",
            fontWeight: "700",
            borderRadius: "6px",
            backgroundColor: showAllTenses ? "var(--ds-accent-bg)" : "var(--ds-bg-elevated)",
            color: showAllTenses ? "var(--ds-accent)" : "var(--ds-text-secondary)",
            border: `1px solid ${showAllTenses ? "var(--ds-accent-border)" : "var(--ds-border)"}`,
            cursor: "pointer",
          }}
        >
          {showAllTenses ? "▲ Ẩn danh sách 13 thì" : "⚖️ So sánh hoặc xem toàn bộ 13 thì ▾"}
        </button>

        {showAllTenses && (
          <button
            type="button"
            onClick={() => setCompareMode(!compareMode)}
            className="ds-focusable"
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
        )}
      </div>

      {showAllTenses && (
        <>
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
                type="button"
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
                    <span style={{ fontSize: "0.68rem", fontWeight: "700", color: aspectMeta.text }}>
                      {aspectMeta.label}
                    </span>
                    {isSelected && (
                      <span style={{ fontSize: "0.65rem", backgroundColor: "var(--ds-btn-primary)", color: "var(--ds-text-on-accent)", padding: "0.1rem 0.35rem", borderRadius: "999px", fontWeight: "700" }}>
                        ĐANG XEM
                      </span>
                    )}
                    {isComparing && (
                      <span style={{ fontSize: "0.65rem", backgroundColor: "var(--ds-btn-warning)", color: "var(--ds-text-on-accent)", padding: "0.1rem 0.35rem", borderRadius: "999px", fontWeight: "700" }}>
                        SO SÁNH
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--ds-text-heading)", lineHeight: "1.3" }}>
                    {t.name_vi}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--ds-text-muted)", marginTop: "0.15rem" }}>
                    {t.name_en}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 3. Compare Side-by-Side Panel (If Active) */}
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
              <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-sans)", color: "var(--ds-success)", marginBottom: "0.3rem" }}>{selectedTense.formula}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--ds-text-secondary)", lineHeight: "1.4" }}>{selectedTense.usage}</div>
            </div>

            <div style={{ backgroundColor: "var(--ds-card)", padding: "0.85rem", borderRadius: "8px", border: `1px solid ${"var(--ds-warning-border)"}` }}>
              <div style={{ fontWeight: "700", color: "var(--ds-warning)", fontSize: "0.85rem", marginBottom: "0.3rem" }}>{compareTense.name_vi}</div>
              <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-sans)", color: "var(--ds-success)", marginBottom: "0.3rem" }}>{compareTense.formula}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--ds-text-secondary)", lineHeight: "1.4" }}>{compareTense.usage}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
