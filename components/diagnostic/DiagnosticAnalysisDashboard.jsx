import React, { useState } from "react";
import DiagnosticQuestionReview from "./DiagnosticQuestionReview";

export default function DiagnosticAnalysisDashboard({
  scoreResult,
  roadmap,
  onViewRoadmap,
  onRetakeTest,
  onNavigateToLesson,
  T,
  isLight,
}) {
  const [showReviewModal, setShowReviewModal] = useState(false);

  if (!scoreResult) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: T.textMuted }}>
        Không tìm thấy dữ liệu kết quả chẩn đoán.
      </div>
    );
  }

  const {
    percentage = 0,
    correct_answers = 0,
    total_questions = 30,
    estimated_level = {},
    duration_seconds = 0,
    skill_results = [],
    critical_weaknesses = [],
    mastered_skills = [],
  } = scoreResult;

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins} phút ${remainder} giây`;
  };

  return (
    <div
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "2rem 1.5rem",
      }}
    >
      {/* Hero Result Banner */}
      <div
        style={{
          background: isLight
            ? "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)"
            : "linear-gradient(135deg, #18181b 0%, #1e1b4b 100%)",
          borderRadius: "1.25rem",
          padding: "2.5rem",
          border: `1px solid ${isLight ? "#bfdbfe" : "#3730a3"}`,
          boxShadow: T.shadowElevated,
          marginBottom: "2rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "2rem",
        }}
      >
        <div style={{ flex: "1 1 400px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "0.25rem 0.75rem",
                borderRadius: "9999px",
                backgroundColor: isLight ? "#dcfce7" : "#064e3b",
                color: isLight ? "#15803d" : "#86efac",
              }}
            >
              Phân tích hoàn tất
            </span>
            <span style={{ fontSize: "0.75rem", color: T.textMuted }}>
              Thời gian hoàn thành: {formatDuration(duration_seconds)}
            </span>
          </div>

          <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: T.text, marginBottom: "0.5rem" }}>
            Kết Quả Chẩn Đoán Trình Độ Ngữ Pháp
          </h1>

          <p style={{ fontSize: "1rem", color: T.textSecondary, lineHeight: 1.5, marginBottom: "1.25rem" }}>
            {estimated_level.description}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.75rem",
                backgroundColor: isLight ? "#ffffff" : "#27272a",
                border: `1px solid ${T.borderSubtle}`,
                fontSize: "0.85rem",
                fontWeight: 600,
                color: T.text,
              }}
            >
              Đúng: <span style={{ color: T.success, fontWeight: 700 }}>{correct_answers}</span> / {total_questions} câu
            </div>

            <div
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.75rem",
                backgroundColor: isLight ? "#ffffff" : "#27272a",
                border: `1px solid ${T.borderSubtle}`,
                fontSize: "0.85rem",
                fontWeight: 600,
                color: T.text,
              }}
            >
              Mục tiêu tiếp theo: <span style={{ color: T.accent, fontWeight: 700 }}>{estimated_level.next_target}</span>
            </div>
          </div>
        </div>

        {/* Level Badge Block */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.75rem 2.25rem",
            borderRadius: "1rem",
            backgroundColor: isLight ? "#ffffff" : "#18181b",
            border: `2px solid ${T.accent}`,
            boxShadow: "0 8px 24px rgba(37, 99, 235, 0.15)",
            textAlign: "center",
            minWidth: "220px",
          }}
        >
          <div style={{ fontSize: "0.8rem", fontWeight: 600, color: T.textMuted, marginBottom: "0.25rem" }}>
            TRÌNH ĐỘ ƯỚC TÍNH
          </div>
          <div
            style={{
              fontSize: "3.2rem",
              fontWeight: 900,
              color: T.accent,
              lineHeight: 1,
              marginBottom: "0.25rem",
            }}
          >
            {estimated_level.code || "B1"}
          </div>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: T.text, marginBottom: "0.5rem" }}>
            {percentage}/100 Điểm
          </div>
          <div
            style={{
              fontSize: "0.72rem",
              color: T.textMuted,
              maxWidth: "180px",
            }}
          >
            Thang đo ngữ pháp nội bộ 12 chuyên đề
          </div>
        </div>
      </div>

      {/* AI Learning Recommendation Box */}
      {roadmap?.ai_recommendation && (
        <div
          style={{
            backgroundColor: isLight ? "#f0fdf4" : "#052e16",
            borderRadius: "1rem",
            padding: "1.75rem",
            border: `1px solid ${isLight ? "#bbf7d0" : "#14532d"}`,
            marginBottom: "2rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "1.3rem" }}>💡</span>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: isLight ? "#166534" : "#86efac" }}>
              Phân Tích Sư Phạm &amp; Khuyến Nghị Cá Nhân Hóa (AI Advisor)
            </h2>
          </div>

          <p style={{ fontSize: "0.95rem", color: isLight ? "#15803d" : "#bbf7d0", lineHeight: 1.5, marginBottom: "0.75rem" }}>
            {roadmap.ai_recommendation.headline}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
            <div
              style={{
                backgroundColor: isLight ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.25)",
                padding: "1rem",
                borderRadius: "0.6rem",
              }}
            >
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: isLight ? "#15803d" : "#86efac", marginBottom: "0.25rem" }}>
                🌟 Điểm mạnh của bạn:
              </div>
              <div style={{ fontSize: "0.85rem", color: T.textSecondary, lineHeight: 1.4 }}>
                {roadmap.ai_recommendation.strengths_summary}
              </div>
            </div>

            <div
              style={{
                backgroundColor: isLight ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.25)",
                padding: "1rem",
                borderRadius: "0.6rem",
              }}
            >
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: isLight ? "#b91c1c" : "#fca5a5", marginBottom: "0.25rem" }}>
                🔴 Vùng kiến thức cần ưu tiên khắc phục:
              </div>
              <div style={{ fontSize: "0.85rem", color: T.textSecondary, lineHeight: 1.4 }}>
                {roadmap.ai_recommendation.weaknesses_summary}
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: "1rem",
              paddingTop: "0.75rem",
              borderTop: `1px solid ${isLight ? "#bbf7d0" : "#14532d"}`,
              fontSize: "0.85rem",
              color: isLight ? "#166534" : "#a7f3d0",
              fontWeight: 500,
            }}
          >
            🧭 <strong>Lời khuyên học tập:</strong> {roadmap.ai_recommendation.study_advice}
          </div>
        </div>
      )}

      {/* Main Action Bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          marginBottom: "2.5rem",
        }}
      >
        <button
          onClick={onViewRoadmap}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.6rem",
            padding: "0.85rem 1.75rem",
            borderRadius: "0.75rem",
            backgroundColor: T.accent,
            color: "#ffffff",
            fontSize: "0.95rem",
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
          }}
        >
          <span>Khám phá Lộ trình Học 4 Tuần</span>
          <span>🗺️</span>
        </button>

        <button
          onClick={() => setShowReviewModal(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.85rem 1.5rem",
            borderRadius: "0.75rem",
            backgroundColor: isLight ? "#ffffff" : "#27272a",
            color: T.text,
            fontSize: "0.9rem",
            fontWeight: 600,
            border: `1px solid ${T.border}`,
            cursor: "pointer",
          }}
        >
          <span>Xem lại 30 câu hỏi &amp; Giải thích</span>
          <span>🔍</span>
        </button>

        <button
          onClick={onRetakeTest}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.85rem 1.25rem",
            borderRadius: "0.75rem",
            backgroundColor: "transparent",
            color: T.textMuted,
            fontSize: "0.9rem",
            fontWeight: 600,
            border: `1px solid ${T.borderSubtle}`,
            cursor: "pointer",
            marginLeft: "auto",
          }}
        >
          <span>Làm lại bài kiểm tra</span>
          <span>🔄</span>
        </button>
      </div>

      {/* 10 Topic Skills Breakdown Matrix */}
      <div
        style={{
          backgroundColor: T.card,
          borderRadius: "1rem",
          padding: "2rem",
          border: `1px solid ${T.cardBorder}`,
          boxShadow: T.shadow,
        }}
      >
        <div style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: T.text, marginBottom: "0.25rem" }}>
            Ma Trận Năng Lực 10 Chuyên Đề Ngữ Pháp (Skill Breakdown)
          </h2>
          <p style={{ fontSize: "0.85rem", color: T.textMuted }}>
            Được sắp xếp ưu tiên từ chủ điểm yếu nhất lên trên để học viên dễ dàng tập trung khắc phục.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {skill_results.map((skill) => (
            <div
              key={skill.topic_id}
              style={{
                padding: "1.2rem",
                borderRadius: "0.75rem",
                backgroundColor: isLight ? "#f8fafc" : "#18181b",
                border: `1px solid ${skill.border || T.borderSubtle}`,
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.95rem", color: T.text }}>
                    {skill.topic_name}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: T.textMuted }}>
                    (Chương {skill.chapter_number})
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      padding: "0.2rem 0.5rem",
                      borderRadius: "9999px",
                      backgroundColor: isLight ? "#e2e8f0" : "#27272a",
                      color: T.textMuted,
                    }}
                  >
                    Độ tin cậy: {skill.confidence === "high" ? "Cao (>5 câu)" : skill.confidence === "medium" ? "Trung bình (3-5 câu)" : "Thấp (<3 câu)"}
                  </span>

                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "0.25rem 0.65rem",
                      borderRadius: "9999px",
                      backgroundColor: skill.bg,
                      color: skill.color,
                      border: `1px solid ${skill.border}`,
                    }}
                  >
                    {skill.badge}
                  </span>
                </div>
              </div>

              {/* Progress bar line */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div
                  style={{
                    flex: 1,
                    height: "8px",
                    backgroundColor: isLight ? "#e2e8f0" : "#27272a",
                    borderRadius: "9999px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${skill.accuracy}%`,
                      backgroundColor: skill.color,
                      borderRadius: "9999px",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>

                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: skill.color, minWidth: "48px", textAlign: "right" }}>
                  {skill.accuracy}%
                </span>
                <span style={{ fontSize: "0.75rem", color: T.textMuted, minWidth: "55px" }}>
                  ({skill.correct_answers}/{skill.total_questions} đúng)
                </span>
              </div>

              {/* Action recommendation */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "0.8rem",
                  paddingTop: "0.5rem",
                  borderTop: `1px dashed ${T.borderSubtle}`,
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <span style={{ color: T.textSecondary }}>
                  Bài học liên quan: <strong>{skill.remedial_lesson_title}</strong>
                </span>

                <button
                  onClick={() => onNavigateToLesson(skill.chapter_number, skill.remedial_lesson_id)}
                  style={{
                    padding: "0.3rem 0.75rem",
                    borderRadius: "0.4rem",
                    backgroundColor: isLight ? "#ffffff" : "#27272a",
                    color: T.accent,
                    border: `1px solid ${T.accentBorder || T.border}`,
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Vào học ngay ➔
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <DiagnosticQuestionReview
          detailedAnswers={scoreResult.detailed_answers || []}
          onClose={() => setShowReviewModal(false)}
          T={T}
          isLight={isLight}
        />
      )}
    </div>
  );
}
