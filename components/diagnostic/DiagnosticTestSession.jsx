import React, { useState, useEffect, useCallback } from "react";
import FocusTrapModal2026 from "../ui-2026/FocusTrapModal2026";

export default function DiagnosticTestSession({
  test,
  onExit,
  onSubmit,
  isSubmitting,
  T,
  isLight,
}) {
  const questions = test?.questions || [];
  const totalQuestions = questions.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: { selected_answer: "A", time_spent: 12 } }
  const [flagged, setFlagged] = useState({}); // { [questionId]: true }
  const [secondsRemaining, setSecondsRemaining] = useState(test?.time_limit_seconds || 1200);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  // Current active question
  const currentQ = questions[currentIndex] || {};
  const currentAnswer = answers[currentQ.id]?.selected_answer || "";
  const isCurrentFlagged = !!flagged[currentQ.id];

  // Record time spent on question transition
  const recordQuestionTime = useCallback(() => {
    if (!currentQ.id) return;
    const now = Date.now();
    const elapsedSeconds = Math.max(1, Math.round((now - questionStartTime) / 1000));
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        selected_answer: prev[currentQ.id]?.selected_answer || "",
        time_spent_seconds: (prev[currentQ.id]?.time_spent_seconds || 0) + elapsedSeconds,
      },
    }));
    setQuestionStartTime(now);
  }, [currentQ.id, questionStartTime]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit when time runs out
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Keyboard navigation & quick selection (A, B, C, D)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if inside an input
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

      const key = e.key.toUpperCase();
      if (["A", "B", "C", "D"].includes(key)) {
        handleSelectAnswer(key);
      } else if (e.key === "ArrowRight" && currentIndex < totalQuestions - 1) {
        handleNext();
      } else if (e.key === "ArrowLeft" && currentIndex > 0) {
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, totalQuestions, currentQ.id]);

  const handleSelectAnswer = (optionKey) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        selected_answer: optionKey,
        time_spent_seconds: (prev[currentQ.id]?.time_spent_seconds || 0) + 1,
      },
    }));
  };

  const toggleFlag = () => {
    setFlagged((prev) => ({
      ...prev,
      [currentQ.id]: !prev[currentQ.id],
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      recordQuestionTime();
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      recordQuestionTime();
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleJumpToQuestion = (idx) => {
    recordQuestionTime();
    setCurrentIndex(idx);
  };

  // Stats
  const answeredCount = Object.values(answers).filter((a) => !!a.selected_answer).length;
  const unansweredCount = totalQuestions - answeredCount;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;
  const progressPct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const prepareSubmissionPayload = () => {
    const totalElapsed = (test?.time_limit_seconds || 1200) - secondsRemaining;
    const formattedAnswers = questions.map((q) => ({
      question_id: q.id,
      selected_answer: answers[q.id]?.selected_answer || "",
      time_spent_seconds: answers[q.id]?.time_spent_seconds || 0,
    }));
    return {
      test_id: test.id,
      answers: formattedAnswers,
      duration_seconds: totalElapsed,
    };
  };

  const handleAutoSubmit = () => {
    const payload = prepareSubmissionPayload();
    onSubmit(payload);
  };

  const handleConfirmSubmit = () => {
    setShowSubmitModal(false);
    recordQuestionTime();
    const payload = prepareSubmissionPayload();
    onSubmit(payload);
  };

  return (
    <div
      className="ge-diag-wrap"
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "1.5rem 1rem",
        minHeight: "85vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Header Bar */}
      <div
        className="ge-diag-topbar"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.85rem 1.25rem",
          backgroundColor: T.card,
          borderRadius: "0.85rem",
          border: `1px solid ${T.cardBorder}`,
          boxShadow: T.shadow,
          marginBottom: "1.25rem",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        {/* Exit Button */}
        <button
          onClick={() => {
            if (window.confirm("Bạn có chắc chắn muốn thoát bài kiểm tra? Tiến độ chưa nộp sẽ bị hủy.")) {
              onExit();
            }
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.45rem 0.85rem",
            borderRadius: "0.5rem",
            backgroundColor: "transparent",
            color: T.textMuted,
            border: `1px solid ${T.borderSubtle}`,
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <span>✕</span>
          <span>Thoát</span>
        </button>

        {/* Progress & Question Info */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: T.text }}>
              Câu {currentIndex + 1} / {totalQuestions}
            </span>
            <span style={{ fontSize: "0.75rem", color: T.textMuted, marginLeft: "0.5rem" }}>
              ({answeredCount} đã trả lời)
            </span>
          </div>
        </div>

        {/* Timer Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.4rem 0.9rem",
            borderRadius: "9999px",
            backgroundColor: secondsRemaining < 180 ? T.dangerBg : "var(--ds-bg-elevated)",
            border: `1px solid ${secondsRemaining < 180 ? T.dangerBorder : T.borderSubtle}`,
            color: secondsRemaining < 180 ? T.danger : T.text,
            fontWeight: 700,
            fontSize: "0.95rem",
            letterSpacing: "0.05em",
          }}
        >
          <span>⏱️</span>
          <span>{formatTimer(secondsRemaining)}</span>
        </div>
      </div>

      {/* Progress Bar Line */}
      <div
        style={{
          width: "100%",
          height: "6px",
          backgroundColor: "var(--ds-card-border)",
          borderRadius: "9999px",
          overflow: "hidden",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progressPct}%`,
            backgroundColor: T.accent,
            borderRadius: "9999px",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      {/* Question Card */}
      <div
        className="ge-diag-card"
        style={{
          backgroundColor: T.card,
          borderRadius: "1rem",
          padding: "2rem",
          border: `1px solid ${T.cardBorder}`,
          boxShadow: T.shadow,
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Topic & Difficulty Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.25rem",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                padding: "0.25rem 0.75rem",
                borderRadius: "9999px",
                backgroundColor: "var(--ds-accent-bg)",
                color: "var(--ds-accent)",
                border: `1px solid ${"var(--ds-accent-border)"}`,
              }}
            >
              Chuyên đề: {currentQ.topic_vi || currentQ.topic}
            </span>

            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 600,
                padding: "0.2rem 0.6rem",
                borderRadius: "9999px",
                backgroundColor:
                  currentQ.difficulty === "easy"
                    ? "var(--ds-success-bg)"
                    : currentQ.difficulty === "medium"
                    ? "var(--ds-warning-bg)"
                    : "var(--ds-danger-bg)",
                color:
                  currentQ.difficulty === "easy"
                    ? "var(--ds-success)"
                    : currentQ.difficulty === "medium"
                    ? "var(--ds-warning)"
                    : "var(--ds-danger)",
              }}
            >
              {currentQ.difficulty === "easy" ? "🟢 Dễ" : currentQ.difficulty === "medium" ? "🟡 Trung bình" : "🔴 Khó"}
            </span>
          </div>

          {/* Flag Toggle */}
          <button
            onClick={toggleFlag}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.8rem",
              fontWeight: 600,
              padding: "0.3rem 0.75rem",
              borderRadius: "0.5rem",
              backgroundColor: isCurrentFlagged
                ? "var(--ds-warning-bg)"
                : "transparent",
              color: isCurrentFlagged
                ? "var(--ds-warning)"
                : T.textMuted,
              border: `1px solid ${isCurrentFlagged ? "var(--ds-warning-border)" : T.borderSubtle}`,
              cursor: "pointer",
            }}
          >
            <span>🚩</span>
            <span>{isCurrentFlagged ? "Đã đánh dấu" : "Đánh dấu xem lại"}</span>
          </button>
        </div>

        {/* Question Prompt (Stem) */}
        <div style={{ marginBottom: "2rem" }}>
          <p
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              color: T.text,
              lineHeight: 1.5,
              whiteSpace: "pre-line",
            }}
          >
            {currentQ.stem}
          </p>
        </div>

        {/* 4 Radio Options (A, B, C, D) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "2rem" }}>
          {(currentQ.options || []).map((opt) => {
            const isSelected = currentAnswer === opt.key;
            return (
              <div
                key={opt.key}
                onClick={() => handleSelectAnswer(opt.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1rem 1.25rem",
                  borderRadius: "0.75rem",
                  backgroundColor: isSelected
                    ? "var(--ds-accent-bg)"
                    : "var(--ds-card)",
                  border: `2px solid ${
                    isSelected ? T.accent : "var(--ds-card-border)"
                  }`,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: isSelected ? "0 2px 8px rgba(37, 99, 235, 0.15)" : "none",
                }}
              >
                {/* Circle Key */}
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    backgroundColor: isSelected ? "var(--ds-btn-primary)" : "var(--ds-bg-elevated)",
                    color: isSelected ? "#ffffff" : T.text,
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                  }}
                >
                  {opt.key}
                </div>

                {/* Option Text */}
                <span
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? "var(--ds-accent)" : T.text,
                    lineHeight: 1.4,
                  }}
                >
                  {opt.text}
                </span>
              </div>
            );
          })}
        </div>

        {/* Question Drawer / Palette (30 numbers) */}
        <div
          className="ge-diag-palette"
          style={{
            padding: "1rem",
            backgroundColor: "var(--ds-bg-elevated)",
            borderRadius: "0.75rem",
            border: `1px solid ${T.borderSubtle}`,
            marginBottom: "1.5rem",
          }}
        >
          <div
            className="ge-diag-palette-head"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.5rem",
              marginBottom: "0.75rem",
              fontSize: "0.75rem",
              color: T.textMuted,
            }}
          >
            <span style={{ fontWeight: 700, color: T.textSecondary }}>Bảng danh sách câu hỏi:</span>
            <div className="ge-diag-legend" style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              <span>🟢 Đã chọn ({answeredCount})</span>
              <span>🚩 Đánh dấu ({flaggedCount})</span>
              <span>⚪ Chưa chọn ({unansweredCount})</span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(36px, 1fr))",
              gap: "0.4rem",
            }}
          >
            {questions.map((q, idx) => {
              const isAns = !!answers[q.id]?.selected_answer;
              const isFlag = !!flagged[q.id];
              const isCurr = idx === currentIndex;

              let bgColor = "var(--ds-card)";
              let textColor = T.textMuted;
              let borderColor = T.borderSubtle;

              if (isAns) {
                bgColor = "var(--ds-success-bg)";
                textColor = "var(--ds-success)";
                borderColor = "var(--ds-success-border)";
              }
              if (isFlag) {
                bgColor = "var(--ds-warning-bg)";
                textColor = "var(--ds-warning)";
                borderColor = "var(--ds-warning-border)";
              }
              if (isCurr) {
                borderColor = T.accent;
              }

              return (
                <button
                  key={q.id}
                  onClick={() => handleJumpToQuestion(idx)}
                  style={{
                    height: "36px",
                    borderRadius: "0.45rem",
                    border: `2px solid ${isCurr ? T.accent : borderColor}`,
                    backgroundColor: bgColor,
                    color: textColor,
                    fontWeight: isCurr ? 800 : 600,
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                  title={`Câu ${idx + 1}`}
                >
                  {idx + 1}
                  {isFlag && (
                    <span
                      style={{
                        position: "absolute",
                        top: "-4px",
                        right: "-2px",
                        fontSize: "0.6rem",
                      }}
                    >
                      🚩
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div
          className="ge-diag-actions"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            marginTop: "auto",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="ge-diag-btn-prev"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "auto",
              padding: "0.75rem 1.25rem",
              borderRadius: "0.6rem",
              backgroundColor: "var(--ds-card)",
              color: T.text,
              border: `1px solid ${T.border}`,
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: currentIndex === 0 ? "not-allowed" : "pointer",
              opacity: currentIndex === 0 ? 0.4 : 1,
              whiteSpace: "nowrap",
            }}
          >
            ← Câu trước
          </button>

          {currentIndex < totalQuestions - 1 ? (
            <button
              onClick={handleNext}
              className="ge-diag-btn-next"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.6rem",
                backgroundColor: "var(--ds-btn-primary)",
                color: "#ffffff",
                border: "none",
                fontSize: "0.9rem",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Câu tiếp theo →
            </button>
          ) : null}

          <button
            onClick={() => setShowSubmitModal(true)}
            disabled={isSubmitting}
            className="ge-diag-btn-submit"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.75rem 1.75rem",
              borderRadius: "0.6rem",
              backgroundColor: "var(--ds-btn-success)",
              color: "#ffffff",
              border: "none",
              fontSize: "0.95rem",
              fontWeight: 700,
              cursor: isSubmitting ? "wait" : "pointer",
              boxShadow: "0 2px 8px rgba(5, 150, 105, 0.3)",
              whiteSpace: "nowrap",
            }}
          >
            {isSubmitting ? "Đang chấm điểm..." : "Nộp bài kiểm tra ➔"}
          </button>
        </div>
      </div>

      {/* Confirmation Modal (WCAG FocusTrap) */}
      <FocusTrapModal2026
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Xác Nhận Nộp Bài Kiểm Tra?"
        maxWidth="460px"
      >
        <p style={{ fontSize: "0.9rem", color: T.textSecondary, lineHeight: 1.5, marginBottom: "1.25rem" }}>
          Hệ thống sẽ tiến hành chấm điểm tuyệt đối (Zero Hallucination), phân tích 10 nhóm kỹ năng và thiết lập lộ trình học riêng cho bạn.
        </p>

        <div
          style={{
            backgroundColor: "var(--ds-bg-elevated)",
            borderRadius: "0.5rem",
            padding: "1rem",
            border: `1px solid ${T.borderSubtle}`,
            marginBottom: "1.5rem",
            fontSize: "0.85rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
            <span style={{ color: T.textMuted }}>Đã hoàn thành:</span>
            <span style={{ fontWeight: 700, color: T.success }}>{answeredCount} / {totalQuestions} câu</span>
          </div>
          {unansweredCount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <span style={{ color: T.danger }}>Chưa chọn đáp án:</span>
              <span style={{ fontWeight: 700, color: T.danger }}>{unansweredCount} câu</span>
            </div>
          )}
          {flaggedCount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: T.warning }}>Đánh dấu xem lại:</span>
              <span style={{ fontWeight: 700, color: T.warning }}>{flaggedCount} câu</span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => setShowSubmitModal(false)}
            className="ds-btn ds-focusable"
            style={{
              padding: "0.6rem 1.25rem",
              borderRadius: "0.5rem",
              backgroundColor: "transparent",
              color: T.textSecondary,
              border: `1px solid ${T.border}`,
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Tiếp tục làm bài
          </button>

          <button
            type="button"
            onClick={handleConfirmSubmit}
            disabled={isSubmitting}
            className="ds-btn ds-focusable"
            style={{
              padding: "0.6rem 1.5rem",
              borderRadius: "0.5rem",
              backgroundColor: "var(--ds-btn-success)",
              color: "#ffffff",
              border: "none",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: isSubmitting ? "wait" : "pointer",
            }}
          >
            {isSubmitting ? "Đang nộp..." : "Xác nhận nộp bài"}
          </button>
        </div>
      </FocusTrapModal2026>
    </div>
  );
}
