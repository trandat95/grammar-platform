import React from "react";

export default function RemedialRecommendationCard({
  recommendation,
  onAccept,
  onDismiss,
  isLight = false,
}) {
  if (!recommendation) return null;

  return (
    <div
      style={{
        backgroundColor: isLight ? "#f0fdf4" : "rgba(16, 185, 129, 0.08)",
        border: `1px solid ${isLight ? "#86efac" : "rgba(16, 185, 129, 0.3)"}`,
        borderLeft: "4px solid #10b981",
        borderRadius: "10px",
        padding: "1.15rem 1.35rem",
        marginTop: "1rem",
        boxShadow: isLight ? "0 2px 8px rgba(16, 185, 129, 0.08)" : "0 4px 16px rgba(0,0,0,0.2)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.6rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.25rem" }}>💡</span>
          <div>
            <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: isLight ? "#166534" : "#34d399", margin: 0 }}>
              Đề Xuất Lộ Trình Củng Cố Kiến Thức (Remedial Engine)
            </h4>
            <div style={{ fontSize: "0.75rem", color: isLight ? "#15803d" : "#a7f3d0", marginTop: "0.15rem" }}>
              Phát hiện lỗ hổng: <strong>{recommendation.error_label || recommendation.detected_error}</strong> (Độ tin cậy: {Math.round((recommendation.confidence || 0.9) * 100)}%)
            </div>
          </div>
        </div>

        <span
          style={{
            fontSize: "0.68rem",
            fontFamily: "Geist Mono",
            padding: "0.15rem 0.5rem",
            borderRadius: "999px",
            backgroundColor: isLight ? "#dcfce7" : "#064e3b",
            color: isLight ? "#15803d" : "#4ade80",
            border: `1px solid ${isLight ? "#86efac" : "#059669"}`,
            fontWeight: "700",
            textTransform: "uppercase",
          }}
        >
          {recommendation.recommendation_type === "targeted_review" ? "Ôn lại bài cũ" : "Khuyên học bài mới"}
        </span>
      </div>

      {/* Reason Description */}
      <p style={{ fontSize: "0.85rem", color: isLight ? "#14532d" : "#e2e8f0", lineHeight: "1.55", margin: "0 0 0.75rem 0" }}>
        {recommendation.reason}
      </p>

      {/* Suggested Actions Checklist */}
      {recommendation.suggested_actions && recommendation.suggested_actions.length > 0 && (
        <div
          style={{
            backgroundColor: isLight ? "#ffffff" : "#121218",
            border: `1px solid ${isLight ? "#bbf7d0" : "#1f1f2e"}`,
            borderRadius: "6px",
            padding: "0.6rem 0.85rem",
            marginBottom: "0.85rem",
          }}
        >
          <div style={{ fontSize: "0.72rem", fontFamily: "Geist Mono", color: isLight ? "#15803d" : "#34d399", fontWeight: "700", marginBottom: "0.3rem" }}>
            HÀNH ĐỘNG GỢI Ý ĐỂ KHẮC PHỤC:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {recommendation.suggested_actions.map((act, idx) => (
              <div key={idx} style={{ fontSize: "0.8rem", color: isLight ? "#334155" : "#cbd5e1" }}>
                {act}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remedial Action Buttons */}
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
        {onAccept && (
          <button
            onClick={() => onAccept(recommendation)}
            style={{
              padding: "0.45rem 1rem",
              fontSize: "0.8rem",
              fontWeight: "700",
              backgroundColor: isLight ? "#15803d" : "#10b981",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              boxShadow: "0 2px 6px rgba(16, 185, 129, 0.25)",
            }}
          >
            <span>📖 Vào ôn bài: {recommendation.lesson_title}</span>
            <span>→</span>
          </button>
        )}

        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              padding: "0.45rem 0.85rem",
              fontSize: "0.8rem",
              backgroundColor: "transparent",
              color: isLight ? "#475569" : "#a1a1aa",
              border: `1px solid ${isLight ? "#cbd5e1" : "#2d2d3d"}`,
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Tiếp tục câu sau
          </button>
        )}
      </div>
    </div>
  );
}
