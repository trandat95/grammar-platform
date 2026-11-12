import React from "react";
import { getThemeTokens } from "../../lib/tokens/design-tokens";

const LEGEND_MAP = {
  timeline: [
    { color: "var(--ds-accent)", circle: true, label: "Đơn (Simple): Chấm điểm xác định" },
    { color: "var(--ds-success)", circle: true, label: "Tiếp diễn (Continuous): Khoảng kéo dài ~" },
    { color: "var(--ds-warning)", circle: true, label: "Hoàn thành (Perfect): Cầu nối trước ➔ sau" },
    { color: "var(--ds-purple)", circle: true, label: "Hoàn thành tiếp diễn: Kéo dài liên tục" },
  ],
  "decision-tree": [
    { color: "var(--ds-accent)", label: "Câu hỏi rẽ nhánh (Question Node)" },
    { color: "var(--ds-success)", label: "Kết luận loại câu điều kiện (Leaf Node)" },
    { color: "var(--ds-warning)", label: "Đảo ngữ (Inversion Rule)" },
  ],
  transformation: [
    { color: "var(--ds-accent)", label: "Chủ ngữ (Subject - S)" },
    { color: "var(--ds-warning)", label: "Động từ (Verb - V)" },
    { color: "var(--ds-success)", label: "Tân ngữ (Object - O)" },
    { color: "var(--ds-cyan)", label: "Tác nhân (By + O)" },
  ],
  "conversion-flow": [
    { color: "var(--ds-accent)", label: "Câu trực tiếp (Direct Speech)" },
    { color: "var(--ds-purple)", label: "Lùi thì (Backshift Step)" },
    { color: "var(--ds-success)", label: "Câu gián tiếp (Reported Speech)" },
  ],
  "sentence-tree": [
    { color: "var(--ds-accent)", label: "Danh từ đi trước (Antecedent)" },
    { color: "var(--ds-purple)", label: "Đại từ quan hệ (Pronoun)" },
    { color: "var(--ds-warning)", label: "Vị ngữ mệnh đề quan hệ" },
    { color: "var(--ds-success)", label: "Vị ngữ mệnh đề chính" },
  ],
  "comparison-scale": [
    { color: "var(--ds-success)", label: "Bằng nhau (=): as... as" },
    { color: "var(--ds-accent)", label: "Hơn (>): -er / more ... than" },
    { color: "var(--ds-purple)", label: "Nhất (MAX): the -est / the most" },
    { color: "var(--ds-warning)", label: "Kép (↗↗): The more... the more..." },
  ],
  "modal-matrix": [
    { color: "var(--ds-danger)", label: "0% Impossible (can't)" },
    { color: "var(--ds-warning)", label: "30-50% Possibility (might, may)" },
    { color: "var(--ds-accent)", label: "75% Expectation (should)" },
    { color: "var(--ds-success)", label: "100% Certainty (must)" },
  ],
  "word-family-tree": [
    { color: "var(--ds-success)", label: "Danh từ (Noun)" },
    { color: "var(--ds-danger)", label: "Động từ (Verb)" },
    { color: "var(--ds-accent)", label: "Tính từ (Adjective)" },
    { color: "var(--ds-purple)", label: "Trạng từ (Adverb)" },
  ],
};

export default function VisualizationLegend({ type, isLight = false }) {
  const items = LEGEND_MAP[type];
  if (!items) return null;
  const T = getThemeTokens(isLight);

  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        flexWrap: "wrap",
        padding: "0.65rem 1rem",
        backgroundColor: T.bgElevated,
        border: `1px solid ${T.borderSubtle}`,
        borderRadius: "8px",
        fontSize: "0.75rem",
        fontFamily: "var(--font-sans)",
        marginTop: "1rem",
      }}
    >
      {items.map((item) => (
        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: item.circle ? "50%" : "3px",
              backgroundColor: item.color,
            }}
          />
          <span style={{ color: T.textSecondary }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
