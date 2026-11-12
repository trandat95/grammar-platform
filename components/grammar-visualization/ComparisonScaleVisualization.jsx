import React, { useState } from "react";
import AudioPlayer from "../audio/AudioPlayer";

export const COMPARISON_SCALE_TYPE = "comparison-scale";

export default function ComparisonScaleVisualization({ data, isLight = false }) {
  const [selectedTierId, setSelectedTierId] = useState("comparative"); // 'equal' | 'comparative' | 'superlative' | 'double'
  const [activeSubTab, setActiveSubTab] = useState("scale"); // 'scale' | 'short_long' | 'irregulars'

  const curTier = data.tiers.find((t) => t.id === selectedTierId) || data.tiers[1];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Top Mode Navigation */}
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
          { id: "scale", label: "📊 Thang Đo So Sánh Đa Cấp", desc: "Equal / Comparative / Superlative / Double" },
          { id: "short_long", label: "📏 Tính Từ Ngắn vs Dài", desc: "Quy tắc thêm -er/-est vs more/most" },
          { id: "irregulars", label: "⚡ Bảng Bất Quy Tắc", desc: "Good -> Better -> Best, Bad -> Worse" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              padding: "0.55rem 0.95rem",
              borderRadius: "8px",
              border: activeSubTab === tab.id ? (isLight ? "1px solid var(--ds-accent)" : "1px solid var(--ds-accent)") : "1px solid transparent",
              backgroundColor: activeSubTab === tab.id ? "var(--ds-accent-bg)" : "transparent",
              color: activeSubTab === tab.id ? "var(--ds-accent)" : "var(--ds-text-muted)",
              fontSize: "0.825rem",
              fontWeight: activeSubTab === tab.id ? "700" : "500",
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

      {/* VIEW 1: COMPARISON SCALE & RATIO GAUGES */}
      {activeSubTab === "scale" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Tier Selector Buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
            {data.tiers.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setSelectedTierId(tier.id)}
                style={{
                  padding: "0.85rem",
                  borderRadius: "8px",
                  border: `2px solid ${selectedTierId === tier.id ? tier.color : "var(--ds-card-border)"}`,
                  backgroundColor: selectedTierId === tier.id ? "var(--ds-bg-elevated)" : "var(--ds-card)",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.35rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--ds-text-heading)" }}>
                    {tier.name}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "800",
                      fontFamily: "var(--font-sans)",
                      color: tier.color,
                      backgroundColor: `${tier.color}20`,
                      padding: "0.1rem 0.45rem",
                      borderRadius: "4px",
                    }}
                  >
                    {tier.symbol}
                  </span>
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--ds-text-muted)" }}>
                  {tier.percentage_relation}
                </div>
              </button>
            ))}
          </div>

          {/* Visual Scale Diagram */}
          <div
            style={{
              padding: "1.25rem",
              borderRadius: "10px",
              backgroundColor: "var(--ds-bg-elevated)",
              border: `1px solid ${"var(--ds-card-border)"}`,
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            {/* Visual Bars Comparison */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                padding: "1rem",
                backgroundColor: "var(--ds-card)",
                borderRadius: "8px",
                border: `1px solid ${"var(--ds-card-border)"}`,
              }}
            >
              <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--ds-text-secondary)" }}>
                📊 Biểu Đồ Thước Đo Tỷ Lệ Thực Nghiệm:
              </div>

              {/* Bar A */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ width: "80px", fontSize: "0.78rem", fontWeight: "700", color: "var(--ds-text-heading)" }}>
                  Đối tượng A:
                </span>
                <div style={{ flex: 1, backgroundColor: "var(--ds-card-border)", borderRadius: "999px", height: "18px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: selectedTierId === "equal" ? "65%" : selectedTierId === "comparative" ? "85%" : "100%",
                      height: "100%",
                      backgroundColor: curTier.color,
                      borderRadius: "999px",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
                <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-sans)", fontWeight: "700", color: curTier.color }}>
                  {selectedTierId === "equal" ? "100%" : selectedTierId === "comparative" ? "140% (Hơn)" : "100% (Nhất)"}
                </span>
              </div>

              {/* Bar B */}
              {selectedTierId !== "superlative" && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ width: "80px", fontSize: "0.78rem", fontWeight: "700", color: "var(--ds-text-heading)" }}>
                    Đối tượng B:
                  </span>
                  <div style={{ flex: 1, backgroundColor: "var(--ds-card-border)", borderRadius: "999px", height: "18px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: "65%",
                        height: "100%",
                        backgroundColor: "var(--ds-border-strong)",
                        borderRadius: "999px",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-sans)", fontWeight: "700", color: "var(--ds-text-muted)" }}>
                    100% (Chuẩn)
                  </span>
                </div>
              )}
            </div>

            {/* Formulas & Examples */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {curTier.id === "equal" && (
                <>
                  <div style={{ padding: "0.75rem", borderRadius: "6px", backgroundColor: "var(--ds-card)", border: `1px solid ${"var(--ds-card-border)"}` }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--ds-success)", textTransform: "uppercase" }}>Khẳng định:</div>
                    <div style={{ fontSize: "0.85rem", fontFamily: "var(--font-sans)", color: "var(--ds-text-heading)", marginTop: "0.15rem" }}>{curTier.formula_affirmative}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.4rem" }}>
                      <span style={{ fontSize: "0.825rem", color: "var(--ds-accent)" }}>"{curTier.example_affirmative}"</span>
                      <AudioPlayer text={curTier.example_affirmative_audio} isLight={isLight} mode="compact" />
                    </div>
                  </div>
                  <div style={{ padding: "0.75rem", borderRadius: "6px", backgroundColor: "var(--ds-card)", border: `1px solid ${"var(--ds-card-border)"}` }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--ds-danger)", textTransform: "uppercase" }}>Phủ định:</div>
                    <div style={{ fontSize: "0.85rem", fontFamily: "var(--font-sans)", color: "var(--ds-text-heading)", marginTop: "0.15rem" }}>{curTier.formula_negative}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.4rem" }}>
                      <span style={{ fontSize: "0.825rem", color: "var(--ds-accent)" }}>"{curTier.example_negative}"</span>
                      <AudioPlayer text={curTier.example_negative_audio} isLight={isLight} mode="compact" />
                    </div>
                  </div>
                </>
              )}

              {curTier.id === "comparative" && (
                <>
                  <div style={{ padding: "0.75rem", borderRadius: "6px", backgroundColor: "var(--ds-card)", border: `1px solid ${"var(--ds-card-border)"}` }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--ds-accent)", textTransform: "uppercase" }}>Tính từ ngắn (-er than):</div>
                    <div style={{ fontSize: "0.85rem", fontFamily: "var(--font-sans)", color: "var(--ds-text-heading)", marginTop: "0.15rem" }}>{curTier.short_rule}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.4rem" }}>
                      <span style={{ fontSize: "0.825rem", color: "var(--ds-accent)" }}>"{curTier.short_example}"</span>
                      <AudioPlayer text={curTier.short_example_audio} isLight={isLight} mode="compact" />
                    </div>
                  </div>
                  <div style={{ padding: "0.75rem", borderRadius: "6px", backgroundColor: "var(--ds-card)", border: `1px solid ${"var(--ds-card-border)"}` }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--ds-purple)", textTransform: "uppercase" }}>Tính từ dài (more ... than):</div>
                    <div style={{ fontSize: "0.85rem", fontFamily: "var(--font-sans)", color: "var(--ds-text-heading)", marginTop: "0.15rem" }}>{curTier.long_rule}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.4rem" }}>
                      <span style={{ fontSize: "0.825rem", color: "var(--ds-accent)" }}>"{curTier.long_example}"</span>
                      <AudioPlayer text={curTier.long_example_audio} isLight={isLight} mode="compact" />
                    </div>
                  </div>
                </>
              )}

              {curTier.id === "superlative" && (
                <>
                  <div style={{ padding: "0.75rem", borderRadius: "6px", backgroundColor: "var(--ds-card)", border: `1px solid ${"var(--ds-card-border)"}` }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--ds-purple)", textTransform: "uppercase" }}>Tính từ ngắn (the -est):</div>
                    <div style={{ fontSize: "0.85rem", fontFamily: "var(--font-sans)", color: "var(--ds-text-heading)", marginTop: "0.15rem" }}>{curTier.short_rule}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.4rem" }}>
                      <span style={{ fontSize: "0.825rem", color: "var(--ds-accent)" }}>"{curTier.short_example}"</span>
                      <AudioPlayer text={curTier.short_example_audio} isLight={isLight} mode="compact" />
                    </div>
                  </div>
                  <div style={{ padding: "0.75rem", borderRadius: "6px", backgroundColor: "var(--ds-card)", border: `1px solid ${"var(--ds-card-border)"}` }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--ds-pink)", textTransform: "uppercase" }}>Tính từ dài (the most):</div>
                    <div style={{ fontSize: "0.85rem", fontFamily: "var(--font-sans)", color: "var(--ds-text-heading)", marginTop: "0.15rem" }}>{curTier.long_rule}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.4rem" }}>
                      <span style={{ fontSize: "0.825rem", color: "var(--ds-accent)" }}>"{curTier.long_example}"</span>
                      <AudioPlayer text={curTier.long_example_audio} isLight={isLight} mode="compact" />
                    </div>
                  </div>
                </>
              )}

              {curTier.id === "double" && (
                <>
                  <div style={{ padding: "0.75rem", borderRadius: "6px", backgroundColor: "var(--ds-card)", border: `1px solid ${"var(--ds-card-border)"}` }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--ds-warning)", textTransform: "uppercase" }}>Dạng 1: Càng ngày càng...</div>
                    <div style={{ fontSize: "0.85rem", fontFamily: "var(--font-sans)", color: "var(--ds-text-heading)", marginTop: "0.15rem" }}>{curTier.type1_formula}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.4rem" }}>
                      <span style={{ fontSize: "0.825rem", color: "var(--ds-accent)" }}>"{curTier.type1_example}"</span>
                      <AudioPlayer text={curTier.type1_example_audio} isLight={isLight} mode="compact" />
                    </div>
                  </div>
                  <div style={{ padding: "0.75rem", borderRadius: "6px", backgroundColor: "var(--ds-card)", border: `1px solid ${"var(--ds-card-border)"}` }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--ds-success)", textTransform: "uppercase" }}>Dạng 2: Càng... thì càng...</div>
                    <div style={{ fontSize: "0.85rem", fontFamily: "var(--font-sans)", color: "var(--ds-text-heading)", marginTop: "0.15rem" }}>{curTier.type2_formula}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.4rem" }}>
                      <span style={{ fontSize: "0.825rem", color: "var(--ds-accent)" }}>"{curTier.type2_example}"</span>
                      <AudioPlayer text={curTier.type2_example_audio} isLight={isLight} mode="compact" />
                    </div>
                  </div>
                </>
              )}

              <div style={{ fontSize: "0.78rem", backgroundColor: "var(--ds-accent-bg)", padding: "0.6rem 0.85rem", borderRadius: "6px", color: "var(--ds-accent)", border: `1px solid ${"var(--ds-accent-border)"}` }}>
                💡 <strong>Mẹo thi cử:</strong> {curTier.emphasis_tip || curTier.rule_summary}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: SHORT VS LONG ADJECTIVES */}
      {activeSubTab === "short_long" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {data.morphology_rules.map((rule, idx) => (
            <div
              key={idx}
              style={{
                padding: "1rem",
                borderRadius: "8px",
                backgroundColor: "var(--ds-card)",
                border: `1px solid ${"var(--ds-border)"}`,
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--ds-text-heading)" }}>
                  {rule.category}
                </span>
                <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-sans)", color: "var(--ds-accent)", fontWeight: "700" }}>
                  {rule.rule}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.5rem" }}>
                {rule.examples.map((ex, eIdx) => (
                  <div
                    key={eIdx}
                    style={{
                      padding: "0.5rem 0.75rem",
                      borderRadius: "6px",
                      backgroundColor: "var(--ds-bg-elevated)",
                      border: `1px solid ${"var(--ds-card-border)"}`,
                      fontSize: "0.8rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.2rem",
                    }}
                  >
                    <div><strong>Gốc:</strong> {ex.base}</div>
                    <div style={{ color: "var(--ds-accent)" }}>➔ So sánh hơn: {ex.comp}</div>
                    <div style={{ color: "var(--ds-purple)" }}>➔ So sánh nhất: {ex.sup}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 3: IRREGULARS LOOKUP */}
      {activeSubTab === "irregulars" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          {data.irregulars.map((item, idx) => (
            <div
              key={idx}
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
                <span style={{ fontSize: "1rem", fontWeight: "800", color: "var(--ds-text-heading)", fontFamily: "var(--font-sans)" }}>
                  {item.base}
                </span>
                <span style={{ fontSize: "0.72rem", color: "var(--ds-success)", fontWeight: "600" }}>
                  {item.meaning}
                </span>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.8rem" }}>
                <div>Hơn: <strong style={{ color: "var(--ds-accent)" }}>{item.comparative}</strong></div>
                <div>Nhất: <strong style={{ color: "var(--ds-purple)" }}>{item.superlative}</strong></div>
              </div>

              <div style={{ marginTop: "auto", paddingTop: "0.5rem", borderTop: `1px dashed ${"var(--ds-card-border)"}` }}>
                <div style={{ fontSize: "0.8rem", color: "var(--ds-text-secondary)" }}>
                  "{item.example}"
                </div>
                <div style={{ marginTop: "0.35rem" }}>
                  <AudioPlayer text={item.example_audio} isLight={isLight} mode="compact" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
