import React, { useState } from "react";
import AudioPlayer from "../audio/AudioPlayer";

export const SENTENCE_TREE_TYPE = "sentence-tree";

export default function SentenceTreeVisualization({ data, isLight = false }) {
  const [activeTab, setActiveTab] = useState("breakdown"); // 'breakdown' | 'pronouns' | 'clauses' | 'reduced'
  const [selectedSentenceId, setSelectedSentenceId] = useState(data.interactive_sentences[0]?.id);
  const [selectedPronoun, setSelectedPronoun] = useState(data.pronouns[0]?.pronoun);

  const curSentence =
    data.interactive_sentences.find((s) => s.id === selectedSentenceId) ||
    data.interactive_sentences[0];
  const curPronoun =
    data.pronouns.find((p) => p.pronoun === selectedPronoun) || data.pronouns[0];

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
          { id: "breakdown", label: "🌳 Sơ Đồ Cấu Trúc Câu", desc: "Phân tích cú pháp tương tác" },
          { id: "pronouns", label: "🔑 Đại Từ & Trạng Từ", desc: "Who, Whom, Which, Whose, That" },
          { id: "clauses", label: "⚖️ Mệnh Đề Xác Định vs Không Xác Định", desc: "Dấu phẩy & That" },
          { id: "reduced", label: "✂️ Rút Gọn Mệnh Đề Thần Tốc", desc: "V-ing, V3, To-V" },
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

      {/* VIEW 1: SENTENCE BREAKDOWN */}
      {activeTab === "breakdown" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Sentence Selector Pills */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {data.interactive_sentences.map((sent) => (
              <button
                key={sent.id}
                onClick={() => setSelectedSentenceId(sent.id)}
                style={{
                  padding: "0.4rem 0.75rem",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-sans)",
                  fontWeight: selectedSentenceId === sent.id ? "700" : "500",
                  backgroundColor: selectedSentenceId === sent.id ? "var(--ds-btn-primary)" : "var(--ds-bg-elevated)",
                  color: selectedSentenceId === sent.id ? "#ffffff" : "var(--ds-text-secondary)",
                  border: `1px solid ${selectedSentenceId === sent.id ? "var(--ds-accent)" : "var(--ds-border)"}`,
                  cursor: "pointer",
                }}
              >
                {sent.title}
              </button>
            ))}
          </div>

          {/* Color-Coded Syntax Tree Visualization */}
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
            {/* Visual Flow Blocks */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "0.6rem",
                padding: "1rem",
                backgroundColor: "var(--ds-card)",
                borderRadius: "8px",
                border: `1px dashed ${"var(--ds-border)"}`,
              }}
            >
              {/* Antecedent */}
              <div
                style={{
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "var(--ds-accent-bg)",
                  border: `2px solid ${"var(--ds-accent)"}`,
                  borderRadius: "6px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "0.68rem", fontWeight: "700", color: "var(--ds-accent)", textTransform: "uppercase" }}>
                  Danh từ đi trước (Antecedent)
                </div>
                <div style={{ fontSize: "1rem", fontWeight: "800", color: "var(--ds-accent)", marginTop: "0.2rem" }}>
                  {curSentence.antecedent}
                </div>
              </div>

              {/* Arrow Connector */}
              <span style={{ fontSize: "1.2rem", color: "var(--ds-text-muted)" }}>➔</span>

              {/* Relative Pronoun */}
              <div
                style={{
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "var(--ds-purple-bg)",
                  border: `2px solid ${"var(--ds-purple)"}`,
                  borderRadius: "6px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "0.68rem", fontWeight: "700", color: "var(--ds-purple)", textTransform: "uppercase" }}>
                  Đại từ quan hệ (Pronoun)
                </div>
                <div style={{ fontSize: "1rem", fontWeight: "800", color: "var(--ds-purple)", marginTop: "0.2rem" }}>
                  {curSentence.pronoun}
                </div>
              </div>

              {/* Relative Clause Rest */}
              <div
                style={{
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "var(--ds-warning-bg)",
                  border: `2px solid ${"var(--ds-warning)"}`,
                  borderRadius: "6px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "0.68rem", fontWeight: "700", color: "var(--ds-warning)", textTransform: "uppercase" }}>
                  Vị ngữ mệnh đề quan hệ
                </div>
                <div style={{ fontSize: "1rem", fontWeight: "800", color: "var(--ds-warning)", marginTop: "0.2rem" }}>
                  {curSentence.relative_clause}
                </div>
              </div>

              {/* Main Clause Predicate */}
              <div
                style={{
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "var(--ds-success-bg)",
                  border: `2px solid ${"var(--ds-success)"}`,
                  borderRadius: "6px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "0.68rem", fontWeight: "700", color: "var(--ds-success-border)", textTransform: "uppercase" }}>
                  Vị ngữ mệnh đề chính
                </div>
                <div style={{ fontSize: "1rem", fontWeight: "800", color: "var(--ds-success)", marginTop: "0.2rem" }}>
                  {curSentence.main_predicate}
                </div>
              </div>
            </div>

            {/* Complete Sentence & Audio Pronunciation */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.75rem",
                padding: "0.85rem 1rem",
                backgroundColor: "var(--ds-card)",
                borderRadius: "8px",
                border: `1px solid ${"var(--ds-card-border)"}`,
              }}
            >
              <div>
                <div style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--ds-text-heading)", lineHeight: 1.4 }}>
                  "{curSentence.full_sentence}"
                </div>
                <div style={{ fontSize: "0.825rem", color: "var(--ds-success)", fontStyle: "italic", marginTop: "0.25rem" }}>
                  🇻🇳 {curSentence.translation}
                </div>
              </div>

              <AudioPlayer text={curSentence.audio} isLight={isLight} mode="compact" />
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: PRONOUNS & ADVERBS MATRIX */}
      {activeTab === "pronouns" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          {data.pronouns.map((p) => (
            <div
              key={p.pronoun}
              style={{
                padding: "1rem",
                borderRadius: "8px",
                backgroundColor: "var(--ds-card)",
                border: `1px solid ${"var(--ds-border)"}`,
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                boxShadow: isLight ? "0 2px 4px rgba(0,0,0,0.03)" : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "800",
                    fontFamily: "var(--font-sans)",
                    color: p.color,
                    padding: "0.2rem 0.6rem",
                    backgroundColor: "var(--ds-bg-elevated)",
                    border: `1px solid ${p.color}40`,
                    borderRadius: "6px",
                  }}
                >
                  {p.pronoun}
                </span>
                <span style={{ fontSize: "0.72rem", color: "var(--ds-text-muted)", fontWeight: "600" }}>
                  {p.replaces}
                </span>
              </div>

              <div style={{ fontSize: "0.78rem", color: "var(--ds-text-secondary)", lineHeight: 1.4 }}>
                <strong>Chức năng:</strong> {p.role}
              </div>

              <div
                style={{
                  fontSize: "0.75rem",
                  backgroundColor: "var(--ds-bg-elevated)",
                  padding: "0.5rem",
                  borderRadius: "6px",
                  borderLeft: `3px solid ${p.color}`,
                  color: "var(--ds-text-heading)",
                }}
              >
                💡 {p.rule_tip}
              </div>

              <div style={{ marginTop: "auto", paddingTop: "0.5rem", borderTop: `1px dashed ${"var(--ds-card-border)"}` }}>
                <div style={{ fontSize: "0.825rem", color: "var(--ds-text-heading)", fontWeight: "600" }}>
                  "{p.example}"
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--ds-success)", fontStyle: "italic", marginTop: "0.15rem" }}>
                  🇻🇳 {p.translation}
                </div>
                <div style={{ marginTop: "0.4rem" }}>
                  <AudioPlayer text={p.example_audio} isLight={isLight} mode="compact" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 3: DEFINING VS NON-DEFINING */}
      {activeTab === "clauses" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
          {data.clause_types.map((c) => (
            <div
              key={c.type}
              style={{
                padding: "1.15rem",
                borderRadius: "10px",
                backgroundColor: "var(--ds-card)",
                border: `1px solid ${c.type === "DEFINING" ? "var(--ds-accent-border)" : "var(--ds-warning-border)"}`,
                borderTop: `4px solid ${c.type === "DEFINING" ? "var(--ds-accent)" : "var(--ds-warning)"}`,
                display: "flex",
                flexDirection: "column",
                gap: "0.65rem",
              }}
            >
              <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "700", color: "var(--ds-text-heading)" }}>
                {c.title}
              </h4>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ds-text-muted)", lineHeight: 1.4 }}>
                {c.description}
              </p>

              <div style={{ fontSize: "0.78rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <div>📍 <strong>Dấu phẩy:</strong> {c.comma}</div>
                <div>⚡ <strong>Đại từ 'that':</strong> {c.can_use_that}</div>
                <div>✂️ <strong>Lược bỏ đại từ:</strong> {c.omission}</div>
              </div>

              <div
                style={{
                  marginTop: "0.5rem",
                  padding: "0.75rem",
                  borderRadius: "6px",
                  backgroundColor: "var(--ds-bg-elevated)",
                  border: `1px solid ${"var(--ds-card-border)"}`,
                }}
              >
                <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--ds-accent)" }}>
                  "{c.example}"
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--ds-text-muted)", marginTop: "0.25rem" }}>
                  {c.analysis}
                </div>
                <div style={{ marginTop: "0.4rem" }}>
                  <AudioPlayer text={c.example_audio} isLight={isLight} mode="compact" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 4: REDUCED RELATIVE CLAUSES */}
      {activeTab === "reduced" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {data.reduced_forms.map((r, idx) => (
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
                <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--ds-text-heading)" }}>
                  {r.pattern}
                </span>
                <span style={{ fontSize: "0.72rem", backgroundColor: "var(--ds-success-bg)", color: "var(--ds-success)", padding: "0.15rem 0.45rem", borderRadius: "4px", fontWeight: "700" }}>
                  QUY TẮC {idx + 1}
                </span>
              </div>

              <div style={{ fontSize: "0.8rem", color: "var(--ds-text-muted)" }}>
                <strong>Điều kiện áp dụng:</strong> {r.condition}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", padding: "0.75rem", backgroundColor: "var(--ds-bg-elevated)", borderRadius: "6px" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--ds-text-muted)", textDecoration: "line-through" }}>
                  Câu gốc: "{r.original}"
                </div>
                <div style={{ fontSize: "0.875rem", fontWeight: "700", color: "var(--ds-success)" }}>
                  ➔ Rút gọn: "{r.reduced}"
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--ds-warning)", marginTop: "0.15rem" }}>
                  💡 {r.rule_step}
                </div>
              </div>

              <AudioPlayer text={r.reduced_audio} isLight={isLight} mode="compact" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
