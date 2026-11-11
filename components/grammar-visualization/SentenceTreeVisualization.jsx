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
          borderBottom: `1px solid ${isLight ? "#e2e8f0" : "#272733"}`,
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
              border: activeTab === tab.id ? (isLight ? "1px solid #3b82f6" : "1px solid #60a5fa") : "1px solid transparent",
              backgroundColor: activeTab === tab.id ? (isLight ? "#eff6ff" : "#1e1b4b") : "transparent",
              color: activeTab === tab.id ? (isLight ? "#1d4ed8" : "#93c5fd") : (isLight ? "#475569" : "#a1a1aa"),
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
                  fontFamily: "Geist Mono",
                  fontWeight: selectedSentenceId === sent.id ? "700" : "500",
                  backgroundColor: selectedSentenceId === sent.id ? (isLight ? "#3b82f6" : "#2563eb") : (isLight ? "#f1f5f9" : "#1c1c24"),
                  color: selectedSentenceId === sent.id ? "#ffffff" : (isLight ? "#334155" : "#cbd5e1"),
                  border: `1px solid ${selectedSentenceId === sent.id ? "#2563eb" : (isLight ? "#cbd5e1" : "#2d2d3f")}`,
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
              backgroundColor: isLight ? "#f8fafc" : "#0d1117",
              border: `1px solid ${isLight ? "#e2e8f0" : "#1e293b"}`,
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
                backgroundColor: isLight ? "#ffffff" : "#161b22",
                borderRadius: "8px",
                border: `1px dashed ${isLight ? "#cbd5e1" : "#30363d"}`,
              }}
            >
              {/* Antecedent */}
              <div
                style={{
                  padding: "0.5rem 0.75rem",
                  backgroundColor: isLight ? "#dbeafe" : "#1e3a8a30",
                  border: `2px solid ${isLight ? "#3b82f6" : "#3b82f6"}`,
                  borderRadius: "6px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "0.68rem", fontWeight: "700", color: isLight ? "#1e40af" : "#93c5fd", textTransform: "uppercase" }}>
                  Danh từ đi trước (Antecedent)
                </div>
                <div style={{ fontSize: "1rem", fontWeight: "800", color: isLight ? "#1d4ed8" : "#60a5fa", marginTop: "0.2rem" }}>
                  {curSentence.antecedent}
                </div>
              </div>

              {/* Arrow Connector */}
              <span style={{ fontSize: "1.2rem", color: isLight ? "#64748b" : "#8b949e" }}>➔</span>

              {/* Relative Pronoun */}
              <div
                style={{
                  padding: "0.5rem 0.75rem",
                  backgroundColor: isLight ? "#f3e8ff" : "#581c8730",
                  border: `2px solid ${isLight ? "#9333ea" : "#a855f7"}`,
                  borderRadius: "6px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "0.68rem", fontWeight: "700", color: isLight ? "#6b21a8" : "#d8b4fe", textTransform: "uppercase" }}>
                  Đại từ quan hệ (Pronoun)
                </div>
                <div style={{ fontSize: "1rem", fontWeight: "800", color: isLight ? "#7e22ce" : "#c084fc", marginTop: "0.2rem" }}>
                  {curSentence.pronoun}
                </div>
              </div>

              {/* Relative Clause Rest */}
              <div
                style={{
                  padding: "0.5rem 0.75rem",
                  backgroundColor: isLight ? "#fef3c7" : "#78350f30",
                  border: `2px solid ${isLight ? "#f59e0b" : "#f59e0b"}`,
                  borderRadius: "6px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "0.68rem", fontWeight: "700", color: isLight ? "#92400e" : "#fde68a", textTransform: "uppercase" }}>
                  Vị ngữ mệnh đề quan hệ
                </div>
                <div style={{ fontSize: "1rem", fontWeight: "800", color: isLight ? "#b45309" : "#fbbf24", marginTop: "0.2rem" }}>
                  {curSentence.relative_clause}
                </div>
              </div>

              {/* Main Clause Predicate */}
              <div
                style={{
                  padding: "0.5rem 0.75rem",
                  backgroundColor: isLight ? "#dcfce7" : "#064e3b30",
                  border: `2px solid ${isLight ? "#10b981" : "#10b981"}`,
                  borderRadius: "6px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "0.68rem", fontWeight: "700", color: isLight ? "#14532d" : "#86efac", textTransform: "uppercase" }}>
                  Vị ngữ mệnh đề chính
                </div>
                <div style={{ fontSize: "1rem", fontWeight: "800", color: isLight ? "#15803d" : "#34d399", marginTop: "0.2rem" }}>
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
                backgroundColor: isLight ? "#ffffff" : "#161b22",
                borderRadius: "8px",
                border: `1px solid ${isLight ? "#e2e8f0" : "#30363d"}`,
              }}
            >
              <div>
                <div style={{ fontSize: "1.05rem", fontWeight: "700", color: isLight ? "#0f172a" : "#f0f6fc", lineHeight: 1.4 }}>
                  "{curSentence.full_sentence}"
                </div>
                <div style={{ fontSize: "0.825rem", color: isLight ? "#059669" : "#34d399", fontStyle: "italic", marginTop: "0.25rem" }}>
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
                backgroundColor: isLight ? "#ffffff" : "#14141c",
                border: `1px solid ${isLight ? "#cbd5e1" : "#272733"}`,
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
                    fontFamily: "Geist Mono",
                    color: p.color,
                    padding: "0.2rem 0.6rem",
                    backgroundColor: isLight ? "#f8fafc" : "#1c1c24",
                    border: `1px solid ${p.color}40`,
                    borderRadius: "6px",
                  }}
                >
                  {p.pronoun}
                </span>
                <span style={{ fontSize: "0.72rem", color: isLight ? "#475569" : "#a1a1aa", fontWeight: "600" }}>
                  {p.replaces}
                </span>
              </div>

              <div style={{ fontSize: "0.78rem", color: isLight ? "#334155" : "#cbd5e1", lineHeight: 1.4 }}>
                <strong>Chức năng:</strong> {p.role}
              </div>

              <div
                style={{
                  fontSize: "0.75rem",
                  backgroundColor: isLight ? "#f8fafc" : "#0d1117",
                  padding: "0.5rem",
                  borderRadius: "6px",
                  borderLeft: `3px solid ${p.color}`,
                  color: isLight ? "#1e293b" : "#e2e8f0",
                }}
              >
                💡 {p.rule_tip}
              </div>

              <div style={{ marginTop: "auto", paddingTop: "0.5rem", borderTop: `1px dashed ${isLight ? "#e2e8f0" : "#272733"}` }}>
                <div style={{ fontSize: "0.825rem", color: isLight ? "#0f172a" : "#f4f4f5", fontWeight: "600" }}>
                  "{p.example}"
                </div>
                <div style={{ fontSize: "0.75rem", color: isLight ? "#059669" : "#34d399", fontStyle: "italic", marginTop: "0.15rem" }}>
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
                backgroundColor: isLight ? "#ffffff" : "#14141c",
                border: `1px solid ${c.type === "DEFINING" ? (isLight ? "#bfdbfe" : "#1e3a8a") : (isLight ? "#fde68a" : "#78350f")}`,
                borderTop: `4px solid ${c.type === "DEFINING" ? "#3b82f6" : "#f59e0b"}`,
                display: "flex",
                flexDirection: "column",
                gap: "0.65rem",
              }}
            >
              <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "700", color: isLight ? "#0f172a" : "#fafafa" }}>
                {c.title}
              </h4>
              <p style={{ margin: 0, fontSize: "0.8rem", color: isLight ? "#475569" : "#a1a1aa", lineHeight: 1.4 }}>
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
                  backgroundColor: isLight ? "#f8fafc" : "#0d1117",
                  border: `1px solid ${isLight ? "#e2e8f0" : "#272733"}`,
                }}
              >
                <div style={{ fontSize: "0.85rem", fontWeight: "700", color: isLight ? "#1e40af" : "#93c5fd" }}>
                  "{c.example}"
                </div>
                <div style={{ fontSize: "0.75rem", color: isLight ? "#475569" : "#94a3b8", marginTop: "0.25rem" }}>
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
                backgroundColor: isLight ? "#ffffff" : "#14141c",
                border: `1px solid ${isLight ? "#cbd5e1" : "#272733"}`,
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.9rem", fontWeight: "700", color: isLight ? "#0f172a" : "#fafafa" }}>
                  {r.pattern}
                </span>
                <span style={{ fontSize: "0.72rem", backgroundColor: isLight ? "#ecfdf5" : "#064e3b", color: isLight ? "#047857" : "#34d399", padding: "0.15rem 0.45rem", borderRadius: "4px", fontWeight: "700" }}>
                  QUY TẮC {idx + 1}
                </span>
              </div>

              <div style={{ fontSize: "0.8rem", color: isLight ? "#475569" : "#a1a1aa" }}>
                <strong>Điều kiện áp dụng:</strong> {r.condition}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", padding: "0.75rem", backgroundColor: isLight ? "#f8fafc" : "#0d1117", borderRadius: "6px" }}>
                <div style={{ fontSize: "0.8rem", color: isLight ? "#64748b" : "#94a3b8", textDecoration: "line-through" }}>
                  Câu gốc: "{r.original}"
                </div>
                <div style={{ fontSize: "0.875rem", fontWeight: "700", color: isLight ? "#15803d" : "#34d399" }}>
                  ➔ Rút gọn: "{r.reduced}"
                </div>
                <div style={{ fontSize: "0.72rem", color: isLight ? "#b45309" : "#fbbf24", marginTop: "0.15rem" }}>
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
