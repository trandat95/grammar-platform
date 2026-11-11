import React, { useState } from "react";
import AudioPlayer from "../audio/AudioPlayer";

export default function TransformationDiagram({ data, isLight = false }) {
  const [activeTenseIndex, setActiveTenseIndex] = useState(0);
  const [activeStep, setActiveStep] = useState(null);
  const [showAgentRules, setShowAgentRules] = useState(false);

  if (!data) return null;

  const currentExample = data.tensesExamples?.[activeTenseIndex] || data.tensesExamples?.[0];

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
      {/* Title & Description */}
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
            🔄 {data.title}
          </h3>
          <span
            style={{
              fontSize: "0.72rem",
              fontFamily: "Geist Mono",
              backgroundColor: isLight ? "#eff6ff" : "#1e1b4b",
              border: `1px solid ${isLight ? "#bfdbfe" : "#4338ca"}`,
              color: isLight ? "#1d4ed8" : "#a5b4fc",
              padding: "0.2rem 0.6rem",
              borderRadius: "999px",
              fontWeight: "700",
            }}
          >
            Active ➔ Passive Engine
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

      {/* 5-Step Progress Indicators */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "0.5rem",
          }}
        >
          {data.steps.map((st, idx) => {
            const isSelected = activeStep === st.step;
            return (
              <button
                key={idx}
                onClick={() => setActiveStep(isSelected ? null : st.step)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.55rem 0.75rem",
                  backgroundColor: isSelected
                    ? (isLight ? "#eff6ff" : "#1e1b4b")
                    : (isLight ? "#f8fafc" : "#181820"),
                  border: `1px solid ${
                    isSelected
                      ? (isLight ? "#3b82f6" : "#6366f1")
                      : (isLight ? "#e2e8f0" : "#272733")
                  }`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontSize: "1rem" }}>{st.icon}</span>
                <div style={{ overflow: "hidden" }}>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      fontFamily: "Geist Mono",
                      fontWeight: "700",
                      color: isSelected
                        ? (isLight ? "#1d4ed8" : "#818cf8")
                        : (isLight ? "#64748b" : "#71717a"),
                    }}
                  >
                    BƯỚC {st.step}
                  </div>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: "600",
                      color: isLight ? "#1e293b" : "#e4e4e7",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {st.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Step Detail Callout */}
        {activeStep && (
          <div
            style={{
              marginTop: "0.75rem",
              padding: "0.85rem 1.15rem",
              backgroundColor: isLight ? "#f0fdf4" : "rgba(16, 185, 129, 0.1)",
              border: `1px solid ${isLight ? "#bbf7d0" : "rgba(16, 185, 129, 0.3)"}`,
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <span style={{ fontSize: "1.25rem" }}>
              {data.steps.find((s) => s.step === activeStep)?.icon}
            </span>
            <div>
              <strong style={{ fontSize: "0.85rem", color: isLight ? "#166534" : "#34d399" }}>
                Bước {activeStep}: {data.steps.find((s) => s.step === activeStep)?.title}
              </strong>
              <div style={{ fontSize: "0.82rem", color: isLight ? "#15803d" : "#a7f3d0", marginTop: "0.15rem" }}>
                {data.steps.find((s) => s.step === activeStep)?.instruction}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tense Switcher Tabs */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "0.75rem", fontFamily: "Geist Mono", color: isLight ? "#475569" : "#a1a1aa", fontWeight: "700", marginBottom: "0.45rem", textTransform: "uppercase" }}>
          Chọn thì ngữ pháp để trực quan hoá:
        </div>
        <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
          {data.tensesExamples.map((ex, idx) => {
            const isActive = idx === activeTenseIndex;
            return (
              <button
                key={idx}
                onClick={() => setActiveTenseIndex(idx)}
                style={{
                  padding: "0.4rem 0.8rem",
                  fontSize: "0.8rem",
                  fontWeight: isActive ? "700" : "500",
                  backgroundColor: isActive
                    ? (isLight ? "#2563eb" : "#3b82f6")
                    : (isLight ? "#f1f5f9" : "#181822"),
                  color: isActive ? "#ffffff" : (isLight ? "#334155" : "#a1a1aa"),
                  border: `1px solid ${isActive ? "transparent" : (isLight ? "#cbd5e1" : "#2d2d3d")}`,
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {ex.tense_name.split("(")[0].trim()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active vs Passive Interactive Shift Visualizer */}
      {currentExample && (
        <div
          style={{
            backgroundColor: isLight ? "#f8fafc" : "#0d0d12",
            border: `1px solid ${isLight ? "#e2e8f0" : "#272733"}`,
            borderRadius: "10px",
            padding: "1.25rem",
            marginBottom: "1.25rem",
          }}
        >
          {/* Header of Active vs Passive */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.95rem", fontWeight: "700", color: isLight ? "#0f172a" : "#fafafa" }}>
              {currentExample.tense_name}
            </span>
            <span
              style={{
                fontSize: "0.8rem",
                fontFamily: "Geist Mono",
                fontWeight: "700",
                backgroundColor: isLight ? "#fef3c7" : "#451a03",
                border: `1px solid ${isLight ? "#fde68a" : "#b45309"}`,
                color: isLight ? "#92400e" : "#fbbf24",
                padding: "0.2rem 0.6rem",
                borderRadius: "4px",
              }}
            >
              CÔNG THỨC BE: {currentExample.be_formula}
            </span>
          </div>

          {/* Active Sentence Breakdown Box */}
          <div
            style={{
              backgroundColor: isLight ? "#ffffff" : "#14141c",
              border: `1px solid ${isLight ? "#cbd5e1" : "#2d2d3f"}`,
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
              <span style={{ fontSize: "0.72rem", fontFamily: "Geist Mono", fontWeight: "800", color: isLight ? "#2563eb" : "#38bdf8", textTransform: "uppercase" }}>
                1. Câu Chủ Động (Active Voice)
              </span>
              <AudioPlayer text={currentExample.active.full} isLight={isLight} compact={true} />
            </div>

            {/* S - V - O Badges */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
              <div style={{ backgroundColor: isLight ? "#eff6ff" : "rgba(37, 99, 235, 0.15)", border: `1px solid ${isLight ? "#bfdbfe" : "#3b82f6"}`, padding: "0.3rem 0.6rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.68rem", fontFamily: "Geist Mono", color: isLight ? "#1d4ed8" : "#93c5fd", fontWeight: "700" }}>CHỦ NGỮ (S): </span>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: isLight ? "#0f172a" : "#fafafa" }}>{currentExample.active.subject}</span>
              </div>
              <div style={{ backgroundColor: isLight ? "#fffbeb" : "rgba(245, 158, 11, 0.15)", border: `1px solid ${isLight ? "#fde68a" : "#f59e0b"}`, padding: "0.3rem 0.6rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.68rem", fontFamily: "Geist Mono", color: isLight ? "#b45309" : "#fcd34d", fontWeight: "700" }}>ĐỘNG TỪ (V): </span>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: isLight ? "#0f172a" : "#fafafa" }}>{currentExample.active.verb}</span>
              </div>
              <div style={{ backgroundColor: isLight ? "#f0fdf4" : "rgba(16, 185, 129, 0.15)", border: `1px solid ${isLight ? "#bbf7d0" : "#10b981"}`, padding: "0.3rem 0.6rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.68rem", fontFamily: "Geist Mono", color: isLight ? "#15803d" : "#86efac", fontWeight: "700" }}>TÂN NGỮ (O): </span>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: isLight ? "#0f172a" : "#fafafa" }}>{currentExample.active.object}</span>
              </div>
            </div>

            <div style={{ fontSize: "0.92rem", fontStyle: "italic", color: isLight ? "#1e293b" : "#f4f4f5" }}>
              "{currentExample.active.full}"
            </div>
          </div>

          {/* Transformation Transition Arrows Visualizer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              padding: "0.5rem 0",
              color: isLight ? "#64748b" : "#71717a",
              fontSize: "0.8rem",
              fontFamily: "Geist Mono",
              fontWeight: "700",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span>Tân ngữ (O) ➔ Chủ ngữ mới (S)</span>
              <span style={{ fontSize: "1.2rem", color: isLight ? "#16a34a" : "#4ade80" }}>⇣</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span>Verb ➔ BE + V3</span>
              <span style={{ fontSize: "1.2rem", color: isLight ? "#d97706" : "#fbbf24" }}>⇣</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span>Chủ ngữ (S) ➔ By + Agent</span>
              <span style={{ fontSize: "1.2rem", color: isLight ? "#2563eb" : "#60a5fa" }}>⇣</span>
            </div>
          </div>

          {/* Passive Sentence Breakdown Box */}
          <div
            style={{
              backgroundColor: isLight ? "#ffffff" : "#14141c",
              border: `2px solid ${isLight ? "#22c55e" : "#16a34a"}`,
              borderRadius: "8px",
              padding: "1rem",
              marginTop: "0.5rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
              <span style={{ fontSize: "0.72rem", fontFamily: "Geist Mono", fontWeight: "800", color: isLight ? "#16a34a" : "#4ade80", textTransform: "uppercase" }}>
                2. Câu Bị Động (Passive Voice Result)
              </span>
              <AudioPlayer text={currentExample.passive.full} isLight={isLight} compact={true} />
            </div>

            {/* S(new) - BE - V3 - By Agent */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
              <div style={{ backgroundColor: isLight ? "#f0fdf4" : "rgba(16, 185, 129, 0.2)", border: `1px solid ${isLight ? "#bbf7d0" : "#10b981"}`, padding: "0.3rem 0.6rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.68rem", fontFamily: "Geist Mono", color: isLight ? "#15803d" : "#86efac", fontWeight: "700" }}>CHỦ NGỮ MỚI: </span>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: isLight ? "#0f172a" : "#fafafa" }}>{currentExample.passive.subject}</span>
              </div>
              <div style={{ backgroundColor: isLight ? "#fef3c7" : "rgba(245, 158, 11, 0.2)", border: `1px solid ${isLight ? "#fde68a" : "#f59e0b"}`, padding: "0.3rem 0.6rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.68rem", fontFamily: "Geist Mono", color: isLight ? "#92400e" : "#fcd34d", fontWeight: "700" }}>TO BE: </span>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: isLight ? "#0f172a" : "#fafafa" }}>{currentExample.passive.be_verb}</span>
              </div>
              <div style={{ backgroundColor: isLight ? "#eff6ff" : "rgba(59, 130, 246, 0.2)", border: `1px solid ${isLight ? "#bfdbfe" : "#3b82f6"}`, padding: "0.3rem 0.6rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.68rem", fontFamily: "Geist Mono", color: isLight ? "#1d4ed8" : "#93c5fd", fontWeight: "700" }}>V3/V-ED: </span>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: isLight ? "#0f172a" : "#fafafa" }}>{currentExample.passive.past_participle}</span>
              </div>
              <div style={{ backgroundColor: isLight ? "#faf5ff" : "rgba(168, 85, 247, 0.2)", border: `1px solid ${isLight ? "#e9d5ff" : "#a855f7"}`, padding: "0.3rem 0.6rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.68rem", fontFamily: "Geist Mono", color: isLight ? "#6b21a8" : "#d8b4fe", fontWeight: "700" }}>TÁC NHÂN: </span>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: isLight ? "#0f172a" : "#fafafa" }}>{currentExample.passive.agent}</span>
              </div>
            </div>

            <div style={{ fontSize: "0.95rem", fontWeight: "600", color: isLight ? "#0f172a" : "#fafafa", lineHeight: "1.5" }}>
              "{currentExample.passive.full}"
            </div>

            {/* Pedagogical Note / Explanation */}
            <div
              style={{
                marginTop: "0.75rem",
                padding: "0.65rem 0.85rem",
                backgroundColor: isLight ? "#f8fafc" : "#1a1a24",
                borderLeft: `3px solid ${isLight ? "#2563eb" : "#3b82f6"}`,
                borderRadius: "4px",
                fontSize: "0.82rem",
                color: isLight ? "#334155" : "#cbd5e1",
              }}
            >
              💡 <strong>Phân tích sư phạm:</strong> {currentExample.explanation}
            </div>
          </div>
        </div>
      )}

      {/* Agent Omission Rules Accordion */}
      <div style={{ marginTop: "1rem" }}>
        <button
          onClick={() => setShowAgentRules(!showAgentRules)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "0.75rem 1rem",
            backgroundColor: isLight ? "#f8fafc" : "#181820",
            border: `1px solid ${isLight ? "#cbd5e1" : "#272733"}`,
            borderRadius: "8px",
            cursor: "pointer",
            color: isLight ? "#0f172a" : "#fafafa",
            fontSize: "0.85rem",
            fontWeight: "700",
          }}
        >
          <span>📋 Quy tắc lược bỏ "By + Agent" trong đề thi tiếng Anh</span>
          <span>{showAgentRules ? "▲ Thu gọn" : "▼ Xem chi tiết"}</span>
        </button>

        {showAgentRules && data.agentRules && (
          <div
            style={{
              marginTop: "0.5rem",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "0.75rem",
            }}
          >
            {data.agentRules.map((rule, rIdx) => (
              <div
                key={rIdx}
                style={{
                  padding: "0.85rem 1rem",
                  backgroundColor: isLight ? "#ffffff" : "#14141c",
                  border: `1px solid ${
                    rule.rule.includes("Bắt buộc giữ")
                      ? (isLight ? "#bfdbfe" : "#3b82f6")
                      : (isLight ? "#fde68a" : "#d97706")
                  }`,
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: "800",
                    color: rule.rule.includes("Bắt buộc giữ")
                      ? (isLight ? "#1d4ed8" : "#60a5fa")
                      : (isLight ? "#b45309" : "#fbbf24"),
                    marginBottom: "0.35rem",
                  }}
                >
                  {rule.rule}
                </div>
                <div style={{ fontSize: "0.8rem", color: isLight ? "#475569" : "#a1a1aa", marginBottom: "0.45rem" }}>
                  {rule.examples}
                </div>
                <div style={{ fontSize: "0.75rem", fontStyle: "italic", color: isLight ? "#334155" : "#e4e4e7" }}>
                  Ví dụ: {rule.note}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
