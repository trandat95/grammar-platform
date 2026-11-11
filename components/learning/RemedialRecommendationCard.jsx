import React from "react";
import { getThemeTokens } from "../../lib/tokens/design-tokens";
import { RADII } from "../../lib/tokens/spacing.tokens";
import { Badge, Button } from "../design-system";

export default function RemedialRecommendationCard({
  recommendation,
  onAccept,
  onDismiss,
  isLight = false,
}) {
  if (!recommendation) return null;
  const T = getThemeTokens(isLight);

  return (
    <div
      style={{
        backgroundColor: T.successBg,
        border: `1px solid ${T.successBorder}`,
        borderLeft: `4px solid ${T.success}`,
        borderRadius: RADII.radiusLg,
        padding: "1.15rem 1.35rem",
        marginTop: "1rem",
        boxShadow: T.shadow,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "0.6rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.25rem" }} aria-hidden="true">💡</span>
          <div>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: T.success, margin: 0 }}>
              Đề Xuất Lộ Trình Củng Cố Kiến Thức (Remedial Engine)
            </h4>
            <div style={{ fontSize: "0.75rem", color: T.textSecondary, marginTop: "0.15rem" }}>
              Phát hiện lỗ hổng: <strong>{recommendation.error_label || recommendation.detected_error}</strong>{" "}
              (Độ tin cậy: {Math.round((recommendation.confidence || 0.9) * 100)}%)
            </div>
          </div>
        </div>

        <Badge tone="success" isLight={isLight}>
          {recommendation.recommendation_type === "targeted_review" ? "Ôn lại bài cũ" : "Khuyên học bài mới"}
        </Badge>
      </div>

      {/* Reason Description */}
      <p style={{ fontSize: "0.85rem", color: T.text, lineHeight: 1.55, margin: "0 0 0.75rem 0" }}>
        {recommendation.reason}
      </p>

      {/* Suggested Actions Checklist */}
      {recommendation.suggested_actions && recommendation.suggested_actions.length > 0 && (
        <div
          style={{
            backgroundColor: T.card,
            border: `1px solid ${T.successBorder}`,
            borderRadius: RADII.radiusMd,
            padding: "0.65rem 0.85rem",
            marginBottom: "0.85rem",
          }}
        >
          <div style={{ fontSize: "0.72rem", fontFamily: "Geist Mono", color: T.success, fontWeight: 700, marginBottom: "0.3rem" }}>
            HÀNH ĐỘNG GỢI Ý ĐỂ KHẮC PHỤC:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {recommendation.suggested_actions.map((act, idx) => (
              <div key={idx} style={{ fontSize: "0.8rem", color: T.textSecondary }}>
                {act}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remedial Action Buttons */}
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
        {onAccept && (
          <Button variant="success" size="sm" isLight={isLight} onClick={() => onAccept(recommendation)}>
            <span>📖 Vào ôn bài: {recommendation.lesson_title}</span>
            <span>→</span>
          </Button>
        )}

        {onDismiss && (
          <Button variant="secondary" size="sm" isLight={isLight} onClick={onDismiss}>
            Tiếp tục câu sau
          </Button>
        )}
      </div>
    </div>
  );
}
