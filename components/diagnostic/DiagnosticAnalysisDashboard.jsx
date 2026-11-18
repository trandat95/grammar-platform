import React, { useState, useMemo } from "react";
import DiagnosticQuestionReview from "./DiagnosticQuestionReview";
import AiAdvisorDrawer from "./AiAdvisorDrawer";
import { analyzeDiagnosticRootCauses } from "../../lib/diagnostic/knowledge.graph";
import { Button, Badge, KitIcon, StatusDot } from "../design-system";

export default function DiagnosticAnalysisDashboard({
  scoreResult,
  roadmap,
  analytics = null,
  currentUser = null,
  authToken = null,
  onViewRoadmap,
  onRetakeTest,
  onNavigateToLesson,
  T,
  isLight,
}) {
  const [showReviewModal, setShowReviewModal] = useState(false);

  const rootCauseAnalysis = useMemo(() => {
    if (!scoreResult) return null;
    if (scoreResult.root_cause_analysis) return scoreResult.root_cause_analysis;
    return analyzeDiagnosticRootCauses(scoreResult.detailed_answers || [], scoreResult.skill_results || []);
  }, [scoreResult]);

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
          background: "linear-gradient(135deg, var(--ds-card) 0%, var(--ds-accent-bg) 100%)",
          borderRadius: "1.25rem",
          padding: "2.5rem",
          border: `1px solid ${"var(--ds-accent-border)"}`,
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
                backgroundColor: "var(--ds-success-bg)",
                color: "var(--ds-success)",
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
                backgroundColor: "var(--ds-card)",
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
                backgroundColor: "var(--ds-card)",
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
            backgroundColor: "var(--ds-card)",
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

      {/* Visual Radar Chart across Grammar Skill Groups (EC-11) */}
      {Array.isArray(skill_results) && skill_results.length >= 3 && (() => {
        const axes = skill_results.slice(0, 10);
        const cx = 170;
        const cy = 155;
        const maxR = 102;
        const count = axes.length;
        const radarPts = axes.map((s, idx) => {
          const angle = ((idx * 360) / count - 90) * (Math.PI / 180);
          const pct = Math.max(8, Math.min(100, Number(s.accuracy_pct ?? s.accuracy ?? 0)));
          const r = (pct / 100) * maxR;
          return {
            x: cx + r * Math.cos(angle),
            y: cy + r * Math.sin(angle),
            lx: cx + (maxR + 24) * Math.cos(angle),
            ly: cy + (maxR + 18) * Math.sin(angle),
            label: String(s.category_name || s.name || s.topic || `Nhóm ${idx + 1}`).split("(")[0].trim().slice(0, 16),
            pct: Math.round(Number(s.accuracy_pct ?? s.accuracy ?? 0)),
          };
        });
        const poly = radarPts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
        return (
          <div
            style={{
              backgroundColor: "var(--ds-card)",
              borderRadius: "1rem",
              padding: "1.5rem",
              border: `1px solid ${T.borderSubtle}`,
              boxShadow: T.shadow,
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: T.text, margin: 0 }}>
                  Biểu Đồ Radar Năng Lực ({axes.length} Nhóm Kiến Thức)
                </h2>
                <p style={{ fontSize: "0.8rem", color: T.textMuted, margin: "0.2rem 0 0 0" }}>
                  Trực quan hóa độ vững của từng mảng ngữ pháp sau bài kiểm tra 30 câu
                </p>
              </div>
              <Badge tone="accent" isLight={isLight}>
                Trung bình {percentage}%
              </Badge>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "1.5rem" }}>
              <svg viewBox="0 0 340 310" width="320" height="292" style={{ maxWidth: "100%", height: "auto" }} aria-label="Biểu đồ Radar năng lực ngữ pháp">
                {[0.25, 0.5, 0.75, 1].map((lvl) => {
                  const ringPts = axes.map((_, idx) => {
                    const angle = ((idx * 360) / count - 90) * (Math.PI / 180);
                    return `${(cx + lvl * maxR * Math.cos(angle)).toFixed(1)},${(cy + lvl * maxR * Math.sin(angle)).toFixed(1)}`;
                  }).join(" ");
                  return <polygon key={lvl} points={ringPts} fill="none" stroke="var(--ds-border)" strokeWidth="1" strokeDasharray={lvl < 1 ? "3 3" : undefined} />;
                })}
                {axes.map((_, idx) => {
                  const angle = ((idx * 360) / count - 90) * (Math.PI / 180);
                  return (
                    <line
                      key={idx}
                      x1={cx}
                      y1={cy}
                      x2={(cx + maxR * Math.cos(angle)).toFixed(1)}
                      y2={(cy + maxR * Math.sin(angle)).toFixed(1)}
                      stroke="var(--ds-border)"
                      strokeWidth="1"
                    />
                  );
                })}
                <polygon points={poly} fill="var(--ds-accent)" fillOpacity="0.22" stroke="var(--ds-accent)" strokeWidth="2.5" />
                {radarPts.map((p, idx) => (
                  <g key={idx}>
                    <circle cx={p.x} cy={p.y} r="4" fill="var(--ds-accent)" stroke="var(--ds-card)" strokeWidth="1.5" />
                    <text x={p.lx} y={p.ly} textAnchor="middle" fill="var(--ds-text-secondary)" fontSize="9.5" fontWeight="700">
                      {p.label}
                    </text>
                  </g>
                ))}
              </svg>
              <div style={{ flex: "1 1 240px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.5rem" }}>
                {radarPts.map((p, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.45rem 0.7rem",
                      borderRadius: "0.5rem",
                      backgroundColor: "var(--ds-bg-elevated)",
                      border: `1px solid ${T.borderSubtle}`,
                      fontSize: "0.78rem",
                    }}
                  >
                    <span style={{ color: T.text, fontWeight: 600 }}>{p.label}</span>
                    <strong style={{ color: p.pct >= 70 ? T.success : p.pct >= 40 ? T.warning : T.danger }}>{p.pct}%</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* AI Learning Recommendation Box */}
      {roadmap?.ai_recommendation && (
        <div
          style={{
            backgroundColor: "var(--ds-success-bg)",
            borderRadius: "1rem",
            padding: "1.75rem",
            border: `1px solid ${"var(--ds-success-border)"}`,
            marginBottom: "2rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <KitIcon name="bulb" size={19} color="var(--ds-success)" />
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--ds-success)" }}>
              Phân Tích Sư Phạm &amp; Khuyến Nghị Cá Nhân Hóa (AI Advisor)
            </h2>
          </div>

          <p style={{ fontSize: "0.95rem", color: "var(--ds-success)", lineHeight: 1.5, marginBottom: "0.75rem" }}>
            {roadmap.ai_recommendation.headline}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: "1rem" }}>
            <div
              style={{
                backgroundColor: isLight ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.25)",
                padding: "1rem",
                borderRadius: "0.6rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--ds-success)", marginBottom: "0.25rem" }}>
                <KitIcon name="star" size={14} color="var(--ds-success)" />
                <span>Điểm mạnh của bạn:</span>
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
              <div style={{ display: "flex", alignItems: "center", gap: "0.38rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--ds-danger)", marginBottom: "0.25rem" }}>
                <StatusDot tone="danger" size={8} />
                <span>Vùng kiến thức cần ưu tiên khắc phục:</span>
              </div>
              <div style={{ fontSize: "0.85rem", color: T.textSecondary, lineHeight: 1.4 }}>
                {roadmap.ai_recommendation.weaknesses_summary}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.45rem",
              marginTop: "1rem",
              paddingTop: "0.75rem",
              borderTop: `1px solid ${"var(--ds-success-border)"}`,
              fontSize: "0.85rem",
              color: "var(--ds-success)",
              fontWeight: 500,
            }}
          >
            <KitIcon name="compass" size={16} color="var(--ds-success)" style={{ flexShrink: 0, marginTop: "2px" }} />
            <span><strong>Lời khuyên học tập:</strong> {roadmap.ai_recommendation.study_advice}</span>
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
            backgroundColor: "var(--ds-btn-primary)",
            color: "var(--ds-text-on-accent)",
            fontSize: "0.95rem",
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
          }}
        >
          <span>Khám phá Lộ trình Học 4 Tuần</span>
          <KitIcon name="map" size={16} />
        </button>

        <button
          onClick={() => setShowReviewModal(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.85rem 1.5rem",
            borderRadius: "0.75rem",
            backgroundColor: "var(--ds-card)",
            color: T.text,
            fontSize: "0.9rem",
            fontWeight: 600,
            border: `1px solid ${T.border}`,
            cursor: "pointer",
          }}
        >
          <span>Xem lại 30 câu hỏi &amp; Giải thích</span>
          <KitIcon name="search" size={16} />
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
          <KitIcon name="refresh" size={16} />
        </button>
      </div>

      {/* Milestone 2.8.4 & 2.8.9: Progress Comparison & Retention Score */}
      {analytics?.retentionMetrics?.growthSummary && (
        <div
          style={{
            backgroundColor: T.card,
            borderRadius: "1rem",
            padding: "1.35rem 1.5rem",
            border: `1px solid ${T.accentBorder}`,
            marginBottom: "2rem",
            boxShadow: T.shadow,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.85rem" }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: "0.45rem", margin: 0, fontSize: "1.05rem", fontWeight: 800, color: T.textHeading }}>
              <KitIcon name="trend-up" size={18} color={T.accent} />
              <span>Đối soát Tăng trưởng &amp; Độ bền Kiến thức (Analytics 2.8)</span>
            </h2>
            <Badge tone={analytics.retentionMetrics.growthSummary.growthDelta >= 0 ? "success" : "warning"} isLight={isLight}>
              {analytics.retentionMetrics.growthSummary.attemptCount} lần kiểm tra •{" "}
              {analytics.retentionMetrics.growthSummary.growthDelta >= 0
                ? `+${analytics.retentionMetrics.growthSummary.growthDelta}% Growth`
                : `${analytics.retentionMetrics.growthSummary.growthDelta}%`}
            </Badge>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.75rem" }}>
            <div style={{ backgroundColor: T.bgElevated, borderRadius: "0.7rem", padding: "0.75rem" }}>
              <div style={{ fontSize: "0.72rem", color: T.textMuted, fontWeight: 600 }}>Điểm đầu vào (Lần 1)</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: T.textHeading }}>
                {analytics.retentionMetrics.growthSummary.initialScore}/100 ({analytics.retentionMetrics.growthSummary.initialLevel})
              </div>
            </div>
            <div style={{ backgroundColor: T.bgElevated, borderRadius: "0.7rem", padding: "0.75rem" }}>
              <div style={{ fontSize: "0.72rem", color: T.textMuted, fontWeight: 600 }}>Kết quả gần nhất</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: T.accent }}>
                {analytics.retentionMetrics.growthSummary.latestScore}/100 ({analytics.retentionMetrics.growthSummary.latestLevel})
              </div>
            </div>
            <div style={{ backgroundColor: T.bgElevated, borderRadius: "0.7rem", padding: "0.75rem" }}>
              <div style={{ fontSize: "0.72rem", color: T.textMuted, fontWeight: 600 }}>Knowledge Retention Score</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: T.success }}>
                {analytics.retentionMetrics.overallRetentionScore}%
              </div>
            </div>
            <div style={{ backgroundColor: T.bgElevated, borderRadius: "0.7rem", padding: "0.75rem" }}>
              <div style={{ fontSize: "0.72rem", color: T.textMuted, fontWeight: 600 }}>Thẻ SM-2 Đã Làm Chủ</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: T.warning }}>
                {analytics.retentionMetrics.masteredCardsCount} thẻ
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Milestone 2.8.7: Knowledge Graph Prerequisites & Root Cause Analysis */}
      {rootCauseAnalysis && rootCauseAnalysis.totalIncorrectAnalyzed > 0 && (
        <div
          style={{
            backgroundColor: T.card,
            borderRadius: "1rem",
            padding: "1.5rem",
            border: `1px solid ${T.cardBorder}`,
            boxShadow: T.shadow,
            marginBottom: "2rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.9rem" }}>
            <div>
              <h2 style={{ display: "flex", alignItems: "center", gap: "0.45rem", margin: 0, fontSize: "1.1rem", fontWeight: 800, color: T.textHeading }}>
                <KitIcon name="git-branch" size={18} color={T.accent} />
                <span>Phân tích Nguyên nhân Gốc rễ &amp; Tiên quyết (Knowledge Graph DAG)</span>
              </h2>
              <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.8rem", color: T.textMuted }}>
                Phân tích {rootCauseAnalysis.totalIncorrectAnalyzed} câu chưa đúng để truy vết lỗ hổng nền tảng cần vá trước.
              </p>
            </div>
            {rootCauseAnalysis.primaryRootCause && (
              <Badge tone="danger" isLight={isLight}>
                Chính: {rootCauseAnalysis.primaryRootCause.label_vi}
              </Badge>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.7rem", marginBottom: "1rem" }}>
            {rootCauseAnalysis.rootCauses.map((rc) => (
              <div
                key={rc.code}
                style={{
                  backgroundColor: T.bgElevated,
                  border: `1px solid ${T.borderSubtle}`,
                  borderRadius: "0.75rem",
                  padding: "0.85rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                  <strong style={{ fontSize: "0.8rem", color: T.textHeading }}>{rc.label_vi}</strong>
                  <Badge tone="warning" isLight={isLight}>{rc.count} câu</Badge>
                </div>
                <p style={{ margin: 0, fontSize: "0.76rem", color: T.textSecondary, lineHeight: 1.45 }}>
                  {rc.advice}
                </p>
              </div>
            ))}
          </div>

          {rootCauseAnalysis.prerequisiteGaps.length > 0 && (
            <div style={{ borderTop: `1px dashed ${T.borderSubtle}`, paddingTop: "0.85rem" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: T.textSecondary, marginBottom: "0.5rem" }}>
                Bài học Tiên quyết cần nắm vững trước (1-Click từ Knowledge Graph):
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {rootCauseAnalysis.prerequisiteGaps.map((pg) => (
                  <Button
                    key={pg.lesson_code}
                    variant="secondary"
                    size="sm"
                    isLight={isLight}
                    icon="book"
                    onClick={() => onNavigateToLesson && onNavigateToLesson(pg.chapter_number, pg.lesson_id)}
                  >
                    Tiên quyết Ch.{pg.chapter_number}: {pg.lesson_title} (cho {pg.for_topic}) ➔
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Milestone 2.8.10: AI Learning Advisor */}
      <div style={{ marginBottom: "2rem" }}>
        <AiAdvisorDrawer
          currentUser={currentUser}
          authToken={authToken}
          scoreResult={scoreResult}
          onNavigateToLesson={onNavigateToLesson}
          isLight={isLight}
        />
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
                backgroundColor: "var(--ds-bg-elevated)",
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
                      backgroundColor: "var(--ds-card-border)",
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
                    backgroundColor: "var(--ds-card-border)",
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
                    backgroundColor: "var(--ds-card)",
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
          hasVipAccess={!currentUser?.isGuest && (currentUser?.role === "VIP" || currentUser?.role === "ADMIN")}
          onClose={() => setShowReviewModal(false)}
          T={T}
          isLight={isLight}
        />
      )}
    </div>
  );
}
