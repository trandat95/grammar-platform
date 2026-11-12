import React, { useState } from "react";
import AudioPlayer from "../audio/AudioPlayer";
import FocusTrapModal2026 from "../ui-2026/FocusTrapModal2026";
import { getThemeTokens } from "../../lib/tokens/design-tokens";
import {
  DIFFICULTY_LEVELS,
  adaptExplanationForLevel,
  FEEDBACK_ERROR_CATEGORIES,
} from "../../lib/explanation/explanation.schema";

export default function StructuredExplanation({
  explanation: initialExplanation,
  questionId,
  userId,
  isLight = false,
}) {
  const [currentLevel, setCurrentLevel] = useState(
    initialExplanation?.difficulty || DIFFICULTY_LEVELS.INTERMEDIATE
  );
  const [feedbackSent, setFeedbackSent] = useState(null); // 'helpful' | 'report_error'
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCategory, setReportCategory] = useState(FEEDBACK_ERROR_CATEGORIES[0]);
  const [reportComment, setReportComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!initialExplanation) return null;

  const T = getThemeTokens(isLight);
  const expl = adaptExplanationForLevel(initialExplanation, currentLevel);

  const handleSendFeedback = async (type, category = null, comment = null) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/explanation-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId || null,
          question_id: questionId || expl.question_id,
          explanation_version: expl.version || 1,
          feedback_type: type,
          error_category: category,
          comment: comment,
        }),
      });
      const data = await res.json();
      if (res.ok || data.isDuplicate) {
        setFeedbackSent(type);
        setShowReportModal(false);
      }
    } catch (err) {
      console.error("[Feedback Submit Error]:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryLabels = {
    incorrect_grammar_rule: "Sai quy tắc ngữ pháp",
    incorrect_translation: "Dịch nghĩa chưa chính xác",
    confusing_explanation: "Giải thích khó hiểu",
    missing_information: "Thiếu thông tin quan trọng",
    incorrect_exam_tip: "Exam tip không chính xác",
    other: "Lỗi khác",
  };

  return (
    <div
      style={{
        backgroundColor: T.card,
        border: `1px solid ${T.cardBorder}`,
        borderRadius: "12px",
        padding: "1.25rem 1.5rem",
        marginTop: "1rem",
        boxShadow: T.shadow,
      }}
    >
      {/* Header Bar with Difficulty Badges & Switcher */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
          paddingBottom: "1rem",
          borderBottom: `1px solid ${T.borderSubtle}`,
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.25rem" }} aria-hidden="true">🎓</span>
          <div>
            <h4
              style={{
                fontSize: "1rem",
                fontWeight: "700",
                color: T.textHeading,
                margin: 0,
              }}
            >
              Lời Giải Sư Phạm Chuẩn Hóa 5 Bước (Milestone 2.5)
            </h4>
            <div style={{ fontSize: "0.75rem", color: T.textMuted, marginTop: "0.15rem" }}>
              {expl.pedagogical_focus || "Phân tích ngữ cảnh và liên hệ quy tắc bài học"}
            </div>
          </div>
        </div>

        {/* Difficulty Level Switcher Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "0.75rem",
              fontFamily: "var(--font-sans)",
              color: T.textMuted,
              fontWeight: "600",
              marginRight: "0.2rem",
            }}
          >
            Cấp độ:
          </span>
          {Object.values(DIFFICULTY_LEVELS).map((lvl) => {
            const isSelected = lvl === currentLevel;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setCurrentLevel(lvl)}
                title={`Chuyển sang độ sâu giải thích: ${lvl}`}
                className="ds-focusable"
                style={{
                  padding: "0.25rem 0.6rem",
                  fontSize: "0.72rem",
                  fontFamily: "var(--font-sans)",
                  fontWeight: isSelected ? "700" : "500",
                  backgroundColor: isSelected ? T.accentBg : T.bgElevated,
                  color: isSelected ? T.accent : T.textMuted,
                  border: `1px solid ${isSelected ? T.accent : T.cardBorder}`,
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                {lvl}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5 CORE PEDAGOGICAL SECTIONS */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* 1. SIGNAL */}
        <div
          style={{
            backgroundColor: T.infoBg,
            border: `1px solid ${T.infoBorder}`,
            borderLeft: `4px solid ${T.accent}`,
            borderRadius: "8px",
            padding: "0.85rem 1.15rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.45rem" }}>
            <span style={{ fontSize: "1rem" }} aria-hidden="true">🔍</span>
            <span
              style={{
                fontSize: "0.78rem",
                fontFamily: "var(--font-sans)",
                fontWeight: "800",
                color: T.accent,
                textTransform: "uppercase",
              }}
            >
              1. Dấu Hiệu &amp; Ngữ Cảnh (Signal)
            </span>
          </div>

          {expl.signal?.keywords && expl.signal.keywords.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.45rem" }}>
              <span style={{ fontSize: "0.75rem", color: T.textMuted, fontWeight: "600" }}>Từ nhận biết vàng:</span>
              {expl.signal.keywords.map((kw, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: "0.75rem",
                    fontFamily: "var(--font-sans)",
                    padding: "0.15rem 0.5rem",
                    borderRadius: "4px",
                    backgroundColor: T.card,
                    border: `1px solid ${T.infoBorder}`,
                    color: T.info,
                    fontWeight: "700",
                  }}
                >
                  {kw}
                </span>
              ))}
            </div>
          )}

          {expl.signal?.grammar_clues &&
            expl.signal.grammar_clues.map((clue, idx) => (
              <div key={idx} style={{ fontSize: "0.88rem", color: T.text, lineHeight: "1.6" }}>
                {clue}
              </div>
            ))}
        </div>

        {/* 2. RULE & FORMULA */}
        <div
          style={{
            backgroundColor: T.successBg,
            border: `1px solid ${T.successBorder}`,
            borderLeft: `4px solid ${T.success}`,
            borderRadius: "8px",
            padding: "0.85rem 1.15rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.45rem" }}>
            <span style={{ fontSize: "1rem" }} aria-hidden="true">📐</span>
            <span
              style={{
                fontSize: "0.78rem",
                fontFamily: "var(--font-sans)",
                fontWeight: "800",
                color: T.success,
                textTransform: "uppercase",
              }}
            >
              2. Quy Tắc &amp; Công Thức (Rule &amp; Formula)
            </span>
          </div>

          {expl.rule?.formula && (
            <div
              className="ge-formula-box is-pos"
              style={{
                display: "inline-block",
                maxWidth: "100%",
                backgroundColor: T.card,
                border: `1px solid ${T.successBorder}`,
                borderLeft: `4px solid ${T.success}`,
                fontSize: "0.85rem",
                fontWeight: "700",
                color: T.success,
                marginBottom: "0.5rem",
                padding: "0.35rem 0.75rem",
              }}
            >
              Công thức: {expl.rule.formula}
            </div>
          )}

          <div style={{ fontSize: "0.88rem", color: T.text, lineHeight: "1.6" }}>
            {expl.rule?.explanation}
          </div>
        </div>

        {/* 3. TRANSLATION & VOCABULARY */}
        <div
          style={{
            backgroundColor: T.bgElevated,
            border: `1px solid ${T.cardBorder}`,
            borderRadius: "8px",
            padding: "0.85rem 1.15rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.45rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
              <span style={{ fontSize: "1rem" }} aria-hidden="true">🌐</span>
              <span
                style={{
                  fontSize: "0.78rem",
                  fontFamily: "var(--font-sans)",
                  fontWeight: "800",
                  color: T.textHeading,
                  textTransform: "uppercase",
                }}
              >
                3. Dịch Nghĩa Câu &amp; Từ Vựng (Translation)
              </span>
            </div>
            {expl.translation?.original && (
              <AudioPlayer text={expl.translation.original} isLight={isLight} compact={true} />
            )}
          </div>

          <div style={{ fontSize: "0.92rem", fontWeight: "600", color: T.textHeading, marginBottom: "0.3rem" }}>
            🇻🇳 {expl.translation?.vietnamese}
          </div>

          {expl.translation?.vocabulary && expl.translation.vocabulary.length > 0 && (
            <div style={{ marginTop: "0.6rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {expl.translation.vocabulary.map((voc, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: "0.75rem",
                    backgroundColor: T.card,
                    border: `1px solid ${T.borderSubtle}`,
                    padding: "0.25rem 0.5rem",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  <strong style={{ color: T.accent }}>{voc.word}</strong>:
                  <span style={{ color: T.textMuted }}>{voc.meaning}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. COMMON MISTAKES */}
        {expl.common_mistakes && expl.common_mistakes.length > 0 && (
          <div
            style={{
              backgroundColor: T.dangerBg,
              border: `1px solid ${T.dangerBorder}`,
              borderLeft: `4px solid ${T.danger}`,
              borderRadius: "8px",
              padding: "0.85rem 1.15rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.45rem" }}>
              <span style={{ fontSize: "1rem" }} aria-hidden="true">🚫</span>
              <span
                style={{
                  fontSize: "0.78rem",
                  fontFamily: "var(--font-sans)",
                  fontWeight: "800",
                  color: T.danger,
                  textTransform: "uppercase",
                }}
              >
                4. Bẫy Ngữ Pháp &amp; Lỗi Hay Gặp (Common Mistakes)
              </span>
            </div>

            {expl.common_mistakes.map((cm, idx) => (
              <div key={idx} style={{ fontSize: "0.85rem", color: T.text, lineHeight: "1.6" }}>
                <div>
                  <strong>Lỗi hay mắc:</strong> {cm.mistake}
                </div>
                <div style={{ marginTop: "0.2rem", color: T.textSecondary }}>
                  💡 <strong>Cách khắc phục:</strong> {cm.prevention_tip}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 5. EXAM TIPS */}
        {expl.exam_tips && expl.exam_tips.length > 0 && (
          <div
            style={{
              backgroundColor: T.warningBg,
              border: `1px solid ${T.warningBorder}`,
              borderLeft: `4px solid ${T.warning}`,
              borderRadius: "8px",
              padding: "0.85rem 1.15rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.45rem" }}>
              <span style={{ fontSize: "1rem" }} aria-hidden="true">⚡</span>
              <span
                style={{
                  fontSize: "0.78rem",
                  fontFamily: "var(--font-sans)",
                  fontWeight: "800",
                  color: T.warning,
                  textTransform: "uppercase",
                }}
              >
                5. Chiến Thuật Làm Bài &amp; Mẹo Thi Cử (Exam Tips)
              </span>
            </div>

            {expl.exam_tips.map((et, idx) => (
              <div key={idx} style={{ fontSize: "0.85rem", color: T.text, lineHeight: "1.6" }}>
                <div>
                  <strong>Chiến lược:</strong> {et.strategy}
                </div>
                <div style={{ marginTop: "0.15rem", fontStyle: "italic", color: T.textSecondary }}>{et.example}</div>
                {et.warning && (
                  <div style={{ marginTop: "0.2rem", fontWeight: "600", color: T.warning }}>
                    ⚠️ {et.warning}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FEEDBACK ACTION BAR */}
      <div
        style={{
          marginTop: "1.25rem",
          paddingTop: "1rem",
          borderTop: `1px solid ${T.borderSubtle}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <span style={{ fontSize: "0.8rem", color: T.textMuted }}>
          Bạn thấy lời giải sư phạm này thế nào?
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            type="button"
            disabled={feedbackSent !== null || isSubmitting}
            onClick={() => handleSendFeedback("helpful")}
            className="ds-focusable"
            style={{
              padding: "0.35rem 0.75rem",
              fontSize: "0.75rem",
              fontWeight: "600",
              borderRadius: "6px",
              backgroundColor: feedbackSent === "helpful" ? T.successBg : T.bgElevated,
              color: feedbackSent === "helpful" ? T.success : T.textSecondary,
              border: `1px solid ${feedbackSent === "helpful" ? T.successBorder : T.border}`,
              cursor: feedbackSent !== null ? "default" : "pointer",
            }}
          >
            {feedbackSent === "helpful" ? "✓ Đã đánh giá hữu ích" : "👍 Hữu ích"}
          </button>

          <button
            type="button"
            disabled={feedbackSent === "report_error" || isSubmitting}
            onClick={() => setShowReportModal(true)}
            className="ds-focusable"
            style={{
              padding: "0.35rem 0.75rem",
              fontSize: "0.75rem",
              fontWeight: "600",
              borderRadius: "6px",
              backgroundColor: feedbackSent === "report_error" ? T.dangerBg : T.bgElevated,
              color: feedbackSent === "report_error" ? T.danger : T.textSecondary,
              border: `1px solid ${feedbackSent === "report_error" ? T.dangerBorder : T.border}`,
              cursor: feedbackSent === "report_error" ? "default" : "pointer",
            }}
          >
            {feedbackSent === "report_error" ? "✓ Đã báo lỗi" : "⚠️ Báo lỗi"}
          </button>
        </div>
      </div>

      {/* REPORT ERROR MODAL (FocusTrap WCAG 2.2 AA) */}
      <FocusTrapModal2026
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="⚠️ Báo lỗi lời giải câu hỏi"
        maxWidth="460px"
      >
        <p style={{ fontSize: "0.85rem", color: T.textMuted, margin: "0 0 1rem 0" }}>
          Ý kiến của bạn sẽ được gửi trực tiếp tới Ban biên tập để rà soát và chuẩn hóa:
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
          {FEEDBACK_ERROR_CATEGORIES.map((cat) => (
            <label
              key={cat}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.85rem",
                color: T.text,
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="error_category"
                checked={reportCategory === cat}
                onChange={() => setReportCategory(cat)}
              />
              <span>{categoryLabels[cat]}</span>
            </label>
          ))}
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <label style={{ display: "block", fontSize: "0.8rem", color: T.textMuted, marginBottom: "0.35rem" }}>
            Mô tả chi tiết (không bắt buộc):
          </label>
          <textarea
            value={reportComment}
            onChange={(e) => setReportComment(e.target.value)}
            placeholder="Ví dụ: Chưa nêu rõ ngoại lệ thì tương lai đơn trong mệnh đề thời gian..."
            rows={3}
            className="ds-focusable"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "0.55rem 0.75rem",
              fontSize: "0.85rem",
              borderRadius: "6px",
              border: `1px solid ${T.border}`,
              backgroundColor: T.inputBg,
              color: T.text,
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => setShowReportModal(false)}
            className="ds-btn ds-focusable"
            style={{
              padding: "0.45rem 1rem",
              fontSize: "0.8rem",
              backgroundColor: T.bgElevated,
              border: `1px solid ${T.border}`,
              borderRadius: "6px",
              color: T.textSecondary,
              cursor: "pointer",
            }}
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSendFeedback("report_error", reportCategory, reportComment)}
            className="ds-btn ds-focusable"
            style={{
              padding: "0.45rem 1.25rem",
              fontSize: "0.8rem",
              fontWeight: "700",
              backgroundColor: "var(--ds-btn-danger)",
              border: "none",
              borderRadius: "6px",
              color: "#ffffff",
              cursor: isSubmitting ? "wait" : "pointer",
            }}
          >
            {isSubmitting ? "Đang gửi..." : "Gửi phản hồi"}
          </button>
        </div>
      </FocusTrapModal2026>
    </div>
  );
}
