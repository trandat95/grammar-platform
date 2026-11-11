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
        backgroundColor: isLight ? "#ffffff" : "#111116",
        border: `1px solid ${isLight ? "#cbd5e1" : "#272733"}`,
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
              color: isLight ? "#0f172a" : "#fafafa",
              margin: 0,
            }}
          >
            🗣️ {data.title}
          </h3>
          <span
            style={{
              fontSize: "0.72rem",
              fontFamily: "Geist Mono",
              backgroundColor: isLight ? "#f0fdf4" : "#064e3b",
              border: `1px solid ${isLight ? "#a7f3d0" : "#059669"}`,
              color: isLight ? "#047857" : "#34d399",
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
            color: isLight ? "#475569" : "#a1a1aa",
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
          borderBottom: `1px solid ${isLight ? "#e2e8f0" : "#272733"}`,
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
            backgroundColor: activeTab === "flow" ? (isLight ? "#2563eb" : "#3b82f6") : "transparent",
            color: activeTab === "flow" ? "#ffffff" : (isLight ? "#334155" : "#a1a1aa"),
            border: `1px solid ${activeTab === "flow" ? "transparent" : (isLight ? "#cbd5e1" : "#272733")}`,
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
            backgroundColor: activeTab === "backshift" ? (isLight ? "#2563eb" : "#3b82f6") : "transparent",
            color: activeTab === "backshift" ? "#ffffff" : (isLight ? "#334155" : "#a1a1aa"),
            border: `1px solid ${activeTab === "backshift" ? "transparent" : (isLight ? "#cbd5e1" : "#272733")}`,
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
            backgroundColor: activeTab === "adverbs" ? (isLight ? "#2563eb" : "#3b82f6") : "transparent",
            color: activeTab === "adverbs" ? "#ffffff" : (isLight ? "#334155" : "#a1a1aa"),
            border: `1px solid ${activeTab === "adverbs" ? "transparent" : (isLight ? "#cbd5e1" : "#272733")}`,
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
            backgroundColor: activeTab === "exceptions" ? (isLight ? "#2563eb" : "#3b82f6") : "transparent",
            color: activeTab === "exceptions" ? "#ffffff" : (isLight ? "#334155" : "#a1a1aa"),
            border: `1px solid ${activeTab === "exceptions" ? "transparent" : (isLight ? "#cbd5e1" : "#272733")}`,
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
                      ? (isLight ? "#eff6ff" : "#1e1b4b")
                      : (isLight ? "#f8fafc" : "#14141c"),
                    border: `1px solid ${
                      isSelected
                        ? (isLight ? "#3b82f6" : "#6366f1")
                        : (isLight ? "#cbd5e1" : "#272733")
                    }`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.68rem",
                      fontFamily: "Geist Mono",
                      fontWeight: "700",
                      color: isSelected ? (isLight ? "#1d4ed8" : "#818cf8") : (isLight ? "#64748b" : "#71717a"),
                    }}
                  >
                    GIAI ĐOẠN {st.stage}
                  </div>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: "700",
                      color: isLight ? "#0f172a" : "#fafafa",
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
                  backgroundColor: isLight ? "#f8fafc" : "#0d0d12",
                  border: `1px solid ${isLight ? "#e2e8f0" : "#272733"}`,
                  borderRadius: "10px",
                  padding: "1.25rem",
                  marginBottom: "1.25rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span
                    style={{
                      backgroundColor: isLight ? "#2563eb" : "#3b82f6",
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
                  <h4 style={{ fontSize: "1rem", fontWeight: "700", color: isLight ? "#0f172a" : "#fafafa", margin: 0 }}>
                    {st.title}
                  </h4>
                </div>

                <p style={{ fontSize: "0.85rem", color: isLight ? "#334155" : "#d4d4d8", lineHeight: "1.6", margin: "0 0 0.85rem 0" }}>
                  {st.detail}
                </p>

                <div
                  style={{
                    backgroundColor: isLight ? "#ffffff" : "#161622",
                    border: `1px solid ${isLight ? "#cbd5e1" : "#272733"}`,
                    borderRadius: "6px",
                    padding: "0.75rem 1rem",
                    fontSize: "0.82rem",
                    fontFamily: "Geist Mono",
                    color: isLight ? "#1d4ed8" : "#93c5fd",
                  }}
                >
                  💡 <strong>Ví dụ mẫu:</strong> {st.example}
                </div>
              </div>
            );
          })()}

          {/* Interactive Examples Walkthrough */}
          <div>
            <div style={{ fontSize: "0.78rem", fontFamily: "Geist Mono", color: isLight ? "#475569" : "#a1a1aa", fontWeight: "700", marginBottom: "0.5rem", textTransform: "uppercase" }}>
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
                    backgroundColor: idx === activeExampleIndex ? (isLight ? "#eff6ff" : "#1e1b4b") : (isLight ? "#f1f5f9" : "#181820"),
                    color: idx === activeExampleIndex ? (isLight ? "#1d4ed8" : "#a5b4fc") : (isLight ? "#334155" : "#a1a1aa"),
                    border: `1px solid ${idx === activeExampleIndex ? (isLight ? "#3b82f6" : "#6366f1") : (isLight ? "#cbd5e1" : "#272733")}`,
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
                  backgroundColor: isLight ? "#ffffff" : "#14141c",
                  border: `1px solid ${isLight ? "#cbd5e1" : "#272733"}`,
                  borderRadius: "10px",
                  padding: "1.25rem",
                }}
              >
                {/* Direct */}
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                    <span style={{ fontSize: "0.72rem", fontFamily: "Geist Mono", color: isLight ? "#b45309" : "#fbbf24", fontWeight: "800", textTransform: "uppercase" }}>
                      Câu Trực Tiếp (Direct Speech)
                    </span>
                    <AudioPlayer text={currentExample.direct} isLight={isLight} compact={true} />
                  </div>
                  <div style={{ fontSize: "0.95rem", fontStyle: "italic", color: isLight ? "#0f172a" : "#fafafa", padding: "0.5rem 0.75rem", backgroundColor: isLight ? "#fffbeb" : "#451a0330", borderRadius: "6px", border: `1px solid ${isLight ? "#fde68a" : "#b4530970"}` }}>
                    "{currentExample.direct}"
                  </div>
                </div>

                <div style={{ textAlign: "center", color: isLight ? "#64748b" : "#71717a", fontSize: "1.2rem", margin: "0.35rem 0" }}>
                  ⇣ Chuyển đổi tường thuật ⇣
                </div>

                {/* Reported */}
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                    <span style={{ fontSize: "0.72rem", fontFamily: "Geist Mono", color: isLight ? "#047857" : "#34d399", fontWeight: "800", textTransform: "uppercase" }}>
                      Câu Gián Tiếp (Reported Speech)
                    </span>
                    <AudioPlayer text={currentExample.reported} isLight={isLight} compact={true} />
                  </div>
                  <div style={{ fontSize: "0.95rem", fontWeight: "600", color: isLight ? "#0f172a" : "#fafafa", padding: "0.5rem 0.75rem", backgroundColor: isLight ? "#f0fdf4" : "#064e3b30", borderRadius: "6px", border: `1px solid ${isLight ? "#bbf7d0" : "#05966970"}` }}>
                    "{currentExample.reported}"
                  </div>
                </div>

                {/* Changes List */}
                <div style={{ fontSize: "0.75rem", fontFamily: "Geist Mono", color: isLight ? "#475569" : "#a1a1aa", fontWeight: "700", marginBottom: "0.45rem" }}>
                  CHI TIẾT CÁC BƯỚC BIẾN ĐỔI:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  {currentExample.changes.map((ch, chIdx) => (
                    <div
                      key={chIdx}
                      style={{
                        fontSize: "0.82rem",
                        color: isLight ? "#334155" : "#cbd5e1",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.45rem",
                      }}
                    >
                      <span style={{ color: isLight ? "#2563eb" : "#38bdf8" }}>✓</span>
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
              backgroundColor: isLight ? "#ffffff" : "#14141c",
              border: `1px solid ${isLight ? "#cbd5e1" : "#272733"}`,
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: isLight ? "#f8fafc" : "#181822" }}>
                <th style={{ padding: "0.75rem 1rem", borderBottom: `1px solid ${isLight ? "#cbd5e1" : "#272733"}`, textAlign: "left", fontSize: "0.8rem", color: isLight ? "#1d4ed8" : "#60a5fa", fontFamily: "Geist Mono" }}>
                  Thì Trực Tiếp (Direct)
                </th>
                <th style={{ padding: "0.75rem 1rem", borderBottom: `1px solid ${isLight ? "#cbd5e1" : "#272733"}`, textAlign: "center", fontSize: "0.8rem", color: isLight ? "#64748b" : "#71717a", fontFamily: "Geist Mono" }}>
                  Biến Đổi
                </th>
                <th style={{ padding: "0.75rem 1rem", borderBottom: `1px solid ${isLight ? "#cbd5e1" : "#272733"}`, textAlign: "left", fontSize: "0.8rem", color: isLight ? "#047857" : "#34d399", fontFamily: "Geist Mono" }}>
                  Lùi Thì Gián Tiếp (Reported)
                </th>
                <th style={{ padding: "0.75rem 1rem", borderBottom: `1px solid ${isLight ? "#cbd5e1" : "#272733"}`, textAlign: "left", fontSize: "0.8rem", color: isLight ? "#334155" : "#e2e8f0", fontFamily: "Geist Mono" }}>
                  Ví dụ trực quan
                </th>
              </tr>
            </thead>
            <tbody>
              {data.backshiftMatrix.map((item, idx) => (
                <tr
                  key={idx}
                  style={{
                    backgroundColor: idx % 2 === 0 ? "transparent" : (isLight ? "#f8fafc" : "#181820"),
                  }}
                >
                  <td style={{ padding: "0.7rem 1rem", borderBottom: `1px solid ${isLight ? "#f1f5f9" : "#1f1f2a"}`, fontSize: "0.85rem", fontWeight: "700", color: isLight ? "#0f172a" : "#fafafa" }}>
                    {item.direct}
                  </td>
                  <td style={{ padding: "0.7rem 1rem", borderBottom: `1px solid ${isLight ? "#f1f5f9" : "#1f1f2a"}`, textAlign: "center", fontSize: "1rem", color: isLight ? "#2563eb" : "#38bdf8" }}>
                    ➔
                  </td>
                  <td style={{ padding: "0.7rem 1rem", borderBottom: `1px solid ${isLight ? "#f1f5f9" : "#1f1f2a"}`, fontSize: "0.85rem", fontWeight: "700", color: isLight ? "#15803d" : "#4ade80" }}>
                    {item.reported}
                  </td>
                  <td style={{ padding: "0.7rem 1rem", borderBottom: `1px solid ${isLight ? "#f1f5f9" : "#1f1f2a"}`, fontSize: "0.8rem", fontFamily: "Geist Mono", color: isLight ? "#475569" : "#a1a1aa" }}>
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
              backgroundColor: isLight ? "#f8fafc" : "#14141c",
              border: `1px solid ${isLight ? "#cbd5e1" : "#272733"}`,
              borderRadius: "8px",
              padding: "1rem",
            }}
          >
            <div style={{ fontSize: "0.85rem", fontWeight: "700", color: isLight ? "#1d4ed8" : "#60a5fa", marginBottom: "0.75rem", fontFamily: "Geist Mono" }}>
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
                    backgroundColor: isLight ? "#ffffff" : "#1a1a24",
                    border: `1px solid ${isLight ? "#e2e8f0" : "#272733"}`,
                    borderRadius: "6px",
                    fontSize: "0.82rem",
                  }}
                >
                  <span style={{ color: isLight ? "#b45309" : "#fbbf24", fontWeight: "600" }}>{adv.direct}</span>
                  <span style={{ color: isLight ? "#64748b" : "#71717a" }}>➔</span>
                  <span style={{ color: isLight ? "#15803d" : "#4ade80", fontWeight: "700" }}>{adv.reported}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Place Adverbs */}
          <div
            style={{
              backgroundColor: isLight ? "#f8fafc" : "#14141c",
              border: `1px solid ${isLight ? "#cbd5e1" : "#272733"}`,
              borderRadius: "8px",
              padding: "1rem",
            }}
          >
            <div style={{ fontSize: "0.85rem", fontWeight: "700", color: isLight ? "#7e22ce" : "#c084fc", marginBottom: "0.75rem", fontFamily: "Geist Mono" }}>
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
                    backgroundColor: isLight ? "#ffffff" : "#1a1a24",
                    border: `1px solid ${isLight ? "#e2e8f0" : "#272733"}`,
                    borderRadius: "6px",
                    fontSize: "0.82rem",
                  }}
                >
                  <span style={{ color: isLight ? "#b45309" : "#fbbf24", fontWeight: "600" }}>{adv.direct}</span>
                  <span style={{ color: isLight ? "#64748b" : "#71717a" }}>➔</span>
                  <span style={{ color: isLight ? "#15803d" : "#4ade80", fontWeight: "700" }}>{adv.reported}</span>
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
                backgroundColor: isLight ? "#fffbeb" : "rgba(245, 158, 11, 0.08)",
                border: isLight ? "1px solid #fde68a" : "1px solid rgba(245, 158, 11, 0.4)",
                borderLeft: "4px solid #f59e0b",
                borderRadius: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.35rem" }}>
                <span style={{ fontSize: "1.1rem" }}>⚠️</span>
                <span style={{ fontSize: "0.85rem", fontWeight: "800", color: isLight ? "#b45309" : "#fbbf24" }}>
                  {exc.rule}
                </span>
              </div>
              <div style={{ fontSize: "0.82rem", color: isLight ? "#78350f" : "#fef3c7", marginBottom: "0.5rem" }}>
                {exc.explanation}
              </div>
              <div
                style={{
                  fontSize: "0.82rem",
                  fontFamily: "Geist Mono",
                  padding: "0.45rem 0.75rem",
                  backgroundColor: isLight ? "#ffffff" : "#14141c",
                  borderRadius: "6px",
                  border: `1px solid ${isLight ? "#fde68a" : "#b45309"}`,
                  color: isLight ? "#0f172a" : "#fafafa",
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
