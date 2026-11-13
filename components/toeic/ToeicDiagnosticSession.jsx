import React, { useState, useEffect, useRef, useCallback } from 'react';
import DiagnosticRadarDashboard from './DiagnosticRadarDashboard';
import MilestoneSkillTree from './MilestoneSkillTree';
import { ToeicCard, ToeicButton, ToeicBadge, ToeicChoiceCard, ToeicQuestionPalette } from './ui';

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
  const [answers, setAnswers] = useState({}); // { [questionId]: { selectedOption, timeSpentSec } }
  const [flags, setFlags] = useState({}); // { [questionId]: boolean }
  const [stageAnswers, setStageAnswers] = useState({ 1: [], 2: [], 3: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [activeTab, setActiveTab] = useState('radar'); // 'radar' | 'tree'

  // Per-question timer (seconds)
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

  // Track per-question timer
  useEffect(() => {
    setQuestionTimerSec(0);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setQuestionTimerSec(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, currentStage]);

  const currentQ = questions[currentIndex];

  // Select Option handler
  const handleSelectOption = useCallback((optionKey) => {
    if (!currentQ) return;
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: {
        selectedOption: optionKey,
        timeSpentSec: (prev[currentQ.id]?.timeSpentSec || 0) + questionTimerSec
      }
    }));
  }, [currentQ, questionTimerSec]);

  // Keyboard shortcuts (1, 2, 3, 4 or A, B, C, D)
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const key = e.key.toUpperCase();
      if (key === '1' || key === 'A') handleSelectOption('A');
      else if (key === '2' || key === 'B') handleSelectOption('B');
      else if (key === '3' || key === 'C') handleSelectOption('C');
      else if (key === '4' || key === 'D') handleSelectOption('D');
      else if (e.key === 'ArrowRight' && currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSelectOption, currentIndex, questions.length]);

  const toggleFlag = () => {
    if (!currentQ) return;
    setFlags(prev => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
  };

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
    const currentStageResponses = questions.map(q => {
      const ans = answers[q.id];
      return {
        questionId: q.id,
        selectedOption: ans?.selectedOption || null,
        timeSpentSec: ans?.timeSpentSec || q.recommended_time_sec || 12
      };
    });

    if (currentStage === 1) {
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
      setIsSubmitting(true);
      try {
        const all30Responses = [
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
            responses: all30Responses
          })
        });
        const data = await res.json();
        if (data.success) {
          setDiagnosticResult(data);
          if (onFinish) onFinish(data);
        } else {
          setErrorMsg(data.error || 'Lỗi nộp bài kiểm tra');
        }
      } catch (e) {
        setErrorMsg('Lỗi kết nối máy chủ khi nộp bài');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // 1. RESULT VIEW (When test is finished)
  if (diagnosticResult) {
    return (
      <div className="toeic-container" style={{ padding: '1rem 0' }}>
        {/* Result Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <ToeicButton
            variant={activeTab === 'radar' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('radar')}
          >
            📊 Bản Đồ Năng Lực &amp; Mục Tiêu Focus
          </ToeicButton>

          <ToeicButton
            variant={activeTab === 'tree' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('tree')}
          >
            🏆 Lộ Trình 7 Milestones Vượt Trạm
          </ToeicButton>
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

  // 2. LOADING STATE
  if (isLoading) {
    return (
      <div className="toeic-container-narrow" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div style={{
          width: '42px',
          height: '42px',
          border: '4px solid var(--ds-accent)',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'toeicPulse 0.8s infinite alternate',
          margin: '0 auto 1.25rem auto'
        }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
          {currentStage === 1
            ? 'Đang nạp bộ câu hỏi chẩn đoán 3 chặng...'
            : `Đang phân tích Chặng ${currentStage - 1} & chuẩn bị câu hỏi thích ứng Chặng ${currentStage}...`}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--ds-text-muted)' }}>
          Hệ thống AI ước lượng năng lực IRT 3PL theo thời gian thực
        </p>
      </div>
    );
  }

  // 3. ERROR STATE
  if (errorMsg) {
    return (
      <div className="toeic-container-narrow" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
        <ToeicCard style={{ borderColor: 'var(--ds-danger)', backgroundColor: 'var(--ds-danger-bg)' }}>
          <h3 style={{ color: 'var(--ds-danger)', margin: '0 0 0.5rem 0' }}>{errorMsg}</h3>
          <ToeicButton variant="primary" onClick={() => window.location.reload()}>
            Tải Lại Bài Thi
          </ToeicButton>
        </ToeicCard>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const currentAnswer = currentQ ? answers[currentQ.id]?.selectedOption : null;
  const isFlagged = currentQ ? !!flags[currentQ.id] : false;
  const recommendedTime = currentQ?.recommended_time_sec || 12;

  // Render question text with stylized blank
  const renderQuestionStem = () => {
    if (!currentQ) return null;
    const text = currentQ.stem || currentQ.context_sentence || currentQ.question_text || '';
    if (text.includes('_______')) {
      const parts = text.split('_______');
      return (
        <div className="toeic-q-stem">
          {parts[0]}
          <span className="toeic-q-blank">
            {currentAnswer || '______'}
          </span>
          {parts[1]}
        </div>
      );
    }
    return <div className="toeic-q-stem">{text}</div>;
  };

  return (
    <div className="toeic-container">
      {/* 1. EXAM HEADER & STEPPER (Milestone U3.1) */}
      <div className="toeic-exam-topbar">
        <div className="toeic-flex-row">
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--ds-accent)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.95rem'
          }}>
            {currentStage}
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--ds-text)' }}>
              {currentStage === 1 && 'Chặng 1: Thăm Dò Nền Tảng (Baseline Probe)'}
              {currentStage === 2 && 'Chặng 2: Thích Ứng Phân Hóa Độ Khó (Adaptive Branching)'}
              {currentStage === 3 && 'Chặng 3: Xác Thực Điểm Yếu & Tốc Độ (Verification)'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--ds-text-muted)' }}>
              Câu {currentIndex + 1} / {questions.length} • Đã làm: {answeredCount}/30
            </div>
          </div>
        </div>

        {/* Stepper pills */}
        <div className="toeic-stepper">
          {[1, 2, 3].map(st => (
            <div key={st} className={`toeic-step-item ${currentStage >= st ? 'active' : ''}`}>
              <div className="toeic-step-dot">
                {currentStage > st ? '✓' : st}
              </div>
              <span style={{ display: 'none' }} className="sm-inline">
                {st === 1 ? 'Nền tảng' : st === 2 ? 'Thích ứng' : 'Xác thực'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. MAIN WORKSPACE (Bento Grid: Question Area 8 cols, Palette 4 cols) */}
      <div className="toeic-bento-grid">
        {/* LEFT / CENTER: Question Area */}
        <div className="toeic-col-8">
          <div className="toeic-q-card">
            {/* Question Card Header */}
            <div className="toeic-q-header">
              <div className="toeic-flex-row">
                <ToeicBadge variant="primary">
                  {currentQ?.skill_category || 'Part 5'} • #{currentQ?.number || currentIndex + 1}
                </ToeicBadge>
                {currentQ?.target_score_band && (
                  <ToeicBadge variant="muted">
                    Target {currentQ.target_score_band}
                  </ToeicBadge>
                )}
              </div>

              {/* Timer & Flag Button */}
              <div className="toeic-flex-row">
                <div className={`toeic-pacing-pill ${questionTimerSec > recommendedTime ? 'toeic-pacing-yellow' : 'toeic-pacing-green'}`}>
                  ⏱️ {questionTimerSec}s / mục tiêu {recommendedTime}s
                </div>

                <ToeicButton
                  variant={isFlagged ? 'warning' : 'ghost'}
                  size="sm"
                  onClick={toggleFlag}
                  icon={<span>{isFlagged ? '🚩' : '🏳️'}</span>}
                >
                  {isFlagged ? 'Đã cắm cờ' : 'Cắm cờ'}
                </ToeicButton>
              </div>
            </div>

            {/* Reading Passage if available (Stage 3 Part 7) */}
            {currentPassage && (
              <div style={{
                backgroundColor: 'var(--ds-bg-elevated)',
                border: '1px solid var(--ds-border)',
                borderRadius: '0.85rem',
                padding: '1rem',
                marginBottom: '1.5rem',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                maxHeight: '220px',
                overflowY: 'auto'
              }}>
                <div style={{ fontWeight: 800, marginBottom: '0.5rem', color: 'var(--ds-accent)' }}>
                  📄 {currentPassage.title || 'Đoạn văn đọc hiểu:'}
                </div>
                <div style={{ whiteSpace: 'pre-line' }}>
                  {currentPassage.content_en || currentPassage.text}
                </div>
              </div>
            )}

            {/* Question Stem */}
            {renderQuestionStem()}

            {/* Choices Grid (A, B, C, D) */}
            <div className="toeic-choice-grid">
              {['A', 'B', 'C', 'D'].map((optKey, idx) => {
                const optText = currentQ?.options?.[optKey] || '';
                const isSelected = currentAnswer === optKey;

                return (
                  <ToeicChoiceCard
                    key={optKey}
                    choiceKey={optKey}
                    text={optText}
                    selected={isSelected}
                    onSelect={() => handleSelectOption(optKey)}
                    shortcut={`Phím ${idx + 1}`}
                  />
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="toeic-exam-footer">
              <ToeicButton
                variant="secondary"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                icon={<span>&larr;</span>}
              >
                Câu trước
              </ToeicButton>

              <div className="toeic-flex-row">
                {currentIndex < questions.length - 1 ? (
                  <ToeicButton
                    variant="primary"
                    onClick={handleNext}
                  >
                    Câu tiếp theo &rarr;
                  </ToeicButton>
                ) : (
                  <ToeicButton
                    variant="success"
                    onClick={handleSubmitStage}
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? 'Đang tính điểm IRT...'
                      : currentStage === 3
                      ? 'Hoàn thành & Xem kết quả'
                      : `Nộp Chặng ${currentStage} & Chuyển Chặng ${currentStage + 1}`}
                  </ToeicButton>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Question Palette (4 cols) */}
        <div className="toeic-col-4">
          <ToeicQuestionPalette
            questions={questions}
            currentIndex={currentIndex}
            answers={answers}
            flagged={flags}
            onSelectIndex={(idx) => setCurrentIndex(idx)}
            title={`Chặng ${currentStage} (10 câu)`}
          />
        </div>
      </div>
    </div>
  );
}
