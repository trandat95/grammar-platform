import React, { useState, useEffect, useCallback } from "react";
import DiagnosticOnboarding from "./DiagnosticOnboarding";
import DiagnosticTestSession from "./DiagnosticTestSession";
import DiagnosticAnalysisDashboard from "./DiagnosticAnalysisDashboard";
import PersonalizedRoadmapView from "./PersonalizedRoadmapView";
import { DIAGNOSTIC_QUESTIONS, DIAGNOSTIC_TOPICS } from "../../lib/diagnostic/diagnostic.blueprint";
import { scoreDiagnosticAttempt } from "../../lib/diagnostic/diagnostic.scoring";
import { generatePersonalizedRoadmap } from "../../lib/diagnostic/roadmap.generator";
import { analyzeDiagnosticRootCauses } from "../../lib/diagnostic/knowledge.graph";
import { evaluateAdaptiveAdjustments } from "../../lib/diagnostic/adaptive.learning.engine";
import { calculateRetentionMetrics } from "../../lib/spaced-repetition/retention.tracker";
import { SyncManager } from "../../lib/sync/sync-manager";
import { SYNC_EVENT_TYPES } from "../../lib/sync/sync-queue";

export default function GrammarDiagnosticEngine({
  currentUser,
  authToken = null,
  userTracker,
  onNavigateToLesson,
  T,
  isLight,
}) {
  // 'onboarding' | 'testing' | 'results' | 'roadmap'
  const [diagnosticMode, setDiagnosticMode] = useState("onboarding");
  const [testData, setTestData] = useState(null);
  const [isLoadingTest, setIsLoadingTest] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [lastAdjustSummary, setLastAdjustSummary] = useState("");

  const loadAnalytics = useCallback(async () => {
    try {
      const localHistoryRaw = localStorage.getItem("grammar_diagnostic_history");
      const localHistory = localHistoryRaw ? JSON.parse(localHistoryRaw) : [];

      if (currentUser?.id && !currentUser.isGuest) {
        const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
        const res = await fetch(`/api/diagnostic/analytics?user_id=${encodeURIComponent(currentUser.id)}`, { headers });
        const json = await res.json();
        if (res.ok && json.success && !json.guestMode) {
          if (!json.retentionMetrics?.growthSummary && localHistory.length > 0) {
            json.retentionMetrics = calculateRetentionMetrics({ diagnosticAttempts: localHistory });
          }
          setAnalytics(json);
          return;
        }
      }

      if (localHistory.length > 0) {
        setAnalytics({
          guestMode: true,
          attempts: localHistory,
          retentionMetrics: calculateRetentionMetrics({ diagnosticAttempts: localHistory }),
        });
      }
    } catch (e) {
      console.warn("Analytics load warning:", e.message);
    }
  }, [currentUser?.id, currentUser?.isGuest, authToken]);

  // Restore saved assessment and roadmap from localStorage on mount
  useEffect(() => {
    try {
      const savedResult = localStorage.getItem("grammar_diagnostic_result");
      const savedRoadmap = localStorage.getItem("grammar_user_roadmap");
      if (savedResult) {
        setScoreResult(JSON.parse(savedResult));
      }
      if (savedRoadmap) {
        setRoadmap(JSON.parse(savedRoadmap));
      }
    } catch (e) {
      console.warn("Could not read diagnostic from localStorage:", e);
    }
    loadAnalytics();
  }, [loadAnalytics]);

  // Fetch test blueprint from API or fallback locally
  const loadTest = async () => {
    setIsLoadingTest(true);
    try {
      const res = await fetch("/api/diagnostic/test");
      const data = await res.json();
      if (data?.success && data?.test) {
        setTestData(data.test);
        setDiagnosticMode("testing");
        return;
      }
    } catch (err) {
      console.warn("API test load fallback to local:", err);
    }

    // Local fallback
    setTestData({
      id: "a0000000-0000-0000-0000-000000000001",
      title: "Comprehensive Grammar Diagnostic Placement Assessment",
      total_questions: DIAGNOSTIC_QUESTIONS.length,
      time_limit_seconds: 1200,
      topics: DIAGNOSTIC_TOPICS,
      questions: DIAGNOSTIC_QUESTIONS.map((q) => ({
        id: q.id,
        index: q.index,
        topic: q.topic,
        topic_vi: q.topic_vi,
        difficulty: q.difficulty,
        stem: q.stem,
        options: q.options,
        chapter_number: q.chapter_number,
      })),
    });
    setDiagnosticMode("testing");
    setIsLoadingTest(false);
  };

  const handleStartTest = () => {
    loadTest();
  };

  const handleExitTest = () => {
    if (scoreResult) {
      setDiagnosticMode("results");
    } else {
      setDiagnosticMode("onboarding");
    }
  };

  const persistDiagnosticHistory = (scoreObj) => {
    try {
      const prevRaw = localStorage.getItem("grammar_diagnostic_history");
      const list = prevRaw ? JSON.parse(prevRaw) : [];
      list.push({
        total_score: scoreObj.percentage,
        estimated_level: scoreObj.estimated_level?.code || "B1",
        completed_at: scoreObj.completed_at || new Date().toISOString(),
      });
      localStorage.setItem("grammar_diagnostic_history", JSON.stringify(list.slice(-15)));
    } catch {}
  };

  const handleSubmitTest = async (submissionPayload) => {
    setIsSubmitting(true);
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      };
      const res = await fetch("/api/diagnostic/submit", {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...submissionPayload,
          user_id: !currentUser?.isGuest ? currentUser?.id : null,
          user_tracker: userTracker,
        }),
      });

      const data = await res.json();
      if (data?.success && data?.score_result && data?.roadmap) {
        setScoreResult(data.score_result);
        setRoadmap(data.roadmap);
        persistDiagnosticHistory(data.score_result);
        try {
          localStorage.setItem("grammar_diagnostic_result", JSON.stringify(data.score_result));
          localStorage.setItem("grammar_user_roadmap", JSON.stringify(data.roadmap));
        } catch (e) {}
        if (currentUser?.id && !currentUser.isGuest) {
          SyncManager.recordAction(SYNC_EVENT_TYPES.DIAGNOSTIC_COMPLETED, {
            percentage: data.score_result.percentage,
            estimated_level: data.score_result.estimated_level?.code,
          }).catch(() => {});
        }
        loadAnalytics();
        setDiagnosticMode("results");
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      console.warn("Server submission fallback to client-side evaluation:", err);
    }

    // Client-side deterministic fallback
    const localScore = scoreDiagnosticAttempt(
      submissionPayload.answers,
      submissionPayload.duration_seconds
    );
    localScore.root_cause_analysis = analyzeDiagnosticRootCauses(
      localScore.detailed_answers,
      localScore.skill_results
    );
    const localRoadmap = generatePersonalizedRoadmap(localScore, userTracker);
    if (localRoadmap) {
      localRoadmap.current_version = 1;
      localRoadmap.version_history = [
        {
          version_number: 1,
          trigger_reason: "initial_diagnostic",
          adjustments_count: 0,
          summary: "Khởi tạo lộ trình 4 tuần (Local Deterministic Engine).",
          created_at: new Date().toISOString(),
        },
      ];
    }
    setScoreResult(localScore);
    setRoadmap(localRoadmap);
    persistDiagnosticHistory(localScore);

    try {
      localStorage.setItem("grammar_diagnostic_result", JSON.stringify(localScore));
      localStorage.setItem("grammar_user_roadmap", JSON.stringify(localRoadmap));
    } catch (e) {}

    loadAnalytics();
    setDiagnosticMode("results");
    setIsSubmitting(false);
  };

  const handleAdaptiveAdjust = async () => {
    if (!roadmap || isAdjusting) return;
    setIsAdjusting(true);
    setLastAdjustSummary("");
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      };
      const res = await fetch("/api/diagnostic/adaptive/adjust", {
        method: "POST",
        headers,
        body: JSON.stringify({
          user_id: !currentUser?.isGuest ? currentUser?.id : null,
          roadmap,
          score_result: scoreResult,
          user_tracker: userTracker,
          trigger_reason: "manual_adaptive_recalibration",
        }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.roadmap) {
        setRoadmap(json.roadmap);
        setLastAdjustSummary(json.changeSummary);
        try {
          localStorage.setItem("grammar_user_roadmap", JSON.stringify(json.roadmap));
        } catch {}
        return;
      }
    } catch (err) {
      console.warn("Adaptive server fallback to client evaluation:", err.message);
    } finally {
      setIsAdjusting(false);
    }

    // Local fallback evaluation
    const localAdj = evaluateAdaptiveAdjustments({
      roadmap,
      scoreResult,
      userTracker,
      triggerReason: "local_adaptive_recalibration",
    });
    if (localAdj.adjustedRoadmap) {
      setRoadmap(localAdj.adjustedRoadmap);
      setLastAdjustSummary(localAdj.changeSummary);
      try {
        localStorage.setItem("grammar_user_roadmap", JSON.stringify(localAdj.adjustedRoadmap));
      } catch {}
    }
  };

  const handleToggleRoadmapTask = (taskId, isChecked) => {
    if (!roadmap) return;
    const updatedWeeks = roadmap.weeks.map((week) => ({
      ...week,
      tasks: week.tasks.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            status: isChecked ? "completed" : "pending",
          };
        }
        return task;
      }),
    }));

    const updatedRoadmap = {
      ...roadmap,
      weeks: updatedWeeks,
    };
    setRoadmap(updatedRoadmap);

    try {
      localStorage.setItem("grammar_user_roadmap", JSON.stringify(updatedRoadmap));
    } catch (e) {}

    // Async sync to server (authenticated users only)
    if (authToken && currentUser?.id && !currentUser.isGuest) {
      fetch("/api/diagnostic/roadmap", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          task_id: taskId,
          is_completed: isChecked,
          user_id: currentUser.id,
        }),
      }).catch(() => {});
    }
  };

  const handleRetakeTest = () => {
    loadTest();
  };

  return (
    <div style={{ flex: 1, backgroundColor: T.bg, minHeight: "calc(100vh - 56px)" }}>
      {/* Navigation Sub-header (when result or roadmap exists) */}
      {(scoreResult || roadmap) && diagnosticMode !== "testing" && (
        <div
          style={{
            borderBottom: `1px solid ${T.borderSubtle}`,
            backgroundColor: "var(--ds-card)",
            padding: "0.5rem 1.5rem",
          }}
        >
          <div
            style={{
              maxWidth: "960px",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => setDiagnosticMode("results")}
                style={{
                  padding: "0.4rem 0.85rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  backgroundColor: diagnosticMode === "results" ? "var(--ds-btn-primary)" : "transparent",
                  color: diagnosticMode === "results" ? "#ffffff" : T.textMuted,
                  border: "none",
                }}
              >
                📊 Kết Quả Chẩn Đoán ({scoreResult?.percentage || 0}/100)
              </button>

              <button
                onClick={() => setDiagnosticMode("roadmap")}
                style={{
                  padding: "0.4rem 0.85rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  backgroundColor: diagnosticMode === "roadmap" ? "var(--ds-btn-primary)" : "transparent",
                  color: diagnosticMode === "roadmap" ? "#ffffff" : T.textMuted,
                  border: "none",
                }}
              >
                🗺️ Lộ Trình Học 4 Tuần
              </button>
            </div>

            <button
              onClick={handleRetakeTest}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.35rem 0.75rem",
                borderRadius: "0.4rem",
                backgroundColor: "var(--ds-bg-elevated)",
                color: T.text,
                fontSize: "0.8rem",
                fontWeight: 600,
                border: `1px solid ${T.borderSubtle}`,
                cursor: "pointer",
              }}
            >
              <span>Làm lại bài kiểm tra</span>
              <span>🔄</span>
            </button>
          </div>
        </div>
      )}

      {/* Mode View Rendering */}
      {diagnosticMode === "onboarding" && (
        <DiagnosticOnboarding
          onStartTest={handleStartTest}
          hasExistingRoadmap={!!roadmap}
          onViewRoadmap={() => setDiagnosticMode("roadmap")}
          T={T}
          isLight={isLight}
        />
      )}

      {diagnosticMode === "testing" && (
        <DiagnosticTestSession
          test={testData}
          onExit={handleExitTest}
          onSubmit={handleSubmitTest}
          isSubmitting={isSubmitting}
          T={T}
          isLight={isLight}
        />
      )}

      {diagnosticMode === "results" && (
        <DiagnosticAnalysisDashboard
          scoreResult={scoreResult}
          roadmap={roadmap}
          analytics={analytics}
          currentUser={currentUser}
          authToken={authToken}
          onViewRoadmap={() => setDiagnosticMode("roadmap")}
          onRetakeTest={handleRetakeTest}
          onNavigateToLesson={onNavigateToLesson}
          T={T}
          isLight={isLight}
        />
      )}

      {diagnosticMode === "roadmap" && (
        <PersonalizedRoadmapView
          roadmap={roadmap}
          scoreResult={scoreResult}
          currentUser={currentUser}
          authToken={authToken}
          isAdjusting={isAdjusting}
          lastAdjustSummary={lastAdjustSummary}
          onAdaptiveAdjust={handleAdaptiveAdjust}
          onToggleTask={handleToggleRoadmapTask}
          onNavigateToLesson={onNavigateToLesson}
          onRetakeTest={handleRetakeTest}
          T={T}
          isLight={isLight}
        />
      )}
    </div>
  );
}
