import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AppShell2026 from '../../../../components/ui-2026/AppShell2026';
import { KitIcon } from '../../../../components/ui-2026/KitIcon';
import { ToeicBadge, ToeicButton, ToeicChoiceCard } from '../../../../components/toeic/ui';
import useGlobalAuth from '../../../../hooks/useGlobalAuth';

export default function BossGatePage() {
  const router = useRouter();
  const globalAuth = useGlobalAuth();
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
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!milestoneId || globalAuth.isLoading) return;
    let isMounted = true;
    setIsLoading(true);

    const headers = {};
    if (globalAuth.activeAuthToken) {
      headers.Authorization = `Bearer ${globalAuth.activeAuthToken}`;
    }

    // Fetch milestone data and boss gate questions
    fetch(`/api/toeic/roadmap/${encodeURIComponent(globalAuth.currentUser?.id || 'guest')}`, { headers })
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
        return fetch(`/api/toeic/practice/drill?topicId=${encodeURIComponent(focusTopic)}&limit=${qCount}`, { headers });
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
  }, [milestoneId, globalAuth.isLoading, globalAuth.activeAuthToken, globalAuth.currentUser?.id]);

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
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem' }}>
                    <KitIcon name="timer" size={14} />
                    <span>Còn lại:</span>
                  </span>
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
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto',
                    backgroundColor: result.passed ? 'var(--ds-success-bg)' : 'var(--ds-warning-bg)',
                    color: result.passed ? 'var(--ds-success)' : 'var(--ds-warning)'
                  }}
                >
                  <KitIcon name={result.passed ? 'medal' : 'warning'} size={28} />
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '5rem' }}>
                {/* QUESTION PALETTE (Desktop Inline) */}
                <div
                  className="toeic-card ge-toeic-mobile-hide-palette"
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
                    className="toeic-card ge-diag-card"
                    style={{ padding: '1.75rem' }}
                  >
                    <div className="toeic-flex-between" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--ds-border)', marginBottom: '1rem' }}>
                      <ToeicBadge variant="primary">
                        Câu {currentIndex + 1} / {questions.length}
                      </ToeicBadge>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ds-text-muted)' }}>
                        {currentQ.ai_analysis?.primary_topic_name_vi || currentQ.primary_grammar_topic_id}
                      </span>
                    </div>

                    <div className="ge-diag-stem" style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--ds-text)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
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
                    <div className="toeic-flex-between ge-toeic-desktop-footer" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--ds-border)' }}>
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

                {/* MOBILE COLLAPSIBLE PALETTE SHEET */}
                {showMobilePalette && (
                  <div className="ge-mobile-palette-sheet" role="dialog" aria-label="Danh sách câu hỏi Boss Gate">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--ds-text)' }}>
                        Danh sách câu hỏi ({Object.keys(answers).length}/{questions.length} đã chọn)
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowMobilePalette(false)}
                        style={{ border: 'none', background: 'transparent', fontSize: '0.85rem', fontWeight: 700, color: 'var(--ds-text-muted)', cursor: 'pointer' }}
                      >
                        Đóng ✕
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.45rem' }}>
                      {questions.map((q, i) => {
                        const isAns = !!answers[q.id];
                        const isCurr = i === currentIndex;
                        return (
                          <button
                            key={q.id || i}
                            type="button"
                            onClick={() => {
                              setCurrentIndex(i);
                              setShowMobilePalette(false);
                              if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`toeic-palette-btn ${isCurr ? 'current' : isAns ? 'answered' : ''}`}
                            style={{ height: '38px', fontSize: '0.82rem', fontWeight: 800 }}
                          >
                            {i + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* MOBILE STICKY BOTTOM EXAM DOCK */}
                <div className="ge-mobile-exam-dock" aria-label="Điều hướng nhanh Boss Gate">
                  <button
                    type="button"
                    className="ge-mobile-exam-dock-btn"
                    onClick={() => setShowMobilePalette(prev => !prev)}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                  >
                    <KitIcon name="clipboard" size={14} />
                    <span>{currentIndex + 1}/{questions.length}</span>
                  </button>

                  <button
                    type="button"
                    className="ge-mobile-exam-dock-btn"
                    disabled={currentIndex === 0}
                    onClick={() => {
                      setCurrentIndex(prev => prev - 1);
                      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    ← Trước
                  </button>

                  {currentIndex < questions.length - 1 ? (
                    <button
                      type="button"
                      className="ge-mobile-exam-dock-btn primary"
                      onClick={() => {
                        setCurrentIndex(prev => prev + 1);
                        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      Tiếp theo →
                    </button>
                  ) : null}

                  <button
                    type="button"
                    className="ge-mobile-exam-dock-btn success"
                    onClick={handleFinishTest}
                  >
                    Nộp bài ✓
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppShell2026>
    </>
  );
}
