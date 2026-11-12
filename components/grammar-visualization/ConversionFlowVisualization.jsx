import React, { useState } from "react";
import AudioPlayer from "../audio/AudioPlayer";

export default function ConversionFlowVisualization({ data, isLight = false }) {
  const [activeTab, setActiveTab] = useState("flow"); // "flow" | "backshift" | "adverbs" | "exceptions"
  const [activeStage, setActiveStage] = useState(1);
  const [activeExampleIndex, setActiveExampleIndex] = useState(0);

  if (!data) return null;

  const currentExample = data.examples?.[activeExampleIndex] || data.examples?.[0];

  return (
    <div
      style={{
        backgroundColor: "var(--ds-card)",
        border: `1px solid ${"var(--ds-border)"}`,
        borderRadius: "12px",
        padding: "1.5rem",
        boxShadow: isLight ? "0 2px 10px rgba(0,0,0,0.04)" : "0 8px 24px rgba(0,0,0,0.4)",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
          <h3
            style={{
              fontSize: "1.15rem",
              fontWeight: "700",
              color: "var(--ds-text-heading)",
              margin: 0,
            }}
          >
            🗣️ {data.title}
          </h3>
          <span
            style={{
              fontSize: "0.72rem",
              fontFamily: "var(--font-sans)",
              backgroundColor: "var(--ds-success-bg)",
              border: `1px solid ${"var(--ds-success-border)"}`,
              color: "var(--ds-success)",
              padding: "0.2rem 0.6rem",
              borderRadius: "999px",
              fontWeight: "700",
            }}
          >
            Conversion Pipeline Engine
          </span>
        </div>
        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--ds-text-muted)",
            margin: "0.35rem 0 0 0",
            lineHeight: "1.5",
          }}
        >
          {data.description}
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.45rem",
          borderBottom: `1px solid ${"var(--ds-card-border)"}`,
          paddingBottom: "0.75rem",
          marginBottom: "1.25rem",
          overflowX: "auto",
        }}
      >
        <button
          onClick={() => setActiveTab("flow")}
          style={{
            padding: "0.45rem 0.85rem",
            fontSize: "0.82rem",
            fontWeight: activeTab === "flow" ? "700" : "500",
            backgroundColor: activeTab === "flow" ? "var(--ds-btn-primary)" : "transparent",
            color: activeTab === "flow" ? "#ffffff" : "var(--ds-text-secondary)",
            border: `1px solid ${activeTab === "flow" ? "transparent" : "var(--ds-border)"}`,
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          🚀 7 Giai Đoạn Chuyển Đổi
        </button>

        <button
          onClick={() => setActiveTab("backshift")}
          style={{
            padding: "0.45rem 0.85rem",
            fontSize: "0.82rem",
            fontWeight: activeTab === "backshift" ? "700" : "500",
            backgroundColor: activeTab === "backshift" ? "var(--ds-btn-primary)" : "transparent",
            color: activeTab === "backshift" ? "#ffffff" : "var(--ds-text-secondary)",
            border: `1px solid ${activeTab === "backshift" ? "transparent" : "var(--ds-border)"}`,
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          ⏱️ Ma Trận Lùi Thì (Backshift)
        </button>

        <button
          onClick={() => setActiveTab("adverbs")}
          style={{
            padding: "0.45rem 0.85rem",
            fontSize: "0.82rem",
            fontWeight: activeTab === "adverbs" ? "700" : "500",
            backgroundColor: activeTab === "adverbs" ? "var(--ds-btn-primary)" : "transparent",
            color: activeTab === "adverbs" ? "#ffffff" : "var(--ds-text-secondary)",
            border: `1px solid ${activeTab === "adverbs" ? "transparent" : "var(--ds-border)"}`,
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          📍 Trạng Từ Thời Gian & Nơi Chốn
        </button>

        <button
          onClick={() => setActiveTab("exceptions")}
          style={{
            padding: "0.45rem 0.85rem",
            fontSize: "0.82rem",
            fontWeight: activeTab === "exceptions" ? "700" : "500",
            backgroundColor: activeTab === "exceptions" ? "var(--ds-btn-primary)" : "transparent",
            color: activeTab === "exceptions" ? "#ffffff" : "var(--ds-text-secondary)",
            border: `1px solid ${activeTab === "exceptions" ? "transparent" : "var(--ds-border)"}`,
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          ⚠️ Bẫy & Trường Hợp Không Lùi Thì
        </button>
      </div>

      {/* Tab 1: Flow Stepper */}
      {activeTab === "flow" && (
        <div>
          {/* Stage pills */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))",
              gap: "0.5rem",
              marginBottom: "1.25rem",
            }}
          >
            {data.stages.map((st) => {
              const isSelected = activeStage === st.stage;
              return (
                <button
                  key={st.stage}
                  onClick={() => setActiveStage(st.stage)}
                  style={{
                    padding: "0.6rem 0.75rem",
                    textAlign: "left",
                    backgroundColor: isSelected
                      ? "var(--ds-accent-bg)"
                      : "var(--ds-bg-elevated)",
                    border: `1px solid ${
                      isSelected
                        ? "var(--ds-accent)"
                        : "var(--ds-border)"
                    }`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.68rem",
                      fontFamily: "var(--font-sans)",
                      fontWeight: "700",
                      color: isSelected ? "var(--ds-accent)" : "var(--ds-text-muted)",
                    }}
                  >
                    GIAI ĐOẠN {st.stage}
                  </div>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: "700",
                      color: "var(--ds-text-heading)",
                      marginTop: "0.15rem",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {st.title}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Stage Detail */}
          {(() => {
            const st = data.stages.find((s) => s.stage === activeStage) || data.stages[0];
            return (
              <div
                style={{
                  backgroundColor: "var(--ds-bg-elevated)",
                  border: `1px solid ${"var(--ds-card-border)"}`,
                  borderRadius: "10px",
                  padding: "1.25rem",
                  marginBottom: "1.25rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span
                    style={{
                      backgroundColor: "var(--ds-btn-primary)",
                      color: "#ffffff",
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: "800",
                    }}
                  >
                    {st.stage}
                  </span>
                  <h4 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--ds-text-heading)", margin: 0 }}>
                    {st.title}
                  </h4>
                </div>

                <p style={{ fontSize: "0.85rem", color: "var(--ds-text-secondary)", lineHeight: "1.6", margin: "0 0 0.85rem 0" }}>
                  {st.detail}
                </p>

                <div
                  style={{
                    backgroundColor: "var(--ds-card)",
                    border: `1px solid ${"var(--ds-border)"}`,
                    borderRadius: "6px",
                    padding: "0.75rem 1rem",
                    fontSize: "0.82rem",
                    fontFamily: "var(--font-sans)",
                    color: "var(--ds-accent)",
                  }}
                >
                  💡 <strong>Ví dụ mẫu:</strong> {st.example}
                </div>
              </div>
            );
          })()}

          {/* Interactive Examples Walkthrough */}
          <div>
            <div style={{ fontSize: "0.78rem", fontFamily: "var(--font-sans)", color: "var(--ds-text-muted)", fontWeight: "700", marginBottom: "0.5rem", textTransform: "uppercase" }}>
              Các dạng câu tường thuật thường gặp:
            </div>
            <div style={{ display: "flex", gap: "0.45rem", marginBottom: "0.85rem", flexWrap: "wrap" }}>
              {data.examples.map((ex, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveExampleIndex(idx)}
                  style={{
                    padding: "0.4rem 0.75rem",
                    fontSize: "0.78rem",
                    fontWeight: idx === activeExampleIndex ? "700" : "500",
                    backgroundColor: idx === activeExampleIndex ? "var(--ds-accent-bg)" : "var(--ds-bg-elevated)",
                    color: idx === activeExampleIndex ? "var(--ds-accent)" : "var(--ds-text-secondary)",
                    border: `1px solid ${idx === activeExampleIndex ? "var(--ds-accent)" : "var(--ds-border)"}`,
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  {ex.type}
                </button>
              ))}
            </div>

            {currentExample && (
              <div
                style={{
                  backgroundColor: "var(--ds-card)",
                  border: `1px solid ${"var(--ds-border)"}`,
                  borderRadius: "10px",
                  padding: "1.25rem",
                }}
              >
                {/* Direct */}
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                    <span style={{ fontSize: "0.72rem", fontFamily: "var(--font-sans)", color: "var(--ds-warning)", fontWeight: "800", textTransform: "uppercase" }}>
                      Câu Trực Tiếp (Direct Speech)
                    </span>
                    <AudioPlayer text={currentExample.direct} isLight={isLight} compact={true} />
                  </div>
                  <div style={{ fontSize: "0.95rem", fontStyle: "italic", color: "var(--ds-text-heading)", padding: "0.5rem 0.75rem", backgroundColor: "var(--ds-warning-bg)", borderRadius: "6px", border: `1px solid ${"var(--ds-warning-border)"}` }}>
                    "{currentExample.direct}"
                  </div>
                </div>

                <div style={{ textAlign: "center", color: "var(--ds-text-muted)", fontSize: "1.2rem", margin: "0.35rem 0" }}>
                  ⇣ Chuyển đổi tường thuật ⇣
                </div>

                {/* Reported */}
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                    <span style={{ fontSize: "0.72rem", fontFamily: "var(--font-sans)", color: "var(--ds-success)", fontWeight: "800", textTransform: "uppercase" }}>
                      Câu Gián Tiếp (Reported Speech)
                    </span>
                    <AudioPlayer text={currentExample.reported} isLight={isLight} compact={true} />
                  </div>
                  <div style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--ds-text-heading)", padding: "0.5rem 0.75rem", backgroundColor: "var(--ds-success-bg)", borderRadius: "6px", border: `1px solid ${"var(--ds-success-border)"}` }}>
                    "{currentExample.reported}"
                  </div>
                </div>

                {/* Changes List */}
                <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-sans)", color: "var(--ds-text-muted)", fontWeight: "700", marginBottom: "0.45rem" }}>
                  CHI TIẾT CÁC BƯỚC BIẾN ĐỔI:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  {currentExample.changes.map((ch, chIdx) => (
                    <div
                      key={chIdx}
                      style={{
                        fontSize: "0.82rem",
                        color: "var(--ds-text-secondary)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.45rem",
                      }}
                    >
                      <span style={{ color: "var(--ds-accent)" }}>✓</span>
                      <span>{ch}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Backshift Matrix */}
      {activeTab === "backshift" && (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              backgroundColor: "var(--ds-card)",
              border: `1px solid ${"var(--ds-border)"}`,
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "var(--ds-bg-elevated)" }}>
                <th style={{ padding: "0.75rem 1rem", borderBottom: `1px solid ${"var(--ds-border)"}`, textAlign: "left", fontSize: "0.8rem", color: "var(--ds-accent)", fontFamily: "var(--font-sans)" }}>
                  Thì Trực Tiếp (Direct)
                </th>
                <th style={{ padding: "0.75rem 1rem", borderBottom: `1px solid ${"var(--ds-border)"}`, textAlign: "center", fontSize: "0.8rem", color: "var(--ds-text-muted)", fontFamily: "var(--font-sans)" }}>
                  Biến Đổi
                </th>
                <th style={{ padding: "0.75rem 1rem", borderBottom: `1px solid ${"var(--ds-border)"}`, textAlign: "left", fontSize: "0.8rem", color: "var(--ds-success)", fontFamily: "var(--font-sans)" }}>
                  Lùi Thì Gián Tiếp (Reported)
                </th>
                <th style={{ padding: "0.75rem 1rem", borderBottom: `1px solid ${"var(--ds-border)"}`, textAlign: "left", fontSize: "0.8rem", color: "var(--ds-text-secondary)", fontFamily: "var(--font-sans)" }}>
                  Ví dụ trực quan
                </th>
              </tr>
            </thead>
            <tbody>
              {data.backshiftMatrix.map((item, idx) => (
                <tr
                  key={idx}
                  style={{
                    backgroundColor: idx % 2 === 0 ? "transparent" : "var(--ds-bg-elevated)",
                  }}
                >
                  <td style={{ padding: "0.7rem 1rem", borderBottom: `1px solid ${"var(--ds-bg-elevated)"}`, fontSize: "0.85rem", fontWeight: "700", color: "var(--ds-text-heading)" }}>
                    {item.direct}
                  </td>
                  <td style={{ padding: "0.7rem 1rem", borderBottom: `1px solid ${"var(--ds-bg-elevated)"}`, textAlign: "center", fontSize: "1rem", color: "var(--ds-accent)" }}>
                    ➔
                  </td>
                  <td style={{ padding: "0.7rem 1rem", borderBottom: `1px solid ${"var(--ds-bg-elevated)"}`, fontSize: "0.85rem", fontWeight: "700", color: "var(--ds-success)" }}>
                    {item.reported}
                  </td>
                  <td style={{ padding: "0.7rem 1rem", borderBottom: `1px solid ${"var(--ds-bg-elevated)"}`, fontSize: "0.8rem", fontFamily: "var(--font-sans)", color: "var(--ds-text-muted)" }}>
                    {item.example}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Adverbs */}
      {activeTab === "adverbs" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          {/* Time Adverbs */}
          <div
            style={{
              backgroundColor: "var(--ds-bg-elevated)",
              border: `1px solid ${"var(--ds-border)"}`,
              borderRadius: "8px",
              padding: "1rem",
            }}
          >
            <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--ds-accent)", marginBottom: "0.75rem", fontFamily: "var(--font-sans)" }}>
              ⏳ Trạng từ thời gian (Time)
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
              {data.adverbChanges.time.map((adv, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.45rem 0.65rem",
                    backgroundColor: "var(--ds-card)",
                    border: `1px solid ${"var(--ds-card-border)"}`,
                    borderRadius: "6px",
                    fontSize: "0.82rem",
                  }}
                >
                  <span style={{ color: "var(--ds-warning)", fontWeight: "600" }}>{adv.direct}</span>
                  <span style={{ color: "var(--ds-text-muted)" }}>➔</span>
                  <span style={{ color: "var(--ds-success)", fontWeight: "700" }}>{adv.reported}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Place Adverbs */}
          <div
            style={{
              backgroundColor: "var(--ds-bg-elevated)",
              border: `1px solid ${"var(--ds-border)"}`,
              borderRadius: "8px",
              padding: "1rem",
            }}
          >
            <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--ds-purple)", marginBottom: "0.75rem", fontFamily: "var(--font-sans)" }}>
              📍 Trạng từ nơi chốn / Đại từ chỉ định
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
              {data.adverbChanges.place.map((adv, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.45rem 0.65rem",
                    backgroundColor: "var(--ds-card)",
                    border: `1px solid ${"var(--ds-card-border)"}`,
                    borderRadius: "6px",
                    fontSize: "0.82rem",
                  }}
                >
                  <span style={{ color: "var(--ds-warning)", fontWeight: "600" }}>{adv.direct}</span>
                  <span style={{ color: "var(--ds-text-muted)" }}>➔</span>
                  <span style={{ color: "var(--ds-success)", fontWeight: "700" }}>{adv.reported}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Exceptions */}
      {activeTab === "exceptions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {data.exceptions.map((exc, idx) => (
            <div
              key={idx}
              style={{
                padding: "1rem 1.25rem",
                backgroundColor: isLight ? "var(--ds-warning-bg)" : "rgba(245, 158, 11, 0.08)",
                border: isLight ? "1px solid var(--ds-warning-border)" : "1px solid rgba(245, 158, 11, 0.4)",
                borderLeft: "4px solid var(--ds-warning)",
                borderRadius: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.35rem" }}>
                <span style={{ fontSize: "1.1rem" }}>⚠️</span>
                <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "var(--ds-warning)" }}>
                  {exc.rule}
                </span>
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--ds-warning)", marginBottom: "0.5rem" }}>
                {exc.explanation}
              </div>
              <div
                style={{
                  fontSize: "0.82rem",
                  fontFamily: "var(--font-sans)",
                  padding: "0.45rem 0.75rem",
                  backgroundColor: "var(--ds-card)",
                  borderRadius: "6px",
                  border: `1px solid ${"var(--ds-warning-border)"}`,
                  color: "var(--ds-text-heading)",
                }}
              >
                📝 Ví dụ: {exc.example}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
