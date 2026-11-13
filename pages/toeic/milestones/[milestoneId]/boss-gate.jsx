import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AppShell2026 from '../../../../components/ui-2026/AppShell2026';

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
            <div className="toeic-flex-between" style={{ marginBottom: '1.25rem' }}>
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
                  className="px-4 py-1.5 rounded-full border text-sm font-bold flex items-center gap-2"
                  style={{
                    backgroundColor: timeLeftSec < 60 ? 'var(--ds-danger-subtle)' : 'var(--ds-surface)',
                    borderColor: timeLeftSec < 60 ? 'var(--ds-danger)' : 'var(--ds-border)',
                    color: timeLeftSec < 60 ? 'var(--ds-danger)' : 'var(--ds-text-primary)'
                  }}
                >
                  <span>⏱️ Còn lại:</span>
                  <span className="font-mono text-base">{timeFormatted}</span>
                </div>
              )}
            </div>

            {/* RESULTS VIEW */}
            {isFinished && result && (
              <div
                className="rounded-3xl p-8 border text-center space-y-6 shadow-sm"
                style={{
                  backgroundColor: 'var(--ds-surface)',
                  borderColor: result.passed ? 'var(--ds-success)' : 'var(--ds-warning)'
                }}
              >
                <div className="text-4xl">
                  {result.passed ? '🏆' : '⚠️'}
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--ds-text-primary)' }}>
                    {result.passed
                      ? 'CHÚC MỪNG! BẠN ĐÃ VƯỢT TRẠM THÀNH CÔNG!'
                      : 'CHƯA ĐẠT CHUẨN VƯỢT TRẠM!'}
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--ds-text-secondary)' }}>
                    Độ chính xác: <strong style={{ color: result.passed ? 'var(--ds-success)' : 'var(--ds-danger)' }}>{result.accuracy}%</strong> ({result.correct}/{result.total} câu) • Tiêu chuẩn: ≥ {result.minAcc}%
                  </p>
                </div>

                {result.passed ? (
                  <div className="space-y-4 max-w-md mx-auto">
                    <p className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>
                      Trạm tiếp theo trong Lộ trình 7 Milestones đã được mở khóa tự động.
                    </p>
                    <a
                      href="/toeic"
                      className="inline-block px-6 py-3 rounded-xl font-bold text-sm shadow-sm hover:opacity-90 active:scale-95"
                      style={{ backgroundColor: 'var(--ds-success)', color: 'var(--ds-surface)' }}
                    >
                      Tiếp Tục Lộ Trình Vượt Trạm →
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-md mx-auto">
                    <p className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>
                      Hệ thống đã tự động tạo gói <strong>10 câu Twin Questions</strong> để bạn củng cố các câu làm sai trước khi thi lại Boss Gate!
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="px-5 py-2.5 rounded-xl font-bold text-xs border"
                        style={{ borderColor: 'var(--ds-border)', color: 'var(--ds-text-primary)' }}
                      >
                        Thi Lại Ngay
                      </button>

                      <a
                        href="/toeic/practice/GRM_POS_NOUN"
                        className="px-5 py-2.5 rounded-xl font-bold text-xs"
                        style={{ backgroundColor: 'var(--ds-primary)', color: 'var(--ds-surface)' }}
                      >
                        Luyện Gói Khắc Phục Lỗi →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TEST RUNNER */}
            {!isFinished && (
              <div className="space-y-6">
                {/* QUESTION PALETTE */}
                <div className="p-3 rounded-xl border flex flex-wrap gap-1.5"
                     style={{ backgroundColor: 'var(--ds-surface-secondary)', borderColor: 'var(--ds-border)' }}>
                  {questions.map((q, i) => {
                    const isAns = !!answers[q.id];
                    const isCurr = i === currentIndex;
                    return (
                      <button
                        key={q.id || i}
                        type="button"
                        onClick={() => setCurrentIndex(i)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                          isCurr ? 'ring-2 ring-[var(--ds-primary)]' : ''
                        }`}
                        style={{
                          backgroundColor: isAns ? 'var(--ds-primary)' : 'var(--ds-surface)',
                          color: isAns ? 'var(--ds-surface)' : 'var(--ds-text-primary)',
                          borderColor: 'var(--ds-border)'
                        }}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>

                {/* CURRENT QUESTION CARD */}
                {currentQ && (
                  <div className="rounded-2xl p-6 sm:p-8 border shadow-sm space-y-6"
                       style={{ backgroundColor: 'var(--ds-surface)', borderColor: 'var(--ds-border)' }}>
                    <div className="flex items-center justify-between pb-3 border-b"
                         style={{ borderColor: 'var(--ds-border)' }}>
                      <span className="text-xs font-bold px-2.5 py-1 rounded"
                            style={{ backgroundColor: 'var(--ds-surface-secondary)', color: 'var(--ds-text-primary)' }}>
                        Câu {currentIndex + 1} / {questions.length}
                      </span>
                      <span className="text-xs font-medium" style={{ color: 'var(--ds-text-muted)' }}>
                        {currentQ.ai_analysis?.primary_topic_name_vi || currentQ.primary_grammar_topic_id}
                      </span>
                    </div>

                    <div className="text-base sm:text-lg font-medium leading-relaxed" style={{ color: 'var(--ds-text-primary)' }}>
                      {currentQ.context_sentence || currentQ.stem}
                    </div>

                    {/* OPTIONS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(['A', 'B', 'C', 'D']).map(optKey => {
                        const optText = currentQ.options?.[optKey];
                        if (!optText) return null;
                        const isSelected = answers[currentQ.id] === optKey;

                        return (
                          <button
                            key={optKey}
                            type="button"
                            onClick={() => handleSelectOption(optKey)}
                            className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${
                              isSelected ? 'ring-2 ring-[var(--ds-primary)] shadow-sm' : 'hover:border-[var(--ds-primary)]'
                            }`}
                            style={{
                              backgroundColor: isSelected ? 'var(--ds-primary-subtle)' : 'var(--ds-surface)',
                              borderColor: isSelected ? 'var(--ds-primary)' : 'var(--ds-border)'
                            }}
                          >
                            <span className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs"
                                  style={{
                                    backgroundColor: isSelected ? 'var(--ds-primary)' : 'var(--ds-surface-secondary)',
                                    color: isSelected ? 'var(--ds-surface)' : 'var(--ds-text-primary)'
                                  }}>
                              {optKey}
                            </span>
                            <span className="text-sm font-medium" style={{ color: 'var(--ds-text-primary)' }}>
                              {optText}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* CONTROLS */}
                    <div className="flex items-center justify-between pt-4 border-t"
                         style={{ borderColor: 'var(--ds-border)' }}>
                      <button
                        type="button"
                        disabled={currentIndex === 0}
                        onClick={() => setCurrentIndex(prev => prev - 1)}
                        className="px-4 py-2 rounded-xl text-xs font-bold border disabled:opacity-40"
                        style={{ borderColor: 'var(--ds-border)', color: 'var(--ds-text-primary)' }}
                      >
                        ← Câu trước
                      </button>

                      {currentIndex < questions.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => setCurrentIndex(prev => prev + 1)}
                          className="px-5 py-2 rounded-xl text-xs font-bold"
                          style={{ backgroundColor: 'var(--ds-primary)', color: 'var(--ds-surface)' }}
                        >
                          Câu tiếp theo →
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleFinishTest}
                          className="px-6 py-2.5 rounded-xl text-xs font-bold shadow-sm"
                          style={{ backgroundColor: 'var(--ds-success)', color: 'var(--ds-surface)' }}
                        >
                          Nộp Bài Thi Boss Gate ✓
                        </button>
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
