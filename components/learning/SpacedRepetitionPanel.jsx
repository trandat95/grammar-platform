import React, { useState, useEffect, useCallback } from "react";
import { getThemeTokens } from "../../lib/tokens/design-tokens";
import StructuredExplanation from "../explanation/StructuredExplanation";
import { migrateQuestionExplanation } from "../../lib/explanation/explanation.migrator";

/**
 * Milestone 2.5.7, 2.5.9, 2.5.10 & 2.5.11:
 * Interactive Spaced Repetition Review Queue (1 -> 3 -> 7 -> 14 -> 30d),
 * Real-Time Concept Mastery Matrix, Knowledge Decay Alerts (-5%/wk > 14d),
 * and Acyclic Knowledge Graph Prerequisite Navigator.
 */
export default function SpacedRepetitionPanel({
  userId = null,
  authToken = null,
  hasVipAccess = false,
  isLight = false,
  onOpenLessonByCode,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [reviewOutcome, setReviewOutcome] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [selectedConceptForGraph, setSelectedConceptForGraph] = useState(null);
  const T = getThemeTokens(isLight);

  const loadMastery = useCallback(async () => {
    setLoading(true);
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const url = userId ? `/api/learning/mastery?user_id=${encodeURIComponent(userId)}` : "/api/learning/mastery";
      const res = await fetch(url, { headers });
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
      }
    } catch (e) {
      console.warn("Could not load mastery data:", e.message);
    } finally {
      setLoading(false);
    }
  }, [userId, authToken]);

  useEffect(() => {
    loadMastery();
  }, [loadMastery]);

  const dueCards = data?.dailyReview?.dueCards || [];
  const currentCard = dueCards[activeCardIdx] || null;
  const currentQuestion = currentCard?.question || null;

  const handleGradeCard = async (isCorrect, qualityRating) => {
    if (!currentCard || !userId || submittingReview) return;
    setSubmittingReview(true);
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      };
      const res = await fetch("/api/learning/mastery", {
        method: "POST",
        headers,
        body: JSON.stringify({
          user_id: userId,
          question_id: currentCard.question_id,
          is_correct: isCorrect,
          quality_rating: qualityRating,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setReviewOutcome({
          isCorrect,
          nextIntervalDays: json.spacedRepetition?.interval_days || 1,
          newStatus: json.spacedRepetition?.status || "learning",
          masteryScore: json.mastery?.mastery_score ?? 0,
        });
      }
    } catch (e) {
      console.warn("Spaced repetition update error:", e.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleNextCard = () => {
    setSelectedChoice(null);
    setReviewOutcome(null);
    if (activeCardIdx + 1 < dueCards.length) {
      setActiveCardIdx((prev) => prev + 1);
    } else {
      setActiveCardIdx(0);
      loadMastery();
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "14px", padding: "1.1rem", color: T.textMuted, fontSize: "0.84rem" }}>
        ⏳ Đang phân tích Knowledge Graph & Lịch ôn tập ngắt quãng...
      </div>
    );
  }

  if (!data) return null;

  const { dailyReview, weakConcepts = [], summaryStats = {}, concepts = [] } = data;
  const activeTrackedConcepts = concepts.filter((c) => c.attempts > 0);

  return (
    <div style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "14px", padding: "1.15rem", boxShadow: T.shadow }}>
      {/* Daily Prompt Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.95rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "1.05rem" }}>🧠</span>
            <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: "800", color: T.textHeading }}>
              Spaced Repetition & Bản đồ Năng lực (SM-2)
            </h3>
            <span
              style={{
                backgroundColor: T.accentBg,
                border: `1px solid ${T.accentBorder}`,
                color: T.accent,
                borderRadius: "999px",
                padding: "0.15rem 0.55rem",
                fontSize: "0.7rem",
                fontWeight: "700",
              }}
            >
              Chu kỳ 1→3→7→14→30 ngày
            </span>
          </div>
          <p style={{ margin: "0.3rem 0 0 0", fontSize: "0.82rem", color: dailyReview?.dueCount > 0 ? T.warning : T.success, fontWeight: "600" }}>
            {dailyReview?.prompt}
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", fontSize: "0.74rem" }}>
          <span style={{ backgroundColor: T.bgElevated, border: `1px solid ${T.borderSubtle}`, borderRadius: "8px", padding: "0.3rem 0.6rem", color: T.textSecondary }}>
            Cần ôn: <strong style={{ color: T.warning }}>{dailyReview?.dueCount || 0}</strong>
          </span>
          <span style={{ backgroundColor: T.bgElevated, border: `1px solid ${T.borderSubtle}`, borderRadius: "8px", padding: "0.3rem 0.6rem", color: T.textSecondary }}>
            Thành thạo: <strong style={{ color: T.success }}>{summaryStats.masteredConcepts || 0}/53</strong>
          </span>
          {(summaryStats.decayedConcepts || 0) > 0 && (
            <span style={{ backgroundColor: T.dangerBg, border: `1px solid ${T.dangerBorder}`, borderRadius: "8px", padding: "0.3rem 0.6rem", color: T.danger, fontWeight: "700" }}>
              ⚠️ {summaryStats.decayedConcepts} chuyên đề suy giảm trí nhớ
            </span>
          )}
        </div>
      </div>

      {/* Interactive Due Review Card */}
      {currentCard && currentQuestion && (
        <div
          style={{
            backgroundColor: T.bgElevated,
            border: `1px solid ${T.accentBorder}`,
            borderRadius: "12px",
            padding: "0.95rem 1.05rem",
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.74rem", color: T.textMuted, marginBottom: "0.5rem" }}>
            <span>
              Thẻ ôn tập {activeCardIdx + 1}/{dueCards.length} •{" "}
              <strong style={{ color: T.accent }}>{currentCard.concept?.title_vi || currentQuestion.topic_name}</strong>
            </span>
            <span>Chu kỳ hiện tại: {currentCard.interval_days} ngày • Chuỗi đúng: {currentCard.consecutive_correct}</span>
          </div>

          <div style={{ fontSize: "0.9rem", fontWeight: "700", color: T.textHeading, lineHeight: 1.5, marginBottom: "0.75rem" }}>
            {currentQuestion.stem}
          </div>

          {Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.45rem", marginBottom: "0.75rem" }}>
              {currentQuestion.options.map((opt, oIdx) => {
                const isSelected = selectedChoice === opt;
                const correctAns = currentQuestion.answers?.[0] || "";
                const isAnsRight = opt.trim().toLowerCase() === correctAns.trim().toLowerCase();
                let bg = T.card;
                let bd = T.border;
                if (selectedChoice !== null) {
                  if (isAnsRight) {
                    bg = T.successBg;
                    bd = T.successBorder;
                  } else if (isSelected) {
                    bg = T.dangerBg;
                    bd = T.dangerBorder;
                  }
                }
                return (
                  <button
                    key={oIdx}
                    type="button"
                    disabled={selectedChoice !== null || submittingReview}
                    onClick={() => {
                      setSelectedChoice(opt);
                      handleGradeCard(isAnsRight, isAnsRight ? 4 : 1);
                    }}
                    style={{
                      textAlign: "left",
                      backgroundColor: bg,
                      border: `1px solid ${bd}`,
                      borderRadius: "8px",
                      padding: "0.48rem 0.7rem",
                      color: T.text,
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      cursor: selectedChoice !== null ? "default" : "pointer",
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {reviewOutcome && (
            <div style={{ marginTop: "0.65rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                  backgroundColor: reviewOutcome.isCorrect ? T.successBg : T.dangerBg,
                  border: `1px solid ${reviewOutcome.isCorrect ? T.successBorder : T.dangerBorder}`,
                  borderRadius: "8px",
                  padding: "0.55rem 0.75rem",
                  fontSize: "0.78rem",
                  color: reviewOutcome.isCorrect ? T.success : T.danger,
                  fontWeight: "700",
                  marginBottom: "0.6rem",
                }}
              >
                <span>
                  {reviewOutcome.isCorrect
                    ? `✅ Chính xác! Hẹn ôn lại sau ${reviewOutcome.nextIntervalDays} ngày (Mastery: ${reviewOutcome.masteryScore}%)`
                    : `🔄 Đã đưa về chu kỳ củng cố 1 ngày (Mastery: ${reviewOutcome.masteryScore}%)`}
                </span>
                <button
                  type="button"
                  onClick={handleNextCard}
                  style={{
                    backgroundColor: T.accent,
                    border: "none",
                    color: "#ffffff",
                    borderRadius: "6px",
                    padding: "0.32rem 0.7rem",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Thẻ tiếp theo ➔
                </button>
              </div>
              <StructuredExplanation
                explanation={migrateQuestionExplanation(currentQuestion)}
                questionId={currentQuestion.id}
                hasVipAccess={hasVipAccess}
                isLight={isLight}
                userId={userId}
              />
            </div>
          )}
        </div>
      )}

      {/* Weak Concepts + Knowledge Graph Prerequisite Links */}
      {weakConcepts.length > 0 && (
        <div style={{ marginBottom: "0.9rem" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: "800", color: T.textSecondary, marginBottom: "0.5rem" }}>
            🕸️ Lỗ hổng Kiến thức & Tiên quyết đề xuất (Knowledge Graph):
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "0.6rem" }}>
            {weakConcepts.map((wc) => (
              <div
                key={wc.id}
                style={{
                  backgroundColor: T.bgElevated,
                  border: `1px solid ${wc.decay_penalty > 0 ? T.dangerBorder : T.borderSubtle}`,
                  borderRadius: "10px",
                  padding: "0.65rem 0.8rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: "700", color: T.textHeading }}>{wc.title_vi}</span>
                  <span style={{ fontSize: "0.76rem", fontWeight: "800", color: T.danger }}>{wc.decayed_score}%</span>
                </div>
                {wc.decay_penalty > 0 && (
                  <div style={{ fontSize: "0.7rem", color: T.danger, marginTop: "0.18rem" }}>
                    📉 Suy giảm -{wc.decay_penalty}% do quá hạn {wc.days_overdue} ngày
                  </div>
                )}
                {wc.prerequisites && wc.prerequisites.length > 0 && (
                  <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.45rem" }}>
                    {wc.prerequisites.map((pr) => (
                      <button
                        key={pr.id}
                        type="button"
                        onClick={() => onOpenLessonByCode && onOpenLessonByCode(pr.lesson_code)}
                        style={{
                          backgroundColor: T.accentBg,
                          border: `1px solid ${T.accentBorder}`,
                          color: T.accent,
                          borderRadius: "6px",
                          padding: "0.2rem 0.5rem",
                          fontSize: "0.7rem",
                          fontWeight: "700",
                          cursor: onOpenLessonByCode ? "pointer" : "default",
                        }}
                      >
                        📖 Tiên quyết: {pr.title_vi}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tracked Concept Mastery Compact Pills */}
      {activeTrackedConcepts.length > 0 && (
        <div>
          <div style={{ fontSize: "0.76rem", fontWeight: "800", color: T.textMuted, marginBottom: "0.45rem" }}>
            Mức độ Thành thạo ({activeTrackedConcepts.length} chuyên đề đã luyện):
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
            {activeTrackedConcepts.slice(0, 14).map((c) => {
              const color = c.decayed_score >= 85 ? T.success : c.decayed_score >= 55 ? T.warning : T.danger;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedConceptForGraph((prev) => (prev?.id === c.id ? null : c))}
                  style={{
                    backgroundColor: T.bgElevated,
                    border: `1px solid ${selectedConceptForGraph?.id === c.id ? T.accent : T.borderSubtle}`,
                    borderRadius: "8px",
                    padding: "0.3rem 0.6rem",
                    fontSize: "0.74rem",
                    color: T.text,
                    cursor: "pointer",
                  }}
                >
                  {c.title_vi}: <strong style={{ color }}>{c.decayed_score}%</strong>
                </button>
              );
            })}
          </div>
          {selectedConceptForGraph && (
            <div style={{ marginTop: "0.6rem", fontSize: "0.76rem", color: T.textSecondary, backgroundColor: T.bgElevated, padding: "0.55rem 0.75rem", borderRadius: "8px" }}>
              <strong>{selectedConceptForGraph.title_vi}</strong> — Thử {selectedConceptForGraph.attempts} lượt (Đúng {selectedConceptForGraph.correct_attempts}).{" "}
              {selectedConceptForGraph.prerequisites?.length > 0
                ? `Nên nắm vững trước: ${selectedConceptForGraph.prerequisites.map((p) => p.title_vi).join(", ")}.`
                : "Đây là kiến thức nền tảng (Root Node)."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
