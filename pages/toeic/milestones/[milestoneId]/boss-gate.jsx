import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AppShell2026 from '../../../../components/ui-2026/AppShell2026';
import { ToeicBadge, ToeicButton, ToeicChoiceCard } from '../../../../components/toeic/ui';

export default function BossGatePage() {
  const router = useRouter();
  const { milestoneId } = router.query;
  const [isLight, setIsLight] = useState(true);
  const [milestone, setMilestone] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeftSec, setTimeLeftSec] = useState(420);
  const [isFinished, setIsFinished] = useState(false);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!milestoneId) return;
    let isMounted = true;
    setIsLoading(true);

    // Fetch milestone data and boss gate questions
    fetch(`/api/toeic/roadmap/user_student`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        const ms = data.milestones?.find(m => m.milestone_id === milestoneId) || data.milestones?.[0];
        setMilestone(ms);

        const focusTopic = ms?.focus_topic_ids?.[0] || 'GRM_POS_NOUN';
        const qCount = ms?.boss_gate_criteria?.question_count || 15;
        const maxTime = ms?.boss_gate_criteria?.max_time_sec || 420;
        setTimeLeftSec(maxTime);

        // Fetch drill questions for this milestone
        return fetch(`/api/toeic/practice/drill?topicId=${focusTopic}&limit=${qCount}`);
      })
      .then(res => res.json())
      .then(qData => {
        if (!isMounted) return;
        setQuestions(qData.questions || []);
      })
      .catch(e => console.error(e))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [milestoneId]);

  // Countdown Timer
  useEffect(() => {
    if (isFinished || isLoading) return;
    timerRef.current = setInterval(() => {
      setTimeLeftSec(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isFinished, isLoading]);

  const handleSelectOption = (optKey) => {
    const q = questions[currentIndex];
    if (!q || isFinished) return;
    setAnswers(prev => ({
      ...prev,
      [q.id]: optKey
    }));
  };

  const handleFinishTest = () => {
    clearInterval(timerRef.current);
    setIsFinished(true);

    let correct = 0;
    const wrongQuestions = [];
    for (const q of questions) {
      if (answers[q.id] === q.correct_answer) {
        correct++;
      } else {
        wrongQuestions.push(q);
      }
    }

    const accuracy = Math.round((correct / Math.max(1, questions.length)) * 100);
    const minAcc = milestone?.boss_gate_criteria?.min_accuracy_pct || 80;
    const passed = accuracy >= minAcc;

    setResult({
      passed,
      correct,
      total: questions.length,
      accuracy,
      minAcc,
      wrongQuestions
    });
  };

  const currentQ = questions[currentIndex] || null;
  const minutes = Math.floor(timeLeftSec / 60);
  const seconds = timeLeftSec % 60;
  const timeFormatted = `${minutes}:${String(seconds).padStart(2, '0')}`;

  return (
    <>
      <Head>
        <title>Thi Vượt Trạm Boss Gate ({milestone?.title_vi || milestoneId}) | Grammar Engine</title>
        <meta name="description" content="Kỳ thi vượt trạm Boss Gate mở khóa Milestone kế tiếp." />
      </Head>

      <AppShell2026
        activeView="toeic"
        toeicSubView="hub"
        onSelectView={(v) => {
          if (v === 'toeic') {
            if (typeof window !== 'undefined' && window.location.pathname !== '/toeic') {
              window.location.href = '/toeic';
            }
            return;
          }
          if (typeof window !== 'undefined') {
            window.location.href = v === 'dashboard' ? '/' : `/?view=${v}`;
          }
        }}
        isLight={isLight}
        onToggleTheme={() => setIsLight(prev => !prev)}
        currentChapterTitle="Boss Gate Checkpoint"
      >
        <div className="toeic-page-wrap">
          <div className="toeic-container" style={{ maxWidth: '860px' }}>
            {/* BACK TO HUB */}
            <div className="toeic-flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <a
                href="/toeic"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--ds-accent)',
                  textDecoration: 'none'
                }}
              >
                <span>&larr; Quay lại TOEIC Hub</span>
              </a>

              {/* COUNTDOWN TIMER */}
              {!isFinished && !isLoading && (
                <div
                  className={`toeic-pacing-pill ${timeLeftSec < 60 ? 'toeic-pacing-red' : 'toeic-pacing-green'}`}
                >
                  <span>⏱️ Còn lại:</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 800 }}>{timeFormatted}</span>
                </div>
              )}
            </div>

            {/* RESULTS VIEW */}
            {isFinished && result && (
              <div
                className="toeic-card"
                style={{
                  padding: '2.5rem',
                  textAlign: 'center',
                  borderColor: result.passed ? 'var(--ds-success)' : 'var(--ds-warning)',
                  backgroundColor: 'var(--ds-card)'
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                  {result.passed ? '🏆' : '⚠️'}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--ds-text)' }}>
                    {result.passed
                      ? 'CHÚC MỪNG! BẠN ĐÃ VƯỢT TRẠM THÀNH CÔNG!'
                      : 'CHƯA ĐẠT CHUẨN VƯỢT TRẠM!'}
                  </h2>
                  <p style={{ fontSize: '0.95rem', color: 'var(--ds-text-secondary)', margin: 0 }}>
                    Độ chính xác: <strong style={{ color: result.passed ? 'var(--ds-success)' : 'var(--ds-danger)' }}>{result.accuracy}%</strong> ({result.correct}/{result.total} câu) • Tiêu chuẩn: &ge; {result.minAcc}%
                  </p>
                </div>

                {result.passed ? (
                  <div style={{ maxWidth: '420px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--ds-text-muted)', margin: 0 }}>
                      Trạm tiếp theo trong Lộ trình 7 Milestones đã được mở khóa tự động.
                    </p>
                    <a
                      href="/toeic"
                      className="toeic-btn toeic-btn-success"
                      style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}
                    >
                      Tiếp Tục Lộ Trình Vượt Trạm &rarr;
                    </a>
                  </div>
                ) : (
                  <div style={{ maxWidth: '440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--ds-text-muted)', margin: 0 }}>
                      Hệ thống đã tự động tạo gói <strong>10 câu Twin Questions</strong> để bạn củng cố các câu làm sai trước khi thi lại Boss Gate!
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="toeic-btn toeic-btn-secondary"
                      >
                        Thi Lại Ngay
                      </button>

                      <a
                        href="/toeic/practice/GRM_POS_NOUN"
                        className="toeic-btn toeic-btn-primary"
                      >
                        Luyện Gói Khắc Phục Lỗi &rarr;
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TEST RUNNER */}
            {!isFinished && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* QUESTION PALETTE */}
                <div
                  className="toeic-card"
                  style={{
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.35rem',
                    backgroundColor: 'var(--ds-bg-elevated)'
                  }}
                >
                  {questions.map((q, i) => {
                    const isAns = !!answers[q.id];
                    const isCurr = i === currentIndex;
                    return (
                      <button
                        key={q.id || i}
                        type="button"
                        onClick={() => setCurrentIndex(i)}
                        className={`toeic-palette-btn ${isCurr ? 'current' : isAns ? 'answered' : ''}`}
                        style={{
                          width: '32px',
                          height: '32px',
                          fontSize: '0.75rem',
                          fontWeight: 800
                        }}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>

                {/* CURRENT QUESTION CARD */}
                {currentQ && (
                  <div
                    className="toeic-card"
                    style={{ padding: '1.75rem' }}
                  >
                    <div className="toeic-flex-between" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--ds-border)', marginBottom: '1.25rem' }}>
                      <ToeicBadge variant="primary">
                        Câu {currentIndex + 1} / {questions.length}
                      </ToeicBadge>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ds-text-muted)' }}>
                        {currentQ.ai_analysis?.primary_topic_name_vi || currentQ.primary_grammar_topic_id}
                      </span>
                    </div>

                    <div style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--ds-text)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                      {currentQ.context_sentence || currentQ.stem}
                    </div>

                    {/* OPTIONS */}
                    <div className="toeic-choice-grid">
                      {(['A', 'B', 'C', 'D']).map((optKey, idx) => {
                        const optText = currentQ.options?.[optKey];
                        if (!optText) return null;
                        const isSelected = answers[currentQ.id] === optKey;

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

                    {/* CONTROLS */}
                    <div className="toeic-flex-between" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--ds-border)' }}>
                      <ToeicButton
                        variant="secondary"
                        disabled={currentIndex === 0}
                        onClick={() => setCurrentIndex(prev => prev - 1)}
                        icon={<span>&larr;</span>}
                      >
                        Câu trước
                      </ToeicButton>

                      {currentIndex < questions.length - 1 ? (
                        <ToeicButton
                          variant="primary"
                          onClick={() => setCurrentIndex(prev => prev + 1)}
                        >
                          Câu tiếp theo &rarr;
                        </ToeicButton>
                      ) : (
                        <ToeicButton
                          variant="success"
                          onClick={handleFinishTest}
                        >
                          Nộp Bài Thi Boss Gate ✓
                        </ToeicButton>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </AppShell2026>
    </>
  );
}
