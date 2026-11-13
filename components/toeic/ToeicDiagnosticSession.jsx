import React, { useState, useEffect, useRef, useCallback } from 'react';
import DiagnosticRadarDashboard from './DiagnosticRadarDashboard';
import MilestoneSkillTree from './MilestoneSkillTree';

/**
 * ToeicDiagnosticSession Component (Milestone E3 & Section 3.2)
 * Orchestrates the full 30-question, 3-stage adaptive diagnostic testing experience.
 * Strict Design Token Discipline: var(--ds-*).
 */
export default function ToeicDiagnosticSession({
  userId = 'guest_user',
  targetScore = 650,
  onFinish
}) {
  const [currentStage, setCurrentStage] = useState(1);
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentPassage, setCurrentPassage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: { selectedOption, timeSpentSec, usedHint } }
  const [flags, setFlags] = useState({}); // { [questionId]: boolean }
  const [stageAnswers, setStageAnswers] = useState({ 1: [], 2: [], 3: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [activeTab, setActiveTab] = useState('radar'); // 'radar' | 'tree'

  // Per-question timer
  const [questionTimerSec, setQuestionTimerSec] = useState(0);
  const timerRef = useRef(null);

  // Initialize Stage 1 on mount
  useEffect(() => {
    let isMounted = true;
    async function startTest() {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch('/api/toeic/diagnostic/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, targetScore })
        });
        const data = await res.json();
        if (data.success && isMounted) {
          setSessionId(data.sessionId);
          setQuestions(data.questions || []);
          setCurrentIndex(0);
          setCurrentStage(1);
        } else if (isMounted) {
          setErrorMsg(data.error || 'Không thể tải đề thi chẩn đoán');
        }
      } catch (e) {
        if (isMounted) setErrorMsg('Lỗi mạng khi tải đề thi chẩn đoán');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    startTest();
    return () => { isMounted = false; };
  }, [userId, targetScore]);

  // Question Timer Interval
  useEffect(() => {
    setQuestionTimerSec(0);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setQuestionTimerSec(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, currentStage]);

  const currentQ = questions[currentIndex] || null;

  // Handle Option Select
  const handleSelectOption = useCallback((optionKey) => {
    if (!currentQ) return;
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: {
        questionId: currentQ.id,
        selectedOption: optionKey,
        timeSpentSec: (prev[currentQ.id]?.timeSpentSec || 0) + questionTimerSec,
        usedHint: false
      }
    }));
  }, [currentQ, questionTimerSec]);

  // Toggle Flag
  const handleToggleFlag = useCallback(() => {
    if (!currentQ) return;
    setFlags(prev => ({
      ...prev,
      [currentQ.id]: !prev[currentQ.id]
    }));
  }, [currentQ]);

  // Keyboard Shortcuts (1-4 / A-D)
  useEffect(() => {
    function handleKeyDown(e) {
      if (diagnosticResult || isLoading || isSubmitting) return;
      const key = e.key.toUpperCase();
      if (key === '1' || key === 'A') handleSelectOption('A');
      else if (key === '2' || key === 'B') handleSelectOption('B');
      else if (key === '3' || key === 'C') handleSelectOption('C');
      else if (key === '4' || key === 'D') handleSelectOption('D');
      else if (key === 'F') handleToggleFlag();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSelectOption, handleToggleFlag, diagnosticResult, isLoading, isSubmitting]);

  // Navigation handlers
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Submit Stage or Final Test
  const handleSubmitStage = async () => {
    // Collect answers for current stage
    const currentStageResponses = questions.map(q => {
      const ans = answers[q.id];
      return {
        questionId: q.id,
        selectedOption: ans?.selectedOption || null,
        timeSpentSec: ans?.timeSpentSec || q.recommended_time_sec || 12
      };
    });

    if (currentStage === 1) {
      // Transition to Stage 2
      setIsLoading(true);
      try {
        const res = await fetch('/api/toeic/diagnostic/stage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            stage: 1,
            responses: currentStageResponses,
            previousQuestionIds: questions.map(q => q.id)
          })
        });
        const data = await res.json();
        if (data.success) {
          setStageAnswers(prev => ({ ...prev, 1: currentStageResponses }));
          setQuestions(data.questions || []);
          setCurrentIndex(0);
          setCurrentStage(2);
        } else {
          setErrorMsg(data.error || 'Lỗi chuyển chặng 2');
        }
      } catch (e) {
        setErrorMsg('Lỗi kết nối khi chuyển chặng');
      } finally {
        setIsLoading(false);
      }
    } else if (currentStage === 2) {
      // Transition to Stage 3
      setIsLoading(true);
      try {
        const allPrevIds = [...stageAnswers[1].map(r => r.questionId), ...questions.map(q => q.id)];
        const res = await fetch('/api/toeic/diagnostic/stage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            stage: 2,
            responses: currentStageResponses,
            previousQuestionIds: allPrevIds
          })
        });
        const data = await res.json();
        if (data.success) {
          setStageAnswers(prev => ({ ...prev, 2: currentStageResponses }));
          setQuestions(data.questions || []);
          setCurrentPassage(data.passage || null);
          setCurrentIndex(0);
          setCurrentStage(3);
        } else {
          setErrorMsg(data.error || 'Lỗi chuyển chặng 3');
        }
      } catch (e) {
        setErrorMsg('Lỗi kết nối khi chuyển chặng');
      } finally {
        setIsLoading(false);
      }
    } else if (currentStage === 3) {
      // Final Submit: aggregate all 30 responses
      setIsSubmitting(true);
      try {
        const allResponses = [
          ...stageAnswers[1],
          ...stageAnswers[2],
          ...currentStageResponses
        ];

        const res = await fetch('/api/toeic/diagnostic/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            userId,
            targetScore,
            responses: allResponses
          })
        });
        const data = await res.json();
        if (data.success) {
          setDiagnosticResult(data);
          if (onFinish) onFinish(data);
        } else {
          setErrorMsg(data.error || 'Lỗi chấm điểm bài kiểm tra');
        }
      } catch (e) {
        setErrorMsg('Lỗi kết nối khi nộp bài');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Render Result View when test completed
  if (diagnosticResult) {
    return (
      <div className="w-full space-y-6 py-6">
        {/* VIEW TABS */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('radar')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'radar'
                ? 'shadow-sm'
                : 'border hover:bg-[var(--ds-surface-secondary)]'
            }`}
            style={{
              backgroundColor: activeTab === 'radar' ? 'var(--ds-primary)' : 'var(--ds-surface)',
              color: activeTab === 'radar' ? 'var(--ds-surface)' : 'var(--ds-text-primary)',
              borderColor: 'var(--ds-border)'
            }}
          >
            📊 Bản Đồ Năng Lực & Mục Tiêu Focus
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tree')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'tree'
                ? 'shadow-sm'
                : 'border hover:bg-[var(--ds-surface-secondary)]'
            }`}
            style={{
              backgroundColor: activeTab === 'tree' ? 'var(--ds-primary)' : 'var(--ds-surface)',
              color: activeTab === 'tree' ? 'var(--ds-surface)' : 'var(--ds-text-primary)',
              borderColor: 'var(--ds-border)'
            }}
          >
            🏆 Lộ Trình 7 Milestones Vượt Trạm
          </button>
        </div>

        {activeTab === 'radar' ? (
          <DiagnosticRadarDashboard
            diagnosticResult={diagnosticResult}
            onViewRoadmap={() => setActiveTab('tree')}
            onStartTopicDrill={(topicId) => {
              if (window) window.location.href = `/toeic/practice/${topicId}`;
            }}
          />
        ) : (
          <MilestoneSkillTree
            milestones={diagnosticResult.milestones || []}
            onStartDrill={(ms) => {
              const firstTopic = ms.injected_weak_topic_ids_json?.[0] || ms.focus_topic_ids?.[0];
              if (firstTopic && window) {
                window.location.href = `/toeic/practice/${firstTopic}`;
              }
            }}
            onStartBossGate={(ms) => {
              if (window) window.location.href = `/toeic/milestones/${ms.milestone_id}/boss-gate`;
            }}
          />
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
             style={{ borderColor: 'var(--ds-primary)', borderTopColor: 'transparent' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
          {currentStage === 1
            ? 'Đang chuẩn bị đề kiểm tra chẩn đoán 3 chặng...'
            : `Đang phân tích kết quả Chặng ${currentStage - 1} & cá nhân hóa Chặng ${currentStage}...`}
        </p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="rounded-2xl p-6 border text-center space-y-3 max-w-md mx-auto my-12"
           style={{ backgroundColor: 'var(--ds-danger-subtle)', borderColor: 'var(--ds-danger)' }}>
        <p className="text-sm font-bold" style={{ color: 'var(--ds-danger)' }}>{errorMsg}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl text-xs font-bold"
          style={{ backgroundColor: 'var(--ds-primary)', color: 'var(--ds-surface)' }}
        >
          Thử Lại
        </button>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const currentAnswer = currentQ ? answers[currentQ.id]?.selectedOption : null;
  const isFlagged = currentQ ? !!flags[currentQ.id] : false;
  const recommendedTime = currentQ?.recommended_time_sec || 12;

  // Pacing Color Status
  let pacingColor = 'var(--ds-success)';
  if (questionTimerSec > recommendedTime) {
    pacingColor = 'var(--ds-warning)';
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 py-4">
      {/* 1. STAGE PROGRESS HEADER */}
      <div className="rounded-2xl p-4 sm:p-5 border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
           style={{ backgroundColor: 'var(--ds-surface)', borderColor: 'var(--ds-border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm"
               style={{ backgroundColor: 'var(--ds-primary)', color: 'var(--ds-surface)' }}>
            {currentStage}
          </div>
          <div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--ds-text-primary)' }}>
              {currentStage === 1 && 'Chặng 1: Thăm Dò Nền Tảng (Baseline Probe)'}
              {currentStage === 2 && 'Chặng 2: Thích Ứng Phân Hóa Độ Khó (Adaptive Branching)'}
              {currentStage === 3 && 'Chặng 3: Xác Thực Điểm Yếu & Tốc Độ Đọc (Verification)'}
            </h3>
            <p className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>
              Câu {currentIndex + 1} / {questions.length} • Tổng đã chọn: {answeredCount} / 30 câu
            </p>
          </div>
        </div>

        {/* STAGE STEP PILLS */}
        <div className="flex items-center gap-2 text-xs">
          {[1, 2, 3].map(st => (
            <div
              key={st}
              className="px-3 py-1 rounded-full font-bold flex items-center gap-1.5 transition-all"
              style={{
                backgroundColor: currentStage === st
                  ? 'var(--ds-primary)'
                  : currentStage > st
                  ? 'var(--ds-success)'
                  : 'var(--ds-surface-secondary)',
                color: (currentStage === st || currentStage > st) ? 'var(--ds-surface)' : 'var(--ds-text-muted)'
              }}
            >
              <span>{currentStage > st ? '✓' : st}</span>
              <span className="hidden sm:inline">
                {st === 1 ? 'Nền tảng' : st === 2 ? 'Thích ứng' : 'Xác thực'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. QUESTION PALETTE */}
      <div className="p-3 rounded-xl border flex flex-wrap items-center gap-1.5"
           style={{ backgroundColor: 'var(--ds-surface-secondary)', borderColor: 'var(--ds-border)' }}>
        {questions.map((q, idx) => {
          const isAns = !!answers[q.id]?.selectedOption;
          const isFl = !!flags[q.id];
          const isCurr = idx === currentIndex;

          return (
            <button
              key={q.id || idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center relative ${
                isCurr ? 'ring-2 ring-[var(--ds-primary)]' : ''
              }`}
              style={{
                backgroundColor: isAns
                  ? 'var(--ds-primary)'
                  : 'var(--ds-surface)',
                color: isAns ? 'var(--ds-surface)' : 'var(--ds-text-primary)',
                borderColor: 'var(--ds-border)'
              }}
            >
              {idx + 1}
              {isFl && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                      style={{ backgroundColor: 'var(--ds-warning)' }} />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. QUESTION CARD */}
      {currentQ && (
        <div className="rounded-2xl p-6 sm:p-8 border shadow-sm space-y-6"
             style={{ backgroundColor: 'var(--ds-surface)', borderColor: 'var(--ds-border)' }}>
          {/* TOP INFO & PACING TIMER */}
          <div className="flex items-center justify-between pb-4 border-b"
               style={{ borderColor: 'var(--ds-border)' }}>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                    style={{ backgroundColor: 'var(--ds-surface-secondary)', color: 'var(--ds-text-primary)' }}>
                Part {currentQ.part} • #{currentQ.number || currentIndex + 1}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded"
                    style={{ backgroundColor: 'var(--ds-primary-subtle)', color: 'var(--ds-primary)' }}>
                {currentQ.ai_analysis?.primary_topic_name_vi || currentQ.primary_grammar_topic_id}
              </span>
            </div>

            {/* Pacing Timer */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border"
                   style={{ borderColor: pacingColor, color: pacingColor }}>
                <span>⏱️ {questionTimerSec}s</span>
                <span className="text-[10px] font-normal" style={{ color: 'var(--ds-text-muted)' }}>
                  / mục tiêu {recommendedTime}s
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleFlag}
                className="text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1 font-medium transition-all"
                style={{
                  backgroundColor: isFlagged ? 'var(--ds-warning-subtle)' : 'transparent',
                  borderColor: isFlagged ? 'var(--ds-warning)' : 'var(--ds-border)',
                  color: isFlagged ? 'var(--ds-warning)' : 'var(--ds-text-muted)'
                }}
              >
                <span>{isFlagged ? '🚩 Đã gắn cờ' : '🏳️ Đặt cờ'}</span>
              </button>
            </div>
          </div>

          {/* PASSAGE (If Part 7 or Part 6 context) */}
          {currentPassage && currentPassage.text && currentQ.part === 7 && (
            <div className="p-4 rounded-xl border max-h-60 overflow-y-auto text-sm leading-relaxed"
                 style={{ backgroundColor: 'var(--ds-surface-secondary)', borderColor: 'var(--ds-border)', color: 'var(--ds-text-primary)' }}>
              <div className="font-bold text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--ds-text-muted)' }}>
                Đoạn văn đọc hiểu (Part 7):
              </div>
              <div className="whitespace-pre-line font-serif">
                {currentPassage.text}
              </div>
            </div>
          )}

          {/* QUESTION STEM */}
          <div className="text-base sm:text-lg font-medium leading-relaxed" style={{ color: 'var(--ds-text-primary)' }}>
            {currentQ.context_sentence || currentQ.stem}
          </div>

          {/* 4 OPTIONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {(['A', 'B', 'C', 'D']).map(optKey => {
              const optText = currentQ.options?.[optKey];
              if (!optText) return null;
              const isSelected = currentAnswer === optKey;

              return (
                <button
                  key={optKey}
                  type="button"
                  onClick={() => handleSelectOption(optKey)}
                  className={`w-full p-4 rounded-xl border text-left flex items-center gap-3 transition-all hover:border-[var(--ds-primary)] active:scale-[0.99] ${
                    isSelected ? 'shadow-sm ring-2 ring-[var(--ds-primary)]' : ''
                  }`}
                  style={{
                    backgroundColor: isSelected ? 'var(--ds-primary-subtle)' : 'var(--ds-surface)',
                    borderColor: isSelected ? 'var(--ds-primary)' : 'var(--ds-border)'
                  }}
                >
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-all"
                    style={{
                      backgroundColor: isSelected ? 'var(--ds-primary)' : 'var(--ds-surface-secondary)',
                      color: isSelected ? 'var(--ds-surface)' : 'var(--ds-text-primary)'
                    }}
                  >
                    {optKey}
                  </span>
                  <span className="text-sm sm:text-base font-medium" style={{ color: 'var(--ds-text-primary)' }}>
                    {optText}
                  </span>
                </button>
              );
            })}
          </div>

          {/* BOTTOM CONTROLS */}
          <div className="flex items-center justify-between pt-6 border-t"
               style={{ borderColor: 'var(--ds-border)' }}>
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={handlePrev}
              className="px-4 py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-40"
              style={{ borderColor: 'var(--ds-border)', color: 'var(--ds-text-primary)' }}
            >
              ← Câu trước
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                style={{ backgroundColor: 'var(--ds-primary)', color: 'var(--ds-surface)' }}
              >
                <span>Câu tiếp theo</span>
                <span>→</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitStage}
                className="px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                style={{
                  backgroundColor: currentStage === 3 ? 'var(--ds-success)' : 'var(--ds-primary)',
                  color: 'var(--ds-surface)'
                }}
              >
                {isSubmitting
                  ? 'Đang chấm điểm...'
                  : currentStage === 3
                  ? '🏁 Hoàn Thành & Xem Kết Quả'
                  : `Chuyển Sang Chặng ${currentStage + 1} →`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
