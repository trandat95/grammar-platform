import React, { useState, useEffect } from "react";
import StructuredExplanation from "../explanation/StructuredExplanation";
import { migrateQuestionExplanation } from "../../lib/explanation/explanation.migrator";

export default function DiagnosticQuestionReview({
  detailedAnswers = [],
  onClose,
  T,
  isLight,
}) {
  const [filterMode, setFilterMode] = useState("ALL"); // 'ALL' | 'INCORRECT' | 'CORRECT'

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const filteredQuestions = detailedAnswers.filter((q) => {
    if (filterMode === "INCORRECT") return !q.is_correct;
    if (filterMode === "CORRECT") return q.is_correct;
    return true;
  });

  const incorrectCount = detailedAnswers.filter((q) => !q.is_correct).length;
  const correctCount = detailedAnswers.filter((q) => q.is_correct).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chi tiết bài làm và giải thích sư phạm"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "880px",
          maxHeight: "90vh",
          backgroundColor: T.card,
          borderRadius: "1rem",
          border: `1px solid ${T.cardBorder}`,
          boxShadow: T.shadowElevated,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.75rem",
            borderBottom: `1px solid ${T.borderSubtle}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: isLight ? "#f8fafc" : "#121215",
          }}
        >
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: T.text, margin: 0 }}>
              Chi Tiết Bài Làm &amp; Giải Thích Sư Phạm (30 Câu)
            </h3>
            <p style={{ fontSize: "0.8rem", color: T.textMuted, margin: "0.25rem 0 0 0" }}>
              Xem lại từng câu, đối chiếu đáp án và nắm vững quy tắc giải quyết câu hỏi.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: isLight ? "#e2e8f0" : "#27272a",
              color: T.text,
              border: "none",
              fontSize: "1.1rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Filter Pills */}
        <div
          style={{
            padding: "0.75rem 1.75rem",
            borderBottom: `1px solid ${T.borderSubtle}`,
            display: "flex",
            gap: "0.75rem",
            backgroundColor: isLight ? "#ffffff" : "#18181b",
          }}
        >
          <button
            onClick={() => setFilterMode("ALL")}
            style={{
              padding: "0.35rem 0.85rem",
              borderRadius: "9999px",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              backgroundColor: filterMode === "ALL" ? T.accent : isLight ? "#f1f5f9" : "#27272a",
              color: filterMode === "ALL" ? "#ffffff" : T.text,
              border: "none",
            }}
          >
            Tất cả (30)
          </button>

          <button
            onClick={() => setFilterMode("INCORRECT")}
            style={{
              padding: "0.35rem 0.85rem",
              borderRadius: "9999px",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              backgroundColor: filterMode === "INCORRECT" ? T.danger : isLight ? "#fee2e2" : "#7f1d1d",
              color: filterMode === "INCORRECT" ? "#ffffff" : isLight ? "#dc2626" : "#fca5a5",
              border: "none",
            }}
          >
            🔴 Câu sai ({incorrectCount})
          </button>

          <button
            onClick={() => setFilterMode("CORRECT")}
            style={{
              padding: "0.35rem 0.85rem",
              borderRadius: "9999px",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              backgroundColor: filterMode === "CORRECT" ? T.success : isLight ? "#dcfce7" : "#064e3b",
              color: filterMode === "CORRECT" ? "#ffffff" : isLight ? "#15803d" : "#86efac",
              border: "none",
            }}
          >
            🟢 Câu đúng ({correctCount})
          </button>
        </div>

        {/* Question List Scrollable */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.5rem 1.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}
        >
          {filteredQuestions.map((q) => (
            <div
              key={q.question_id}
              style={{
                borderRadius: "0.75rem",
                padding: "1.5rem",
                backgroundColor: isLight ? "#f8fafc" : "#18181b",
                border: `1px solid ${q.is_correct ? (isLight ? "#a7f3d0" : "#064e3b") : isLight ? "#fecaca" : "#7f1d1d"}`,
              }}
            >
              {/* Question Meta */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.75rem",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: "0.9rem",
                      color: T.text,
                    }}
                  >
                    Câu {q.index}:
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      padding: "0.15rem 0.5rem",
                      borderRadius: "0.3rem",
                      backgroundColor: isLight ? "#e2e8f0" : "#27272a",
                      color: T.textMuted,
                    }}
                  >
                    {q.topic_vi}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      padding: "0.2rem 0.6rem",
                      borderRadius: "9999px",
                      backgroundColor: q.is_correct ? (isLight ? "#dcfce7" : "#064e3b") : isLight ? "#fee2e2" : "#7f1d1d",
                      color: q.is_correct ? (isLight ? "#15803d" : "#86efac") : isLight ? "#dc2626" : "#fca5a5",
                    }}
                  >
                    {q.is_correct ? "✓ Trả lời Đúng" : "✕ Trả lời Sai"}
                  </span>
                  {q.time_spent_seconds > 0 && (
                    <span style={{ fontSize: "0.75rem", color: T.textMuted }}>
                      ⏱️ {q.time_spent_seconds}s
                    </span>
                  )}
                </div>
              </div>

              {/* Stem */}
              <p style={{ fontSize: "1.05rem", fontWeight: 600, color: T.text, marginBottom: "1rem" }}>
                {q.stem}
              </p>

              {/* Options Breakdown */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1.25rem" }}>
                {(q.options || []).map((opt) => {
                  const isUserSelection = q.selected_answer === opt.key;
                  const isAnswerCorrect = q.correct_answer === opt.key;

                  let optBg = isLight ? "#ffffff" : "#27272a";
                  let optBorder = T.borderSubtle;
                  let optColor = T.textSecondary;

                  if (isAnswerCorrect) {
                    optBg = isLight ? "#dcfce7" : "#064e3b";
                    optBorder = isLight ? "#86efac" : "#10b981";
                    optColor = isLight ? "#15803d" : "#86efac";
                  } else if (isUserSelection && !q.is_correct) {
                    optBg = isLight ? "#fee2e2" : "#7f1d1d";
                    optBorder = isLight ? "#fca5a5" : "#ef4444";
                    optColor = isLight ? "#dc2626" : "#fca5a5";
                  }

                  return (
                    <div
                      key={opt.key}
                      style={{
                        padding: "0.6rem 0.85rem",
                        borderRadius: "0.5rem",
                        border: `1px solid ${optBorder}`,
                        backgroundColor: optBg,
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <strong style={{ minWidth: "18px" }}>{opt.key}.</strong>
                      <span style={{ color: optColor }}>{opt.text}</span>
                      {isAnswerCorrect && <span style={{ marginLeft: "auto", fontSize: "0.8rem" }}>✅</span>}
                      {isUserSelection && !q.is_correct && <span style={{ marginLeft: "auto", fontSize: "0.8rem" }}>❌</span>}
                    </div>
                  );
                })}
              </div>

              {/* Pedagogical Explanation Card */}
              {q.pedagogy && (
                <div style={{ marginTop: "1rem" }}>
                  <StructuredExplanation
                    explanation={migrateQuestionExplanation({
                      id: q.question_id,
                      topic_name: q.topic_vi || "Ngữ pháp",
                      stem: q.stem,
                      answer: (q.options || []).find((o) => o.key === q.correct_answer)?.text || q.correct_answer,
                      pedagogy: {
                        translation: q.pedagogy.translation || "",
                        common_mistakes: Array.isArray(q.pedagogy.common_mistakes)
                          ? q.pedagogy.common_mistakes.map((m) =>
                              typeof m === "string"
                                ? {
                                    mistake: m,
                                    reason: q.pedagogy.rule?.explanation || "Nhầm dấu hiệu hoặc cấu trúc.",
                                    correction: (q.options || []).find((o) => o.key === q.correct_answer)?.text || q.correct_answer,
                                    prevention_tip: q.pedagogy.signal?.grammar_clues?.[0] || "Kiểm tra lại từ khóa nhận biết.",
                                  }
                                : m
                            )
                          : [],
                        exam_tips: Array.isArray(q.pedagogy.exam_tips)
                          ? q.pedagogy.exam_tips.map((tip) =>
                              typeof tip === "string"
                                ? {
                                    strategy: tip,
                                    example: q.stem,
                                    warning: q.pedagogy.rule?.formula || "Đối chiếu chủ ngữ và mốc thời gian.",
                                  }
                                : tip
                            )
                          : [],
                      },
                      explanation: q.pedagogy.rule?.explanation || "",
                    })}
                    questionId={q.question_id}
                    isLight={isLight}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
