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
        backgroundColor: "var(--ds-card)",
        border: `1px solid ${"var(--ds-border)"}`,
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
              color: "var(--ds-text-heading)",
              margin: 0,
            }}
          >
            🔄 {data.title}
          </h3>
          <span
            style={{
              fontSize: "0.72rem",
              fontFamily: "Geist Mono",
              backgroundColor: "var(--ds-accent-bg)",
              border: `1px solid ${"var(--ds-accent-border)"}`,
              color: "var(--ds-accent)",
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
            color: "var(--ds-text-muted)",
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
                    ? "var(--ds-accent-bg)"
                    : "var(--ds-bg-elevated)",
                  border: `1px solid ${
                    isSelected
                      ? "var(--ds-accent)"
                      : "var(--ds-card-border)"
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
                        ? "var(--ds-accent)"
                        : "var(--ds-text-muted)",
                    }}
                  >
                    BƯỚC {st.step}
                  </div>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: "600",
                      color: "var(--ds-text-heading)",
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
              backgroundColor: isLight ? "var(--ds-success-bg)" : "rgba(16, 185, 129, 0.1)",
              border: `1px solid ${isLight ? "var(--ds-success-border)" : "rgba(16, 185, 129, 0.3)"}`,
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
              <strong style={{ fontSize: "0.85rem", color: "var(--ds-success)" }}>
                Bước {activeStep}: {data.steps.find((s) => s.step === activeStep)?.title}
              </strong>
              <div style={{ fontSize: "0.82rem", color: "var(--ds-success)", marginTop: "0.15rem" }}>
                {data.steps.find((s) => s.step === activeStep)?.instruction}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tense Switcher Tabs */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "0.75rem", fontFamily: "Geist Mono", color: "var(--ds-text-muted)", fontWeight: "700", marginBottom: "0.45rem", textTransform: "uppercase" }}>
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
                    ? "var(--ds-accent)"
                    : "var(--ds-bg-elevated)",
                  color: isActive ? "#ffffff" : "var(--ds-text-secondary)",
                  border: `1px solid ${isActive ? "transparent" : "var(--ds-border)"}`,
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
            backgroundColor: "var(--ds-bg-elevated)",
            border: `1px solid ${"var(--ds-card-border)"}`,
            borderRadius: "10px",
            padding: "1.25rem",
            marginBottom: "1.25rem",
          }}
        >
          {/* Header of Active vs Passive */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--ds-text-heading)" }}>
              {currentExample.tense_name}
            </span>
            <span
              style={{
                fontSize: "0.8rem",
                fontFamily: "Geist Mono",
                fontWeight: "700",
                backgroundColor: "var(--ds-warning-bg)",
                border: `1px solid ${"var(--ds-warning-border)"}`,
                color: "var(--ds-warning)",
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
              backgroundColor: "var(--ds-card)",
              border: `1px solid ${"var(--ds-border)"}`,
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
              <span style={{ fontSize: "0.72rem", fontFamily: "Geist Mono", fontWeight: "800", color: "var(--ds-accent)", textTransform: "uppercase" }}>
                1. Câu Chủ Động (Active Voice)
              </span>
              <AudioPlayer text={currentExample.active.full} isLight={isLight} compact={true} />
            </div>

            {/* S - V - O Badges */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
              <div style={{ backgroundColor: isLight ? "var(--ds-accent-bg)" : "rgba(37, 99, 235, 0.15)", border: `1px solid ${"var(--ds-accent-border)"}`, padding: "0.3rem 0.6rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.68rem", fontFamily: "Geist Mono", color: "var(--ds-accent)", fontWeight: "700" }}>CHỦ NGỮ (S): </span>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--ds-text-heading)" }}>{currentExample.active.subject}</span>
              </div>
              <div style={{ backgroundColor: isLight ? "var(--ds-warning-bg)" : "rgba(245, 158, 11, 0.15)", border: `1px solid ${"var(--ds-warning-border)"}`, padding: "0.3rem 0.6rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.68rem", fontFamily: "Geist Mono", color: "var(--ds-warning)", fontWeight: "700" }}>ĐỘNG TỪ (V): </span>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--ds-text-heading)" }}>{currentExample.active.verb}</span>
              </div>
              <div style={{ backgroundColor: isLight ? "var(--ds-success-bg)" : "rgba(16, 185, 129, 0.15)", border: `1px solid ${"var(--ds-success-border)"}`, padding: "0.3rem 0.6rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.68rem", fontFamily: "Geist Mono", color: "var(--ds-success)", fontWeight: "700" }}>TÂN NGỮ (O): </span>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--ds-text-heading)" }}>{currentExample.active.object}</span>
              </div>
            </div>

            <div style={{ fontSize: "0.92rem", fontStyle: "italic", color: "var(--ds-text-heading)" }}>
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
              color: "var(--ds-text-muted)",
              fontSize: "0.8rem",
              fontFamily: "Geist Mono",
              fontWeight: "700",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span>Tân ngữ (O) ➔ Chủ ngữ mới (S)</span>
              <span style={{ fontSize: "1.2rem", color: "var(--ds-success)" }}>⇣</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span>Verb ➔ BE + V3</span>
              <span style={{ fontSize: "1.2rem", color: "var(--ds-warning)" }}>⇣</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span>Chủ ngữ (S) ➔ By + Agent</span>
              <span style={{ fontSize: "1.2rem", color: "var(--ds-accent)" }}>⇣</span>
            </div>
          </div>

          {/* Passive Sentence Breakdown Box */}
          <div
            style={{
              backgroundColor: "var(--ds-card)",
              border: `2px solid ${"var(--ds-success)"}`,
              borderRadius: "8px",
              padding: "1rem",
              marginTop: "0.5rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
              <span style={{ fontSize: "0.72rem", fontFamily: "Geist Mono", fontWeight: "800", color: "var(--ds-success)", textTransform: "uppercase" }}>
                2. Câu Bị Động (Passive Voice Result)
              </span>
              <AudioPlayer text={currentExample.passive.full} isLight={isLight} compact={true} />
            </div>

            {/* S(new) - BE - V3 - By Agent */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
              <div style={{ backgroundColor: isLight ? "var(--ds-success-bg)" : "rgba(16, 185, 129, 0.2)", border: `1px solid ${"var(--ds-success-border)"}`, padding: "0.3rem 0.6rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.68rem", fontFamily: "Geist Mono", color: "var(--ds-success)", fontWeight: "700" }}>CHỦ NGỮ MỚI: </span>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--ds-text-heading)" }}>{currentExample.passive.subject}</span>
              </div>
              <div style={{ backgroundColor: isLight ? "var(--ds-warning-bg)" : "rgba(245, 158, 11, 0.2)", border: `1px solid ${"var(--ds-warning-border)"}`, padding: "0.3rem 0.6rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.68rem", fontFamily: "Geist Mono", color: "var(--ds-warning)", fontWeight: "700" }}>TO BE: </span>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--ds-text-heading)" }}>{currentExample.passive.be_verb}</span>
              </div>
              <div style={{ backgroundColor: isLight ? "var(--ds-accent-bg)" : "rgba(59, 130, 246, 0.2)", border: `1px solid ${"var(--ds-accent-border)"}`, padding: "0.3rem 0.6rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.68rem", fontFamily: "Geist Mono", color: "var(--ds-accent)", fontWeight: "700" }}>V3/V-ED: </span>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--ds-text-heading)" }}>{currentExample.passive.past_participle}</span>
              </div>
              <div style={{ backgroundColor: isLight ? "var(--ds-purple-bg)" : "rgba(168, 85, 247, 0.2)", border: `1px solid ${"var(--ds-purple-border)"}`, padding: "0.3rem 0.6rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.68rem", fontFamily: "Geist Mono", color: "var(--ds-purple)", fontWeight: "700" }}>TÁC NHÂN: </span>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--ds-text-heading)" }}>{currentExample.passive.agent}</span>
              </div>
            </div>

            <div style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--ds-text-heading)", lineHeight: "1.5" }}>
              "{currentExample.passive.full}"
            </div>

            {/* Pedagogical Note / Explanation */}
            <div
              style={{
                marginTop: "0.75rem",
                padding: "0.65rem 0.85rem",
                backgroundColor: "var(--ds-bg-elevated)",
                borderLeft: `3px solid ${"var(--ds-accent)"}`,
                borderRadius: "4px",
                fontSize: "0.82rem",
                color: "var(--ds-text-secondary)",
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
            backgroundColor: "var(--ds-bg-elevated)",
            border: `1px solid ${"var(--ds-border)"}`,
            borderRadius: "8px",
            cursor: "pointer",
            color: "var(--ds-text-heading)",
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
                  backgroundColor: "var(--ds-card)",
                  border: `1px solid ${
                    rule.rule.includes("Bắt buộc giữ")
                      ? "var(--ds-accent-border)"
                      : "var(--ds-warning-border)"
                  }`,
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: "800",
                    color: rule.rule.includes("Bắt buộc giữ")
                      ? "var(--ds-accent)"
                      : "var(--ds-warning)",
                    marginBottom: "0.35rem",
                  }}
                >
                  {rule.rule}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--ds-text-muted)", marginBottom: "0.45rem" }}>
                  {rule.examples}
                </div>
                <div style={{ fontSize: "0.75rem", fontStyle: "italic", color: "var(--ds-text-secondary)" }}>
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
