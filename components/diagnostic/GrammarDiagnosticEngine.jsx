import React, { useState, useEffect } from "react";
import DiagnosticOnboarding from "./DiagnosticOnboarding";
import DiagnosticTestSession from "./DiagnosticTestSession";
import DiagnosticAnalysisDashboard from "./DiagnosticAnalysisDashboard";
import PersonalizedRoadmapView from "./PersonalizedRoadmapView";
import { DIAGNOSTIC_QUESTIONS, DIAGNOSTIC_TOPICS } from "../../lib/diagnostic/diagnostic.blueprint";
import { scoreDiagnosticAttempt } from "../../lib/diagnostic/diagnostic.scoring";
import { generatePersonalizedRoadmap } from "../../lib/diagnostic/roadmap.generator";

export default function GrammarDiagnosticEngine({
  currentUser,
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
  }, []);

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

  const handleSubmitTest = async (submissionPayload) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/diagnostic/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...submissionPayload,
          user_id: currentUser?.id,
          user_tracker: userTracker,
        }),
      });

      const data = await res.json();
      if (data?.success && data?.score_result && data?.roadmap) {
        setScoreResult(data.score_result);
        setRoadmap(data.roadmap);
        try {
          localStorage.setItem("grammar_diagnostic_result", JSON.stringify(data.score_result));
          localStorage.setItem("grammar_user_roadmap", JSON.stringify(data.roadmap));
        } catch (e) {}
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
    const localRoadmap = generatePersonalizedRoadmap(localScore, userTracker);
    setScoreResult(localScore);
    setRoadmap(localRoadmap);

    try {
      localStorage.setItem("grammar_diagnostic_result", JSON.stringify(localScore));
      localStorage.setItem("grammar_user_roadmap", JSON.stringify(localRoadmap));
    } catch (e) {}

    setDiagnosticMode("results");
    setIsSubmitting(false);
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

    // Async sync to server
    fetch("/api/diagnostic/roadmap", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task_id: taskId,
        is_completed: isChecked,
        user_id: currentUser?.id,
      }),
    }).catch(() => {});
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
            backgroundColor: isLight ? "#ffffff" : "#18181b",
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
                  backgroundColor: diagnosticMode === "results" ? T.accent : "transparent",
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
                  backgroundColor: diagnosticMode === "roadmap" ? T.accent : "transparent",
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
                backgroundColor: isLight ? "#f1f5f9" : "#27272a",
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
