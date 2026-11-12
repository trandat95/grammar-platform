import React, { useState } from "react";
import AudioPlayer from "../audio/AudioPlayer";

export const MODAL_MATRIX_TYPE = "modal-matrix";

export default function ModalMatrixVisualization({ data, isLight = false }) {
  const [activeTab, setActiveTab] = useState("gauge"); // 'gauge' | 'functions' | 'perfect'
  const [selectedProbabilityLevel, setSelectedProbabilityLevel] = useState("CERTAINTY");
  const [selectedFunctionId, setSelectedFunctionId] = useState("ability");

  const curProb =
    data.probability_scale.find((p) => p.level === selectedProbabilityLevel) ||
    data.probability_scale[4];
  const curFunc =
    data.functional_categories.find((f) => f.id === selectedFunctionId) ||
    data.functional_categories[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: `1px solid ${"var(--ds-card-border)"}`,
          paddingBottom: "0.75rem",
          overflowX: "auto",
        }}
      >
        {[
          { id: "gauge", label: "🎯 Thang Đo Xác Suất (0% - 100%)", desc: "Can't -> Might -> May -> Should -> Must" },
          { id: "functions", label: "⚖️ Ma Trận Chức Năng Cốt Lõi", desc: "Ability, Permission, Obligation, Advice" },
          { id: "perfect", label: "⏳ Perfect Modals (Quá Khứ)", desc: "Must have V3, Should have V3, Needn't have V3" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "0.55rem 0.95rem",
              borderRadius: "8px",
              border: activeTab === tab.id ? (isLight ? "1px solid var(--ds-accent)" : "1px solid var(--ds-accent)") : "1px solid transparent",
              backgroundColor: activeTab === tab.id ? "var(--ds-accent-bg)" : "transparent",
              color: activeTab === tab.id ? "var(--ds-accent)" : "var(--ds-text-muted)",
              fontSize: "0.825rem",
              fontWeight: activeTab === tab.id ? "700" : "500",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "0.15rem",
              whiteSpace: "nowrap",
            }}
          >
            <span>{tab.label}</span>
            <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>{tab.desc}</span>
          </button>
        ))}
      </div>

      {/* VIEW 1: PROBABILITY SPECTRUM & GAUGE */}
      {activeTab === "gauge" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Interactive Stepper Bar (0% to 100%) */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.5rem",
              padding: "1rem",
              backgroundColor: "var(--ds-bg-elevated)",
              borderRadius: "10px",
              border: `1px solid ${"var(--ds-card-border)"}`,
              overflowX: "auto",
            }}
          >
            {data.probability_scale.map((step) => {
              const isSelected = selectedProbabilityLevel === step.level;
              return (
                <button
                  key={step.level}
                  onClick={() => setSelectedProbabilityLevel(step.level)}
                  style={{
                    flex: 1,
                    minWidth: "120px",
                    padding: "0.75rem 0.5rem",
                    borderRadius: "8px",
                    border: `2px solid ${isSelected ? step.color : "transparent"}`,
                    backgroundColor: isSelected ? "var(--ds-card)" : "transparent",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.25rem",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span
                    style={{
                      fontSize: "1rem",
                      fontFamily: "Geist Mono",
                      fontWeight: "800",
                      color: step.color,
                    }}
                  >
                    {step.percentage}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      color: "var(--ds-text-heading)",
                      textAlign: "center",
                    }}
                  >
                    {step.modals.join(", ")}
                  </span>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      color: "var(--ds-text-muted)",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {step.label.split("(")[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Focused Probability Card */}
          <div
            style={{
              padding: "1.25rem",
              borderRadius: "10px",
              backgroundColor: "var(--ds-card)",
              border: `2px solid ${curProb.color}`,
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              boxShadow: isLight ? `0 4px 16px ${curProb.color}15` : `0 4px 20px ${curProb.color}25`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span
                  style={{
                    fontSize: "1.25rem",
                    fontFamily: "Geist Mono",
                    fontWeight: "900",
                    color: "#ffffff",
                    backgroundColor: curProb.color,
                    padding: "0.2rem 0.75rem",
                    borderRadius: "6px",
                  }}
                >
                  {curProb.percentage}
                </span>
                <div>
                  <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: "var(--ds-text-heading)" }}>
                    {curProb.label}
                  </h4>
                  <div style={{ fontSize: "0.78rem", color: curProb.color, fontWeight: "600" }}>
                    Động từ khuyết thiếu: {curProb.modals.map((m) => `"${m}"`).join(" hoặc ")}
                  </div>
                </div>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ds-text-secondary)", lineHeight: 1.5 }}>
              {curProb.explanation}
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.75rem",
                padding: "0.85rem 1rem",
                backgroundColor: "var(--ds-bg-elevated)",
                borderRadius: "8px",
                border: `1px solid ${"var(--ds-card-border)"}`,
              }}
            >
              <div>
                <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--ds-text-heading)" }}>
                  "{curProb.example}"
                </div>
              </div>
              <AudioPlayer text={curProb.example_audio} isLight={isLight} mode="compact" />
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: FUNCTIONAL CATEGORIES */}
      {activeTab === "functions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Function Selector Pills */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {data.functional_categories.map((func) => (
              <button
                key={func.id}
                onClick={() => setSelectedFunctionId(func.id)}
                style={{
                  padding: "0.45rem 0.85rem",
                  borderRadius: "6px",
                  fontSize: "0.78rem",
                  fontWeight: selectedFunctionId === func.id ? "700" : "500",
                  backgroundColor: selectedFunctionId === func.id ? "var(--ds-btn-primary)" : "var(--ds-bg-elevated)",
                  color: selectedFunctionId === func.id ? "#ffffff" : "var(--ds-text-secondary)",
                  border: `1px solid ${selectedFunctionId === func.id ? "var(--ds-accent)" : "var(--ds-border)"}`,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <span>{func.icon}</span>
                <span>{func.name}</span>
              </button>
            ))}
          </div>

          {/* Rules in Selected Function */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.85rem" }}>
            {curFunc.rules.map((rule, rIdx) => (
              <div
                key={rIdx}
                style={{
                  padding: "1rem",
                  borderRadius: "8px",
                  backgroundColor: "var(--ds-card)",
                  border: `1px solid ${"var(--ds-border)"}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--ds-accent)", fontFamily: "Geist Mono" }}>
                    {rule.modal}
                  </span>
                  <span style={{ fontSize: "0.7rem", backgroundColor: "var(--ds-accent-bg)", color: "var(--ds-accent)", padding: "0.15rem 0.45rem", borderRadius: "4px", fontWeight: "700" }}>
                    {rule.time}
                  </span>
                </div>

                <div style={{ fontSize: "0.78rem", color: "var(--ds-text-secondary)", lineHeight: 1.4 }}>
                  {rule.usage}
                </div>

                <div style={{ marginTop: "auto", paddingTop: "0.5rem", borderTop: `1px dashed ${"var(--ds-card-border)"}` }}>
                  <div style={{ fontSize: "0.825rem", color: "var(--ds-text-heading)", fontWeight: "600" }}>
                    "{rule.example}"
                  </div>
                  <div style={{ marginTop: "0.35rem" }}>
                    <AudioPlayer text={rule.example_audio} isLight={isLight} mode="compact" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: PERFECT MODALS (PAST DEDUCTIONS & REGRETS) */}
      {activeTab === "perfect" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
          {data.perfect_modals.map((pm, idx) => (
            <div
              key={idx}
              style={{
                padding: "1.15rem",
                borderRadius: "8px",
                backgroundColor: "var(--ds-card)",
                border: `1px solid ${"var(--ds-border)"}`,
                borderLeft: "4px solid var(--ds-purple)",
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}
            >
              <div style={{ fontSize: "1rem", fontWeight: "800", fontFamily: "Geist Mono", color: "var(--ds-purple)" }}>
                {pm.formula}
              </div>

              <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--ds-text-heading)" }}>
                🇻🇳 {pm.meaning}
              </div>

              <div style={{ fontSize: "0.75rem", backgroundColor: "var(--ds-warning-bg)", color: "var(--ds-warning)", padding: "0.45rem 0.65rem", borderRadius: "6px" }}>
                ⚠️ <strong>Cảnh báo bẫy thi:</strong> {pm.trap_alert}
              </div>

              <div style={{ marginTop: "auto", paddingTop: "0.5rem", borderTop: `1px dashed ${"var(--ds-card-border)"}` }}>
                <div style={{ fontSize: "0.825rem", color: "var(--ds-accent)" }}>
                  "{pm.example}"
                </div>
                <div style={{ marginTop: "0.35rem" }}>
                  <AudioPlayer text={pm.example_audio} isLight={isLight} mode="compact" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
