import React, { useState, useEffect, useCallback } from "react";

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
            backgroundColor: secondsRemaining < 180 ? T.dangerBg : isLight ? "#f1f5f9" : "#27272a",
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
          backgroundColor: isLight ? "#e2e8f0" : "#27272a",
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
                backgroundColor: isLight ? "#eff6ff" : "#1e1b4b",
                color: isLight ? "#2563eb" : "#93c5fd",
                border: `1px solid ${isLight ? "#bfdbfe" : "#3730a3"}`,
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
                    ? isLight ? "#ecfdf5" : "#064e3b"
                    : currentQ.difficulty === "medium"
                    ? isLight ? "#fffbeb" : "#78350f"
                    : isLight ? "#fef2f2" : "#7f1d1d",
                color:
                  currentQ.difficulty === "easy"
                    ? isLight ? "#059669" : "#6ee7b7"
                    : currentQ.difficulty === "medium"
                    ? isLight ? "#b45309" : "#fcd34d"
                    : isLight ? "#dc2626" : "#fca5a5",
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
                ? isLight ? "#fef3c7" : "#78350f"
                : "transparent",
              color: isCurrentFlagged
                ? isLight ? "#b45309" : "#fde68a"
                : T.textMuted,
              border: `1px solid ${isCurrentFlagged ? (isLight ? "#fcd34d" : "#b45309") : T.borderSubtle}`,
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
                    ? isLight ? "#eff6ff" : "#1e293b"
                    : isLight ? "#ffffff" : "#18181b",
                  border: `2px solid ${
                    isSelected ? T.accent : isLight ? "#e2e8f0" : "#27272a"
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
                    backgroundColor: isSelected ? T.accent : isLight ? "#f1f5f9" : "#27272a",
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
                    color: isSelected ? (isLight ? "#1d4ed8" : "#93c5fd") : T.text,
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
          style={{
            padding: "1rem",
            backgroundColor: isLight ? "#f8fafc" : "#121215",
            borderRadius: "0.75rem",
            border: `1px solid ${T.borderSubtle}`,
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.75rem",
              fontSize: "0.75rem",
              color: T.textMuted,
            }}
          >
            <span>Bảng danh sách câu hỏi:</span>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <span>🟢 Đã chọn ({answeredCount})</span>
              <span>🚩 Đánh dấu ({flaggedCount})</span>
              <span>⚪ Chưa chọn ({unansweredCount})</span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(32px, 1fr))",
              gap: "0.35rem",
            }}
          >
            {questions.map((q, idx) => {
              const isAns = !!answers[q.id]?.selected_answer;
              const isFlag = !!flagged[q.id];
              const isCurr = idx === currentIndex;

              let bgColor = isLight ? "#ffffff" : "#18181b";
              let textColor = T.textMuted;
              let borderColor = T.borderSubtle;

              if (isAns) {
                bgColor = isLight ? "#dcfce7" : "#064e3b";
                textColor = isLight ? "#15803d" : "#86efac";
                borderColor = isLight ? "#86efac" : "#059669";
              }
              if (isFlag) {
                bgColor = isLight ? "#fef3c7" : "#78350f";
                textColor = isLight ? "#b45309" : "#fde68a";
                borderColor = isLight ? "#fcd34d" : "#d97706";
              }
              if (isCurr) {
                borderColor = T.accent;
              }

              return (
                <button
                  key={q.id}
                  onClick={() => handleJumpToQuestion(idx)}
                  style={{
                    height: "32px",
                    borderRadius: "0.4rem",
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
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            style={{
              padding: "0.75rem 1.25rem",
              borderRadius: "0.6rem",
              backgroundColor: isLight ? "#ffffff" : "#27272a",
              color: T.text,
              border: `1px solid ${T.border}`,
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: currentIndex === 0 ? "not-allowed" : "pointer",
              opacity: currentIndex === 0 ? 0.4 : 1,
            }}
          >
            ← Câu trước
          </button>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            {currentIndex < totalQuestions - 1 ? (
              <button
                onClick={handleNext}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.6rem",
                  backgroundColor: T.accent,
                  color: "#ffffff",
                  border: "none",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Câu tiếp theo →
              </button>
            ) : null}

            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={isSubmitting}
              style={{
                padding: "0.75rem 1.75rem",
                borderRadius: "0.6rem",
                backgroundColor: T.success,
                color: "#ffffff",
                border: "none",
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: isSubmitting ? "wait" : "pointer",
                boxShadow: "0 2px 8px rgba(5, 150, 105, 0.3)",
              }}
            >
              {isSubmitting ? "Đang chấm điểm..." : "Nộp bài kiểm tra ➔"}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div
            style={{
              maxWidth: "460px",
              width: "100%",
              backgroundColor: T.card,
              borderRadius: "1rem",
              padding: "2rem",
              border: `1px solid ${T.cardBorder}`,
              boxShadow: T.shadowElevated,
            }}
          >
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: T.text, marginBottom: "0.75rem" }}>
              Xác Nhận Nộp Bài Kiểm Tra?
            </h3>

            <p style={{ fontSize: "0.9rem", color: T.textSecondary, lineHeight: 1.5, marginBottom: "1.25rem" }}>
              Hệ thống sẽ tiến hành chấm điểm tuyệt đối (Zero Hallucination), phân tích 10 nhóm kỹ năng và thiết lập lộ trình học riêng cho bạn.
            </p>

            <div
              style={{
                backgroundColor: isLight ? "#f8fafc" : "#18181b",
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
                onClick={() => setShowSubmitModal(false)}
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
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                style={{
                  padding: "0.6rem 1.5rem",
                  borderRadius: "0.5rem",
                  backgroundColor: T.success,
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
          </div>
        </div>
      )}
    </div>
  );
}
