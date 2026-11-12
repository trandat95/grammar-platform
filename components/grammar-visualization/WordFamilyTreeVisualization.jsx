import React, { useState } from "react";
import AudioPlayer from "../audio/AudioPlayer";

export const WORD_FAMILY_TREE_TYPE = "word-family-tree";

export default function WordFamilyTreeVisualization({ data, isLight = false }) {
  const [activeTab, setActiveTab] = useState("family_tree"); // 'family_tree' | 'suffix_rules'
  const [selectedRootWord, setSelectedRootWord] = useState("SUCCESS");

  const curFamily =
    data.word_families.find((f) => f.root === selectedRootWord) ||
    data.word_families[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Top Navigation */}
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
          { id: "family_tree", label: "🌳 Cây Phân Nhánh Họ Từ (Word Tree)", desc: "Root -> Noun / Verb / Adj / Adv" },
          { id: "suffix_rules", label: "✨ Hậu Tố Nhận Diện Vàng & Vị Trí", desc: "-tion, -ment, -ful, -able, -ize, -ly" },
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

      {/* VIEW 1: WORD FAMILY TREE */}
      {activeTab === "family_tree" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Root Word Selector Pills */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {data.word_families.map((item) => (
              <button
                key={item.root}
                onClick={() => setSelectedRootWord(item.root)}
                style={{
                  padding: "0.45rem 0.85rem",
                  borderRadius: "6px",
                  fontSize: "0.78rem",
                  fontFamily: "Geist Mono",
                  fontWeight: selectedRootWord === item.root ? "800" : "500",
                  backgroundColor: selectedRootWord === item.root ? "var(--ds-btn-primary)" : "var(--ds-bg-elevated)",
                  color: selectedRootWord === item.root ? "#ffffff" : "var(--ds-text-secondary)",
                  border: `1px solid ${selectedRootWord === item.root ? "var(--ds-accent)" : "var(--ds-border)"}`,
                  cursor: "pointer",
                }}
              >
                {item.root} ({item.vietnamese_concept})
              </button>
            ))}
          </div>

          {/* Central Root Tree Visualization */}
          <div
            style={{
              padding: "1.5rem",
              borderRadius: "12px",
              backgroundColor: "var(--ds-bg-elevated)",
              border: `1px solid ${"var(--ds-card-border)"}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1.5rem",
            }}
          >
            {/* Center Root Node */}
            <div
              style={{
                padding: "0.75rem 1.75rem",
                borderRadius: "999px",
                backgroundColor: "var(--ds-card)",
                border: "2px solid var(--ds-accent)",
                boxShadow: "0 0 20px rgba(56, 189, 248, 0.25)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.7rem", color: "var(--ds-border-strong)", fontWeight: "700", textTransform: "uppercase" }}>
                GỐC TỪ CỐT LÕI (ROOT)
              </div>
              <div style={{ fontSize: "1.35rem", fontWeight: "900", color: "var(--ds-accent)", fontFamily: "Geist Mono" }}>
                {curFamily.root}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--ds-success)", fontWeight: "600", marginTop: "0.15rem" }}>
                🇻🇳 {curFamily.vietnamese_concept}
              </div>
            </div>

            {/* Tree Branches (4 Parts of Speech) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "1rem",
                width: "100%",
              }}
            >
              {/* Branch 1: NOUN */}
              <div
                style={{
                  padding: "1rem",
                  borderRadius: "8px",
                  backgroundColor: "var(--ds-card)",
                  border: `2px solid var(--ds-success)`,
                  borderTop: "6px solid var(--ds-success)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--ds-success)", textTransform: "uppercase" }}>
                    Danh Từ (Noun)
                  </span>
                  <span style={{ fontSize: "0.75rem", fontFamily: "Geist Mono", color: "var(--ds-text-muted)" }}>
                    {curFamily.noun.phonetic}
                  </span>
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--ds-text-heading)", fontFamily: "Geist Mono" }}>
                  {curFamily.noun.word}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--ds-text-muted)", marginTop: "0.2rem" }}>
                  "{curFamily.noun.example}"
                </div>
                <div style={{ marginTop: "auto", paddingTop: "0.4rem" }}>
                  <AudioPlayer text={curFamily.noun.example} isLight={isLight} mode="compact" />
                </div>
              </div>

              {/* Branch 2: VERB */}
              <div
                style={{
                  padding: "1rem",
                  borderRadius: "8px",
                  backgroundColor: "var(--ds-card)",
                  border: `2px solid var(--ds-danger)`,
                  borderTop: "6px solid var(--ds-danger)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--ds-danger)", textTransform: "uppercase" }}>
                    Động Từ (Verb)
                  </span>
                  <span style={{ fontSize: "0.75rem", fontFamily: "Geist Mono", color: "var(--ds-text-muted)" }}>
                    {curFamily.verb.phonetic}
                  </span>
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--ds-text-heading)", fontFamily: "Geist Mono" }}>
                  {curFamily.verb.word}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--ds-text-muted)", marginTop: "0.2rem" }}>
                  "{curFamily.verb.example}"
                </div>
                <div style={{ marginTop: "auto", paddingTop: "0.4rem" }}>
                  <AudioPlayer text={curFamily.verb.example} isLight={isLight} mode="compact" />
                </div>
              </div>

              {/* Branch 3: ADJECTIVE */}
              <div
                style={{
                  padding: "1rem",
                  borderRadius: "8px",
                  backgroundColor: "var(--ds-card)",
                  border: `2px solid var(--ds-accent)`,
                  borderTop: "6px solid var(--ds-accent)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--ds-accent)", textTransform: "uppercase" }}>
                    Tính Từ (Adjective)
                  </span>
                  <span style={{ fontSize: "0.75rem", fontFamily: "Geist Mono", color: "var(--ds-text-muted)" }}>
                    {curFamily.adjective.phonetic}
                  </span>
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--ds-text-heading)", fontFamily: "Geist Mono" }}>
                  {curFamily.adjective.word}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--ds-text-muted)", marginTop: "0.2rem" }}>
                  "{curFamily.adjective.example}"
                </div>
                <div style={{ marginTop: "auto", paddingTop: "0.4rem" }}>
                  <AudioPlayer text={curFamily.adjective.example} isLight={isLight} mode="compact" />
                </div>
              </div>

              {/* Branch 4: ADVERB */}
              <div
                style={{
                  padding: "1rem",
                  borderRadius: "8px",
                  backgroundColor: "var(--ds-card)",
                  border: `2px solid var(--ds-purple)`,
                  borderTop: "6px solid var(--ds-purple)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--ds-purple)", textTransform: "uppercase" }}>
                    Trạng Từ (Adverb)
                  </span>
                  <span style={{ fontSize: "0.75rem", fontFamily: "Geist Mono", color: "var(--ds-text-muted)" }}>
                    {curFamily.adverb.phonetic}
                  </span>
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--ds-text-heading)", fontFamily: "Geist Mono" }}>
                  {curFamily.adverb.word}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--ds-text-muted)", marginTop: "0.2rem" }}>
                  "{curFamily.adverb.example}"
                </div>
                <div style={{ marginTop: "auto", paddingTop: "0.4rem" }}>
                  <AudioPlayer text={curFamily.adverb.example} isLight={isLight} mode="compact" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: SUFFIX RULES & SENTENCE POSITIONS */}
      {activeTab === "suffix_rules" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
          {data.suffix_rules.map((rule, idx) => (
            <div
              key={idx}
              style={{
                padding: "1.15rem",
                borderRadius: "10px",
                backgroundColor: "var(--ds-card)",
                border: `1px solid ${"var(--ds-border)"}`,
                borderTop: `4px solid ${rule.color}`,
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "800", color: "var(--ds-text-heading)" }}>
                  {rule.part_of_speech}
                </h4>
                <span style={{ fontSize: "0.7rem", fontFamily: "Geist Mono", fontWeight: "700", color: rule.color, backgroundColor: `${rule.color}20`, padding: "0.15rem 0.45rem", borderRadius: "4px" }}>
                  {rule.badge}
                </span>
              </div>

              <div style={{ fontSize: "0.78rem", color: "var(--ds-text-secondary)" }}>
                📍 <strong>Vị trí đứng trong câu:</strong> {rule.position}
              </div>

              {rule.formula && (
                <div style={{ fontSize: "0.78rem", color: "var(--ds-accent)", fontWeight: "600" }}>
                  📐 <strong>Công thức:</strong> {rule.formula}
                </div>
              )}

              {rule.special_notes && (
                <div style={{ fontSize: "0.72rem", backgroundColor: "var(--ds-warning-bg)", color: "var(--ds-warning)", padding: "0.35rem 0.5rem", borderRadius: "4px" }}>
                  ⚠️ {rule.special_notes}
                </div>
              )}

              {/* Suffixes list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginTop: "0.25rem" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "var(--ds-text-muted)", textTransform: "uppercase" }}>
                  Hậu tố nhận diện thường gặp:
                </div>
                {rule.suffixes.map((s, sIdx) => (
                  <div
                    key={sIdx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.3rem 0.5rem",
                      borderRadius: "4px",
                      backgroundColor: "var(--ds-bg-elevated)",
                      fontSize: "0.75rem",
                    }}
                  >
                    <span style={{ fontWeight: "800", color: rule.color, fontFamily: "Geist Mono" }}>
                      {s.suffix}
                    </span>
                    <span style={{ color: "var(--ds-text-muted)" }}>{s.example}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "auto", paddingTop: "0.5rem", borderTop: `1px dashed ${"var(--ds-card-border)"}` }}>
                <div style={{ fontSize: "0.8rem", color: "var(--ds-accent)", fontWeight: "600" }}>
                  "{rule.sample_sentence}"
                </div>
                <div style={{ marginTop: "0.35rem" }}>
                  <AudioPlayer text={rule.sample_sentence_audio} isLight={isLight} mode="compact" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
