import React, { useState } from "react";
import AudioPlayer from "../audio/AudioPlayer";
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
        backgroundColor: isLight ? "#ffffff" : "#111116",
        border: `1px solid ${isLight ? "#cbd5e1" : "#272733"}`,
        borderRadius: "12px",
        padding: "1.25rem 1.5rem",
        marginTop: "1rem",
        boxShadow: isLight ? "0 2px 10px rgba(0,0,0,0.04)" : "0 8px 24px rgba(0,0,0,0.3)",
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
          borderBottom: `1px solid ${isLight ? "#e2e8f0" : "#272733"}`,
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.25rem" }}>🎓</span>
          <div>
            <h4
              style={{
                fontSize: "1rem",
                fontWeight: "700",
                color: isLight ? "#0f172a" : "#fafafa",
                margin: 0,
              }}
            >
              Lời Giải Sư Phạm Chuẩn Hóa 5 Bước (Milestone 2.5)
            </h4>
            <div style={{ fontSize: "0.75rem", color: isLight ? "#475569" : "#a1a1aa", marginTop: "0.15rem" }}>
              {expl.pedagogical_focus || "Phân tích ngữ cảnh và liên hệ quy tắc bài học"}
            </div>
          </div>
        </div>

        {/* Difficulty Level Switcher Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <span style={{ fontSize: "0.75rem", fontFamily: "Geist Mono", color: isLight ? "#64748b" : "#71717a", fontWeight: "600", marginRight: "0.2rem" }}>
            Cấp độ:
          </span>
          {Object.values(DIFFICULTY_LEVELS).map((lvl) => {
            const isSelected = lvl === currentLevel;
            return (
              <button
                key={lvl}
                onClick={() => setCurrentLevel(lvl)}
                title={`Chuyển sang độ sâu giải thích: ${lvl}`}
                style={{
                  padding: "0.25rem 0.6rem",
                  fontSize: "0.72rem",
                  fontFamily: "Geist Mono",
                  fontWeight: isSelected ? "700" : "500",
                  backgroundColor: isSelected
                    ? (isLight ? "#eff6ff" : "#1e1b4b")
                    : (isLight ? "#f8fafc" : "#181822"),
                  color: isSelected
                    ? (isLight ? "#1d4ed8" : "#818cf8")
                    : (isLight ? "#475569" : "#71717a"),
                  border: `1px solid ${isSelected ? (isLight ? "#3b82f6" : "#4f46e5") : (isLight ? "#cbd5e1" : "#272733")}`,
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
            backgroundColor: isLight ? "#eff6ff" : "rgba(37, 99, 235, 0.08)",
            border: `1px solid ${isLight ? "#bfdbfe" : "#1e3a8a"}`,
            borderLeft: "4px solid #2563eb",
            borderRadius: "8px",
            padding: "0.85rem 1.15rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.45rem" }}>
            <span style={{ fontSize: "1rem" }}>🔍</span>
            <span style={{ fontSize: "0.78rem", fontFamily: "Geist Mono", fontWeight: "800", color: isLight ? "#1d4ed8" : "#60a5fa", textTransform: "uppercase" }}>
              1. Dấu Hiệu & Ngữ Cảnh (Signal)
            </span>
          </div>

          {expl.signal?.keywords && expl.signal.keywords.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.45rem" }}>
              <span style={{ fontSize: "0.75rem", color: isLight ? "#475569" : "#a1a1aa", fontWeight: "600" }}>Từ nhận biết vàng:</span>
              {expl.signal.keywords.map((kw, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: "0.75rem",
                    fontFamily: "Geist Mono",
                    padding: "0.15rem 0.5rem",
                    borderRadius: "4px",
                    backgroundColor: isLight ? "#ffffff" : "#1e293b",
                    border: `1px solid ${isLight ? "#93c5fd" : "#3b82f6"}`,
                    color: isLight ? "#1e40af" : "#93c5fd",
                    fontWeight: "700",
                  }}
                >
                  {kw}
                </span>
              ))}
            </div>
          )}

          {expl.signal?.grammar_clues && expl.signal.grammar_clues.map((clue, idx) => (
            <div key={idx} style={{ fontSize: "0.88rem", color: isLight ? "#1e293b" : "#e2e8f0", lineHeight: "1.6" }}>
              {clue}
            </div>
          ))}
        </div>

        {/* 2. RULE & CÔNG THỨC */}
        <div
          style={{
            backgroundColor: isLight ? "#f0fdf4" : "rgba(16, 185, 129, 0.08)",
            border: `1px solid ${isLight ? "#bbf7d0" : "#065f46"}`,
            borderLeft: "4px solid #10b981",
            borderRadius: "8px",
            padding: "0.85rem 1.15rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.45rem" }}>
            <span style={{ fontSize: "1rem" }}>📐</span>
            <span style={{ fontSize: "0.78rem", fontFamily: "Geist Mono", fontWeight: "800", color: isLight ? "#15803d" : "#34d399", textTransform: "uppercase" }}>
              2. Quy Tắc & Công Thức (Rule & Formula)
            </span>
          </div>

          {expl.rule?.formula && (
            <div
              style={{
                display: "inline-block",
                padding: "0.3rem 0.75rem",
                borderRadius: "6px",
                backgroundColor: isLight ? "#ffffff" : "#064e3b",
                border: `1px solid ${isLight ? "#86efac" : "#059669"}`,
                fontFamily: "Geist Mono",
                fontSize: "0.85rem",
                fontWeight: "700",
                color: isLight ? "#166534" : "#a7f3d0",
                marginBottom: "0.5rem",
              }}
            >
              Công thức: {expl.rule.formula}
            </div>
          )}

          <div style={{ fontSize: "0.88rem", color: isLight ? "#1e293b" : "#e2e8f0", lineHeight: "1.6" }}>
            {expl.rule?.explanation}
          </div>
        </div>

        {/* 3. TRANSLATION & VOCABULARY */}
        <div
          style={{
            backgroundColor: isLight ? "#f8fafc" : "#14141c",
            border: `1px solid ${isLight ? "#cbd5e1" : "#272733"}`,
            borderRadius: "8px",
            padding: "0.85rem 1.15rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.45rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
              <span style={{ fontSize: "1rem" }}>🌐</span>
              <span style={{ fontSize: "0.78rem", fontFamily: "Geist Mono", fontWeight: "800", color: isLight ? "#0f172a" : "#fafafa", textTransform: "uppercase" }}>
                3. Dịch Nghĩa Câu & Từ Vựng (Translation)
              </span>
            </div>
            {expl.translation?.original && (
              <AudioPlayer text={expl.translation.original} isLight={isLight} compact={true} />
            )}
          </div>

          <div style={{ fontSize: "0.92rem", fontWeight: "600", color: isLight ? "#0f172a" : "#fafafa", marginBottom: "0.3rem" }}>
            🇻🇳 {expl.translation?.vietnamese}
          </div>

          {expl.translation?.vocabulary && expl.translation.vocabulary.length > 0 && (
            <div style={{ marginTop: "0.6rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {expl.translation.vocabulary.map((voc, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: "0.75rem",
                    backgroundColor: isLight ? "#ffffff" : "#1c1c28",
                    border: `1px solid ${isLight ? "#e2e8f0" : "#2e2e42"}`,
                    padding: "0.25rem 0.5rem",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  <strong style={{ color: isLight ? "#2563eb" : "#38bdf8" }}>{voc.word}</strong>:
                  <span style={{ color: isLight ? "#475569" : "#a1a1aa" }}>{voc.meaning}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. COMMON MISTAKES */}
        {expl.common_mistakes && expl.common_mistakes.length > 0 && (
          <div
            style={{
              backgroundColor: isLight ? "#fff1f2" : "rgba(244, 63, 94, 0.08)",
              border: `1px solid ${isLight ? "#fecdd3" : "#881337"}`,
              borderLeft: "4px solid #f43f5e",
              borderRadius: "8px",
              padding: "0.85rem 1.15rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.45rem" }}>
              <span style={{ fontSize: "1rem" }}>🚫</span>
              <span style={{ fontSize: "0.78rem", fontFamily: "Geist Mono", fontWeight: "800", color: isLight ? "#be123c" : "#fb7185", textTransform: "uppercase" }}>
                4. Bẫy Ngữ Pháp & Lỗi Hay Gặp (Common Mistakes)
              </span>
            </div>

            {expl.common_mistakes.map((cm, idx) => (
              <div key={idx} style={{ fontSize: "0.85rem", color: isLight ? "#4c0519" : "#ffe4e6", lineHeight: "1.6" }}>
                <div><strong>Lỗi hay mắc:</strong> {cm.mistake}</div>
                <div style={{ marginTop: "0.2rem", color: isLight ? "#881337" : "#fda4af" }}>
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
              backgroundColor: isLight ? "#fffbeb" : "rgba(245, 158, 11, 0.08)",
              border: `1px solid ${isLight ? "#fde68a" : "#78350f"}`,
              borderLeft: "4px solid #f59e0b",
              borderRadius: "8px",
              padding: "0.85rem 1.15rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.45rem" }}>
              <span style={{ fontSize: "1rem" }}>⚡</span>
              <span style={{ fontSize: "0.78rem", fontFamily: "Geist Mono", fontWeight: "800", color: isLight ? "#b45309" : "#fbbf24", textTransform: "uppercase" }}>
                5. Chiến Thuật Làm Bài & Mẹo Thi Cử (Exam Tips)
              </span>
            </div>

            {expl.exam_tips.map((et, idx) => (
              <div key={idx} style={{ fontSize: "0.85rem", color: isLight ? "#78350f" : "#fef3c7", lineHeight: "1.6" }}>
                <div><strong>Chiến lược:</strong> {et.strategy}</div>
                <div style={{ marginTop: "0.15rem", fontStyle: "italic" }}>{et.example}</div>
                {et.warning && (
                  <div style={{ marginTop: "0.2rem", fontWeight: "600", color: isLight ? "#92400e" : "#fcd34d" }}>
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
          borderTop: `1px solid ${isLight ? "#e2e8f0" : "#272733"}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <span style={{ fontSize: "0.8rem", color: isLight ? "#475569" : "#a1a1aa" }}>
          Bạn thấy lời giải sư phạm này thế nào?
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Helpful Button */}
          <button
            disabled={feedbackSent !== null || isSubmitting}
            onClick={() => handleSendFeedback("helpful")}
            style={{
              padding: "0.35rem 0.75rem",
              fontSize: "0.75rem",
              fontWeight: "600",
              borderRadius: "6px",
              backgroundColor: feedbackSent === "helpful"
                ? (isLight ? "#dcfce7" : "#064e3b")
                : (isLight ? "#f1f5f9" : "#181820"),
              color: feedbackSent === "helpful"
                ? (isLight ? "#15803d" : "#4ade80")
                : (isLight ? "#334155" : "#a1a1aa"),
              border: `1px solid ${feedbackSent === "helpful" ? "#10b981" : (isLight ? "#cbd5e1" : "#272733")}`,
              cursor: feedbackSent !== null ? "default" : "pointer",
            }}
          >
            {feedbackSent === "helpful" ? "✓ Đã đánh giá hữu ích" : "👍 Hữu ích"}
          </button>

          {/* Report Error Button */}
          <button
            disabled={feedbackSent === "report_error" || isSubmitting}
            onClick={() => setShowReportModal(true)}
            style={{
              padding: "0.35rem 0.75rem",
              fontSize: "0.75rem",
              fontWeight: "600",
              borderRadius: "6px",
              backgroundColor: feedbackSent === "report_error"
                ? (isLight ? "#fee2e2" : "#450a0a")
                : (isLight ? "#f1f5f9" : "#181820"),
              color: feedbackSent === "report_error"
                ? (isLight ? "#dc2626" : "#f87171")
                : (isLight ? "#334155" : "#a1a1aa"),
              border: `1px solid ${feedbackSent === "report_error" ? "#f43f5e" : (isLight ? "#cbd5e1" : "#272733")}`,
              cursor: feedbackSent === "report_error" ? "default" : "pointer",
            }}
          >
            {feedbackSent === "report_error" ? "✓ Đã báo lỗi" : "⚠️ Báo lỗi"}
          </button>
        </div>
      </div>

      {/* REPORT ERROR MODAL */}
      {showReportModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: isLight ? "#ffffff" : "#181822",
              border: `1px solid ${isLight ? "#cbd5e1" : "#272733"}`,
              borderRadius: "12px",
              padding: "1.5rem",
              maxWidth: "460px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: isLight ? "#0f172a" : "#fafafa", margin: 0 }}>
                ⚠️ Báo lỗi lời giải câu hỏi
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", color: isLight ? "#64748b" : "#71717a", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "0.85rem", color: isLight ? "#475569" : "#a1a1aa", margin: "0 0 1rem 0" }}>
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
                    color: isLight ? "#0f172a" : "#e4e4e7",
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
              <label style={{ display: "block", fontSize: "0.8rem", color: isLight ? "#475569" : "#a1a1aa", marginBottom: "0.35rem" }}>
                Mô tả chi tiết (không bắt buộc):
              </label>
              <textarea
                value={reportComment}
                onChange={(e) => setReportComment(e.target.value)}
                placeholder="Ví dụ: Chưa nêu rõ ngoại lệ thì tương lai đơn trong mệnh đề thời gian..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "0.55rem 0.75rem",
                  fontSize: "0.85rem",
                  borderRadius: "6px",
                  border: `1px solid ${isLight ? "#cbd5e1" : "#2d2d3d"}`,
                  backgroundColor: isLight ? "#f8fafc" : "#0d0d12",
                  color: isLight ? "#0f172a" : "#fafafa",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button
                onClick={() => setShowReportModal(false)}
                style={{
                  padding: "0.45rem 1rem",
                  fontSize: "0.8rem",
                  backgroundColor: isLight ? "#f1f5f9" : "#27272a",
                  border: `1px solid ${isLight ? "#cbd5e1" : "#3f3f46"}`,
                  borderRadius: "6px",
                  color: isLight ? "#334155" : "#a1a1aa",
                  cursor: "pointer",
                }}
              >
                Hủy bỏ
              </button>
              <button
                disabled={isSubmitting}
                onClick={() => handleSendFeedback("report_error", reportCategory, reportComment)}
                style={{
                  padding: "0.45rem 1.25rem",
                  fontSize: "0.8rem",
                  fontWeight: "700",
                  backgroundColor: "#dc2626",
                  border: "none",
                  borderRadius: "6px",
                  color: "#ffffff",
                  cursor: isSubmitting ? "wait" : "pointer",
                }}
              >
                {isSubmitting ? "Đang gửi..." : "Gửi phản hồi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
