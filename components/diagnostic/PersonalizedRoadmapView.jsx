import React, { useState } from "react";
import AiAdvisorDrawer from "./AiAdvisorDrawer";
import { Button, Badge, Alert } from "../design-system";

export default function PersonalizedRoadmapView({
  roadmap,
  scoreResult = null,
  currentUser = null,
  authToken = null,
  isAdjusting = false,
  lastAdjustSummary = "",
  onAdaptiveAdjust,
  onToggleTask,
  onNavigateToLesson,
  onRetakeTest,
  T,
  isLight,
}) {
  const [activeWeekTab, setActiveWeekTab] = useState("all"); // 'all' | 1 | 2 | 3 | 4
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  if (!roadmap) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: T.textMuted }}>
        Chưa có lộ trình học tập cá nhân hóa. Hãy hoàn thành bài kiểm tra chẩn đoán đầu vào để hệ thống tự động khởi tạo lộ trình cho bạn.
      </div>
    );
  }

  const {
    title,
    estimated_level,
    target_level,
    weeks = [],
    ai_recommendation,
  } = roadmap;

  // Calculate task counts
  let totalTasks = 0;
  let completedTasks = 0;
  weeks.forEach((w) => {
    (w.tasks || []).forEach((t) => {
      totalTasks++;
      if (t.status === "completed") completedTasks++;
    });
  });

  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const filteredWeeks = activeWeekTab === "all"
    ? weeks
    : weeks.filter((w) => w.week_number === activeWeekTab);

  return (
    <div
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "2rem 1.5rem",
      }}
    >
      {/* Roadmap Header Card */}
      <div
        style={{
          background: isLight
            ? "linear-gradient(135deg, #ffffff 0%, var(--ds-success-bg) 100%)"
            : "linear-gradient(135deg, var(--ds-bg-elevated) 0%, var(--ds-success-bg) 100%)",
          borderRadius: "1.25rem",
          padding: "2.25rem",
          border: `1px solid ${"var(--ds-success-border)"}`,
          boxShadow: T.shadowElevated,
          marginBottom: "2rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              padding: "0.25rem 0.75rem",
              borderRadius: "9999px",
              backgroundColor: "var(--ds-success-bg)",
              color: "var(--ds-success)",
            }}
          >
            🗺️ Actionable Learning Roadmap
          </span>
          <span style={{ fontSize: "0.75rem", color: T.textMuted }}>
            Liên kết 100% với 53 bài học giáo trình
          </span>
        </div>

        <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: T.text, marginBottom: "0.5rem" }}>
          {title}
        </h1>

        <p style={{ fontSize: "0.95rem", color: T.textSecondary, lineHeight: 1.5, marginBottom: "1rem" }}>
          Lộ trình được thiết kế tối ưu hóa trong 4 tuần để đưa trình độ ngữ pháp của bạn từ{" "}
          <strong>{estimated_level}</strong> lên mục tiêu <strong>{target_level}</strong>, ưu tiên tập trung lấp đầy các lỗ hổng kiến thức trước.
        </p>

        {/* Adaptive Recalibration Bar (Milestone 2.8.8) */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.65rem", marginBottom: "1.25rem" }}>
          <Badge tone="success" isLight={isLight}>
            Roadmap Version v{roadmap.current_version || 1}
          </Badge>
          {onAdaptiveAdjust && (
            <Button
              variant="primary"
              size="sm"
              isLight={isLight}
              isLoading={isAdjusting}
              onClick={onAdaptiveAdjust}
            >
              ⚡ Tự động Điều chỉnh Thích ứng (Adaptive Engine)
            </Button>
          )}
          {Array.isArray(roadmap.version_history) && roadmap.version_history.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              isLight={isLight}
              onClick={() => setShowVersionHistory((p) => !p)}
            >
              {showVersionHistory ? "Ẩn Lịch sử Phiên bản" : `🕒 Lịch sử Phiên bản (${roadmap.version_history.length})`}
            </Button>
          )}
        </div>

        {lastAdjustSummary && (
          <div style={{ marginBottom: "1rem" }}>
            <Alert tone="info" title="Kết quả Điều chỉnh Lộ trình Thích ứng" isLight={isLight}>
              {lastAdjustSummary}
            </Alert>
          </div>
        )}

        {showVersionHistory && Array.isArray(roadmap.version_history) && (
          <div
            style={{
              backgroundColor: T.card,
              border: `1px solid ${T.borderSubtle}`,
              borderRadius: "0.75rem",
              padding: "0.85rem 1rem",
              marginBottom: "1rem",
            }}
          >
            <div style={{ fontSize: "0.78rem", fontWeight: 800, color: T.textHeading, marginBottom: "0.45rem" }}>
              Lịch sử Điều chỉnh Lộ trình (Roadmap Versions):
            </div>
            {[...roadmap.version_history].reverse().map((vh, idx) => (
              <div key={idx} style={{ fontSize: "0.76rem", color: T.textSecondary, padding: "0.25rem 0", borderTop: idx > 0 ? `1px dashed ${T.borderSubtle}` : "none" }}>
                <strong>v{vh.version_number}</strong> • {vh.trigger_reason} — {vh.summary}
              </div>
            ))}
          </div>
        )}

        {/* Progress Bar & Stats */}
        <div
          style={{
            backgroundColor: "var(--ds-card)",
            borderRadius: "0.75rem",
            padding: "1.25rem",
            border: `1px solid ${T.borderSubtle}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.5rem",
              fontSize: "0.85rem",
            }}
          >
            <span style={{ fontWeight: 700, color: T.text }}>Tiến độ hoàn thành lộ trình</span>
            <span style={{ fontWeight: 800, color: T.success }}>
              {completedTasks} / {totalTasks} nhiệm vụ ({progressPercentage}%)
            </span>
          </div>

          <div
            style={{
              width: "100%",
              height: "10px",
              backgroundColor: "var(--ds-card-border)",
              borderRadius: "9999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPercentage}%`,
                backgroundColor: T.success,
                borderRadius: "9999px",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* Week Selector Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          overflowX: "auto",
          paddingBottom: "0.25rem",
        }}
      >
        <button
          onClick={() => setActiveWeekTab("all")}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.6rem",
            fontSize: "0.85rem",
            fontWeight: 700,
            cursor: "pointer",
            backgroundColor: activeWeekTab === "all" ? "var(--ds-btn-primary)" : "var(--ds-card)",
            color: activeWeekTab === "all" ? "#ffffff" : T.text,
            border: `1px solid ${activeWeekTab === "all" ? "var(--ds-btn-primary)" : T.borderSubtle}`,
            whiteSpace: "nowrap",
          }}
        >
          Tất cả các tuần ({weeks.length})
        </button>

        {weeks.map((w) => (
          <button
            key={w.week_number}
            onClick={() => setActiveWeekTab(w.week_number)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.6rem",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              backgroundColor: activeWeekTab === w.week_number ? "var(--ds-btn-primary)" : "var(--ds-card)",
              color: activeWeekTab === w.week_number ? "#ffffff" : T.text,
              border: `1px solid ${activeWeekTab === w.week_number ? "var(--ds-btn-primary)" : T.borderSubtle}`,
              whiteSpace: "nowrap",
            }}
          >
            Tuần {w.week_number}
          </button>
        ))}
      </div>

      {/* Weekly Phase Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {filteredWeeks.map((week) => (
          <div
            key={week.week_number}
            style={{
              backgroundColor: T.card,
              borderRadius: "1rem",
              padding: "1.75rem",
              border: `1px solid ${T.cardBorder}`,
              boxShadow: T.shadow,
            }}
          >
            {/* Week Header */}
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
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: "var(--ds-accent-bg)",
                    color: T.accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "0.9rem",
                  }}
                >
                  {week.week_number}
                </span>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: T.text, margin: 0 }}>
                  {week.title}
                </h2>
              </div>

              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  padding: "0.25rem 0.65rem",
                  borderRadius: "9999px",
                  backgroundColor:
                    week.badge.includes("Critical")
                      ? "var(--ds-danger-bg)"
                      : week.badge.includes("High")
                      ? "var(--ds-warning-bg)"
                      : "var(--ds-success-bg)",
                  color:
                    week.badge.includes("Critical")
                      ? "var(--ds-danger)"
                      : week.badge.includes("High")
                      ? "var(--ds-warning)"
                      : "var(--ds-success)",
                }}
              >
                {week.badge}
              </span>
            </div>

            <p style={{ fontSize: "0.875rem", color: T.textSecondary, marginBottom: "1.25rem" }}>
              {week.description}
            </p>

            {/* Tasks List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {(week.tasks || []).map((task) => {
                const isCompleted = task.status === "completed";

                return (
                  <div
                    key={task.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "1rem",
                      padding: "1.1rem 1.25rem",
                      borderRadius: "0.75rem",
                      backgroundColor: isCompleted
                        ? "var(--ds-success-bg)"
                        : "var(--ds-bg-elevated)",
                      border: `1px solid ${
                        isCompleted
                          ? "var(--ds-success-border)"
                          : T.borderSubtle
                      }`,
                      transition: "all 0.2s ease",
                    }}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={(e) => onToggleTask(task.id, e.target.checked)}
                      style={{
                        width: "18px",
                        height: "18px",
                        marginTop: "0.2rem",
                        cursor: "pointer",
                        accentColor: T.success,
                      }}
                      title="Đánh dấu hoàn thành"
                    />

                    {/* Task Info */}
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          marginBottom: "0.25rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: "0.95rem",
                            color: isCompleted ? T.textMuted : T.text,
                            textDecoration: isCompleted ? "line-through" : "none",
                          }}
                        >
                          {task.title}
                        </span>

                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            padding: "0.15rem 0.45rem",
                            borderRadius: "0.25rem",
                            backgroundColor:
                              task.priority === "HIGH"
                                ? "var(--ds-danger-bg)"
                                : "var(--ds-card-border)",
                            color:
                              task.priority === "HIGH"
                                ? "var(--ds-danger)"
                                : T.textMuted,
                          }}
                        >
                          {task.priority === "HIGH" ? "Ưu tiên cao" : "Tiêu chuẩn"}
                        </span>

                        {task.adaptive_badge && (
                          <Badge tone="accent" isLight={isLight}>
                            {task.adaptive_badge}
                          </Badge>
                        )}

                        {task.duration_est && (
                          <span style={{ fontSize: "0.75rem", color: T.textMuted }}>
                            ⏱️ {task.duration_est}
                          </span>
                        )}
                      </div>

                      <p
                        style={{
                          fontSize: "0.85rem",
                          color: T.textMuted,
                          margin: "0 0 0.5rem 0",
                          lineHeight: 1.4,
                        }}
                      >
                        {task.description}
                      </p>

                      {task.reason && (
                        <div
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--ds-accent)",
                            backgroundColor: "var(--ds-accent-bg)",
                            padding: "0.35rem 0.65rem",
                            borderRadius: "0.4rem",
                            marginBottom: "0.6rem",
                            display: "inline-block",
                          }}
                        >
                          💡 <em>Lý do: {task.reason}</em>
                        </div>
                      )}

                      {/* Lesson Reference & Action Button */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "0.5rem",
                          marginTop: "0.25rem",
                        }}
                      >
                        <span style={{ fontSize: "0.78rem", color: T.textSecondary }}>
                          📖 Chương {task.chapter_number} • Bài: {task.lesson_title}
                        </span>

                        {task.action_type === "retake_diagnostic" ? (
                          <button
                            onClick={onRetakeTest}
                            style={{
                              padding: "0.35rem 0.85rem",
                              borderRadius: "0.45rem",
                              backgroundColor: T.success,
                              color: "#ffffff",
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            Làm bài kiểm tra lại ➔
                          </button>
                        ) : (
                          <button
                            onClick={() => onNavigateToLesson(task.chapter_number, task.lesson_id)}
                            style={{
                              padding: "0.35rem 0.85rem",
                              borderRadius: "0.45rem",
                              backgroundColor: "var(--ds-btn-primary)",
                              color: "#ffffff",
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              border: "none",
                              cursor: "pointer",
                              transition: "opacity 0.15s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                          >
                            Vào học ngay ➔
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Reassessment Banner */}
      <div
        style={{
          marginTop: "2.5rem",
          backgroundColor: "var(--ds-bg-elevated)",
          borderRadius: "1rem",
          padding: "2rem",
          border: `1px dashed ${T.border}`,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1.5rem",
        }}
      >
        <div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: T.text, margin: "0 0 0.35rem 0" }}>
            Đã sẵn sàng kiểm tra lại sự tiến bộ?
          </h3>
          <p style={{ fontSize: "0.85rem", color: T.textMuted, margin: 0 }}>
            Sau khi hoàn thành các nhiệm vụ tuần 1 &amp; tuần 2, bạn có thể làm lại bài kiểm tra 30 câu để đo lường mức độ tăng trưởng điểm số (+% Growth).
          </p>
        </div>

        <button
          onClick={onRetakeTest}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "0.6rem",
            backgroundColor: "var(--ds-card)",
            color: T.accent,
            border: `1px solid ${T.accent}`,
            fontSize: "0.9rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Làm bài Retake Assessment 🔄
        </button>
      </div>

      {/* Conversational AI Advisor inside Roadmap */}
      <div style={{ marginTop: "2rem" }}>
        <AiAdvisorDrawer
          currentUser={currentUser}
          authToken={authToken}
          scoreResult={scoreResult}
          onNavigateToLesson={onNavigateToLesson}
          isLight={isLight}
        />
      </div>
    </div>
  );
}
