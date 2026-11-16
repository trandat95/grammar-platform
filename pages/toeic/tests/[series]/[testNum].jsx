import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AppShell2026 from '../../../../components/ui-2026/AppShell2026';
import SplitPassageReader from '../../../../components/toeic/SplitPassageReader';
import SentenceXRayCard from '../../../../components/toeic/SentenceXRayCard';
import { ToeicBadge, ToeicButton } from '../../../../components/toeic/ui';
import useGlobalAuth from '../../../../hooks/useGlobalAuth';
import useToeicEntitlement from '../../../../hooks/useToeicEntitlement';
import ToeicSmartPaywallModal from '../../../../components/toeic/premium/ToeicSmartPaywallModal';

export default function TestSimulationPage() {
  const router = useRouter();
  const { series = 'ETS2024', testNum = '1', mode = 'full' } = router.query;
  const [isLight, setIsLight] = useState(true);
  const [testData, setTestData] = useState(null);
  const [activePart, setActivePart] = useState(5); // 5 | 6 | 7 | 'all'
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isVipLocked, setIsVipLocked] = useState(false);

  // Mode Selection: null (choose mode) | 'practice' (instant feedback) | 'exam' (timed mock exam)
  const [examSessionMode, setExamSessionMode] = useState(null);
  const [examTimeLeftSec, setExamTimeLeftSec] = useState(75 * 60);
  const [examElapsedSec, setExamElapsedSec] = useState(0);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [showUnansweredDrawer, setShowUnansweredDrawer] = useState(false);
  const [showQuestionGrid, setShowQuestionGrid] = useState(true);
  const [gridFilter, setGridFilter] = useState('all'); // 'all' | 'unanswered' | 'wrong'
  const [questionTimings, setQuestionTimings] = useState({});
  const [serverDsResult, setServerDsResult] = useState(null);
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);

  const globalAuth = useGlobalAuth();
  const entitlement = useToeicEntitlement(globalAuth.currentUser?.id, globalAuth.currentUser?.role);
  const isVip = entitlement.isVip;

  useEffect(() => {
    if (!series || !testNum) return;
    let isMounted = true;
    setIsLoading(true);
    setIsVipLocked(false);

    const headers = {};
    if (globalAuth.activeAuthToken) {
      headers.Authorization = `Bearer ${globalAuth.activeAuthToken}`;
    }
    if (globalAuth.currentUser?.role) {
      headers['x-user-role'] = globalAuth.currentUser.role;
    }

    fetch(`/api/toeic/tests/${series}/${testNum}?mode=${mode}`, { headers })
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data.success) {
          setTestData(data);
          if (data.questions?.length > 0) {
            setActiveQuestionId(data.questions[0].id);
          }
        } else if (data.isVipRequired || data.error === 'VIP_UPGRADE_REQUIRED') {
          setIsVipLocked(true);
          setErrorMsg(data.message || 'Đề thi này thuộc gói VIP Premium.');
        } else {
          setErrorMsg(data.error || 'Không thể tải đề thi');
        }
      })
      .catch(() => {
        if (isMounted) setErrorMsg('Lỗi mạng khi tải đề thi');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [series, testNum, mode, globalAuth.activeAuthToken, globalAuth.currentUser?.role]);

  const questions = testData?.questions || [];
  const passages = testData?.passages || [];

  const part5Questions = useMemo(() => questions.filter(q => q.part === 5), [questions]);
  const part6Questions = useMemo(() => questions.filter(q => q.part === 6), [questions]);
  const part7Questions = useMemo(() => questions.filter(q => q.part === 7), [questions]);
  const readingQuestions = useMemo(
    () => [...part5Questions, ...part6Questions, ...part7Questions],
    [part5Questions, part6Questions, part7Questions]
  );

  // Countdown Timer & Per-Question Telemetry Timing for Mock Exam Mode (75 mins = 4500s)
  useEffect(() => {
    if (examSessionMode !== 'exam' || examSubmitted || isLoading || isVipLocked || errorMsg) return;
    const interval = setInterval(() => {
      setExamElapsedSec(prev => prev + 1);
      if (activeQuestionId) {
        setQuestionTimings(prev => ({ ...prev, [activeQuestionId]: (prev[activeQuestionId] || 0) + 1 }));
      }
      setExamTimeLeftSec(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [examSessionMode, examSubmitted, isLoading, isVipLocked, errorMsg, activeQuestionId]);

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (examSessionMode === 'exam' && examTimeLeftSec === 0 && !examSubmitted) {
      finalizeExamSubmission();
    }
  }, [examTimeLeftSec, examSessionMode, examSubmitted]);

  const formatTimer = (totalSec) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleStartMode = (selectedMode) => {
    setExamSessionMode(selectedMode);
    setUserAnswers({});
    setQuestionTimings({});
    setServerDsResult(null);
    setExamSubmitted(false);
    setIsReviewMode(false);
    setExamTimeLeftSec(75 * 60);
    setExamElapsedSec(0);
    setShowUnansweredDrawer(false);
    setActivePart(5);
    if (part5Questions[0]) setActiveQuestionId(part5Questions[0].id);
  };

  const finalizeExamSubmission = async () => {
    setExamSubmitted(true);
    setIsReviewMode(true);
    setShowUnansweredDrawer(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsSubmittingExam(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (globalAuth.activeAuthToken) {
        headers.Authorization = `Bearer ${globalAuth.activeAuthToken}`;
      }
      const res = await fetch('/api/toeic/exams/submit', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          series,
          testNum,
          sessionMode: examSessionMode || 'exam',
          elapsedSec: examElapsedSec,
          userAnswers,
          questionTimings,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setServerDsResult(data);
      }
    } catch (err) {
      console.warn('Exam DS submit notice:', err?.message || err);
    } finally {
      setIsSubmittingExam(false);
    }
  };

  const handleSubmitExam = () => {
    const unanswered = readingQuestions.filter(q => !userAnswers[q.id]).length;
    if (
      unanswered > 0 &&
      typeof window !== 'undefined' &&
      !window.confirm(`Bạn còn ${unanswered} câu chưa làm. Bạn có chắc chắn muốn nộp bài và chấm điểm ngay không?`)
    ) {
      return;
    }
    finalizeExamSubmission();
  };

  const unansweredQuestions = useMemo(
    () => readingQuestions.filter(q => !userAnswers[q.id]),
    [readingQuestions, userAnswers]
  );

  const jumpToQuestion = (q) => {
    if (!q) return;
    if (q.part === 5 || q.part === 6 || q.part === 7) {
      setActivePart(q.part);
    }
    setActiveQuestionId(q.id);
    setShowUnansweredDrawer(false);
  };

  const handleJumpNextUnanswered = () => {
    if (unansweredQuestions.length === 0) return;
    const curIdx = readingQuestions.findIndex(q => q.id === activeQuestionId);
    const afterCurrent = readingQuestions.slice(curIdx + 1).find(q => !userAnswers[q.id]);
    const target = afterCurrent || unansweredQuestions[0];
    jumpToQuestion(target);
  };

  const examSummary = useMemo(() => {
    if (!examSubmitted) return null;
    const scorePart = (list) => {
      let correct = 0;
      let answered = 0;
      for (const q of list) {
        const ans = userAnswers[q.id];
        if (ans) {
          answered += 1;
          if (ans === q.correct_answer) correct += 1;
        }
      }
      return { total: list.length, answered, correct };
    };
    const p5 = scorePart(part5Questions);
    const p6 = scorePart(part6Questions);
    const p7 = scorePart(part7Questions);
    const total = p5.total + p6.total + p7.total;
    const correct = p5.correct + p6.correct + p7.correct;
    const answered = p5.answered + p6.answered + p7.answered;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const estReadingScore = total > 0 ? Math.min(495, Math.max(5, Math.round(5 + (correct / total) * 490 / 5) * 5)) : 5;
    const skippedCount = total - answered;
    const wrongCount = answered - correct;

    // Aggregate real topic weaknesses & error traps from readingQuestions
    const topicStatsMap = new Map();
    const trapStatsMap = new Map();

    for (const q of readingQuestions) {
      const ans = userAnswers[q.id];
      const isRight = ans === q.correct_answer;
      const topicId = q.primary_grammar_topic_id || q.ai_analysis?.primary_topic_id || `PART_${q.part}`;
      const topicName = q.ai_analysis?.primary_topic_name_vi || `Chủ điểm Part ${q.part}`;

      if (!topicStatsMap.has(topicId)) {
        topicStatsMap.set(topicId, {
          topicId,
          topicName,
          part: q.part,
          total: 0,
          wrongOrSkipped: 0,
          wrongNumbers: [],
        });
      }
      const tStat = topicStatsMap.get(topicId);
      tStat.total += 1;
      if (!isRight) {
        tStat.wrongOrSkipped += 1;
        tStat.wrongNumbers.push(q.number);
      }

      if (ans && !isRight) {
        const optAna = q.ai_analysis?.option_deep_analysis?.[ans];
        const trapName = optAna?.error_pattern_name_vi || q.ai_analysis?.common_trap_warning_vi;
        if (trapName) {
          if (!trapStatsMap.has(trapName)) {
            trapStatsMap.set(trapName, { name: trapName, count: 0, numbers: [] });
          }
          const tr = trapStatsMap.get(trapName);
          tr.count += 1;
          tr.numbers.push(q.number);
        }
      }
    }

    const weakTopics = Array.from(topicStatsMap.values())
      .filter(t => t.wrongOrSkipped > 0)
      .sort((a, b) => b.wrongOrSkipped - a.wrongOrSkipped)
      .slice(0, 4)
      .map(t => ({
        ...t,
        estPointsLost: Math.max(5, Math.round((t.wrongOrSkipped / Math.max(1, total)) * 495 / 5) * 5),
      }));

    const errorTraps = Array.from(trapStatsMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const potentialScoreGain = Math.min(495 - estReadingScore, Math.max(15, (wrongCount + skippedCount) * 4));

    return {
      total,
      correct,
      answered,
      wrongCount,
      skippedCount,
      accuracy,
      estReadingScore,
      potentialScoreGain,
      weakTopics,
      errorTraps,
      p5,
      p6,
      p7,
    };
  }, [examSubmitted, userAnswers, part5Questions, part6Questions, part7Questions, readingQuestions]);

  // Current active Part 5 question
  const currentPart5Index = useMemo(() => {
    if (!part5Questions.length) return 0;
    const idx = part5Questions.findIndex(q => q.id === activeQuestionId);
    return idx !== -1 ? idx : 0;
  }, [part5Questions, activeQuestionId]);

  const activePart5Question = part5Questions[currentPart5Index] || part5Questions[0] || null;

  // Passages filtering for Part 6 & 7
  const part6Passages = useMemo(() => {
    const qNums = new Set(part6Questions.map(q => q.number));
    return passages.filter(p => p.part === 6 || (p.questions && p.questions.some(n => qNums.has(n))));
  }, [passages, part6Questions]);

  const part7Passages = useMemo(() => {
    const qNums = new Set(part7Questions.map(q => q.number));
    return passages.filter(p => p.part === 7 || (p.questions && p.questions.some(n => qNums.has(n))));
  }, [passages, part7Questions]);

  const handleSelectOption = (qId, optKey) => {
    setUserAnswers(prev => ({
      ...prev,
      [qId]: optKey
    }));
  };

  const answeredCount = readingQuestions.filter(q => Boolean(userAnswers[q.id])).length;

  return (
    <>
      <Head>
        <title>{series} Test {String(testNum).padStart(2, '0')} | Grammar Engine</title>
        <meta name="description" content="Thi thử và làm bài thi TOEIC trực tuyến chuẩn ETS." />
      </Head>

      <AppShell2026
        activeView="toeic"
        toeicSubView="tests"
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
        currentChapterTitle={`${series} Test ${testNum}`}
      >
        <div className="toeic-page-wrap">
          <div className="toeic-container">
            {/* TOP BAR */}
            <div className="toeic-flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <a
                href="/toeic/tests"
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
                <span>&larr; Danh sách 20 đề thi</span>
              </a>

              {examSessionMode && !isLoading && !isVipLocked && !errorMsg && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <ToeicBadge variant={examSessionMode === 'exam' ? 'warning' : 'primary'}>
                    {examSessionMode === 'exam' ? '⏱️ Chế Độ Thi Thử' : '🎯 Chế Độ Luyện Tập'}
                  </ToeicBadge>

                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ds-text-secondary)' }}>
                    Tiến độ: <strong style={{ color: 'var(--ds-accent)' }}>{answeredCount}</strong> / {readingQuestions.length} câu
                  </span>

                  {examSessionMode === 'exam' && (
                    <>
                      <span
                        style={{
                          padding: '0.35rem 0.7rem',
                          borderRadius: 'var(--ds-radius-md)',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          fontVariantNumeric: 'tabular-nums',
                          border: `1px solid ${examTimeLeftSec <= 300 ? 'var(--ds-danger)' : 'var(--ds-border)'}`,
                          backgroundColor: examTimeLeftSec <= 300 ? 'var(--ds-danger-bg)' : 'var(--ds-card)',
                          color: examTimeLeftSec <= 300 ? 'var(--ds-danger)' : 'var(--ds-text)'
                        }}
                      >
                        ⏱️ {formatTimer(examTimeLeftSec)}
                      </span>

                      {!examSubmitted && unansweredQuestions.length > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={handleJumpNextUnanswered}
                            className="toeic-btn toeic-btn-secondary"
                            style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', fontWeight: 700 }}
                            title="Chuyển nhanh tới câu chưa làm tiếp theo"
                          >
                            ⚡ Câu chưa làm ({unansweredQuestions.length})
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowQuestionGrid(prev => !prev)}
                            style={{
                              padding: '0.4rem 0.75rem',
                              borderRadius: 'var(--ds-radius-md)',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              border: '1px solid var(--ds-border)',
                              backgroundColor: showQuestionGrid ? 'var(--ds-accent-bg)' : 'var(--ds-card)',
                              color: showQuestionGrid ? 'var(--ds-accent)' : 'var(--ds-text)',
                              cursor: 'pointer'
                            }}
                          >
                            🔢 Bảng Câu Hỏi (101–200)
                          </button>
                        </>
                      )}

                      {!examSubmitted && (
                        <button
                          type="button"
                          onClick={handleSubmitExam}
                          className="toeic-btn toeic-btn-primary"
                          style={{ fontSize: '0.8rem', padding: '0.45rem 0.95rem', fontWeight: 800 }}
                        >
                          ✓ Nộp Bài &amp; Chấm Điểm
                        </button>
                      )}
                    </>
                  )}

                  {examSessionMode === 'practice' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowQuestionGrid(prev => !prev)}
                        style={{
                          padding: '0.4rem 0.75rem',
                          borderRadius: 'var(--ds-radius-md)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          border: '1px solid var(--ds-border)',
                          backgroundColor: showQuestionGrid ? 'var(--ds-accent-bg)' : 'var(--ds-card)',
                          color: showQuestionGrid ? 'var(--ds-accent)' : 'var(--ds-text)',
                          cursor: 'pointer'
                        }}
                      >
                        🔢 Bảng Câu Hỏi (101–200)
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsReviewMode(prev => !prev)}
                        style={{
                          padding: '0.45rem 0.9rem',
                          borderRadius: 'var(--ds-radius-md)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          border: '1px solid var(--ds-border)',
                          backgroundColor: isReviewMode ? 'var(--ds-warning-bg)' : 'var(--ds-card)',
                          color: isReviewMode ? 'var(--ds-warning)' : 'var(--ds-text)',
                          cursor: 'pointer'
                        }}
                      >
                        {isReviewMode ? '✓ Hiện Toàn Bộ Đáp Án' : 'Xem Đáp Án Tất Cả'}
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (answeredCount > 0 && !examSubmitted && typeof window !== 'undefined') {
                        if (!window.confirm('Đổi chế độ sẽ làm mới tiến độ hiện tại. Bạn có chắc không?')) return;
                      }
                      setExamSessionMode(null);
                      setUserAnswers({});
                      setExamSubmitted(false);
                      setIsReviewMode(false);
                    }}
                    style={{
                      padding: '0.4rem 0.7rem',
                      borderRadius: 'var(--ds-radius-md)',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      border: '1px solid var(--ds-border)',
                      backgroundColor: 'transparent',
                      color: 'var(--ds-text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    Đổi chế độ
                  </button>
                </div>
              )}
            </div>

            {/* UNIFIED FULL QUESTION NAVIGATOR GRID (101 - 200) */}
            {examSessionMode && showQuestionGrid && !isLoading && !isVipLocked && !errorMsg && readingQuestions.length > 0 && (
              <div
                className="toeic-card"
                style={{
                  padding: '0.9rem 1rem',
                  marginBottom: '1rem',
                  border: '1px solid var(--ds-border)',
                  backgroundColor: 'var(--ds-card)'
                }}
              >
                <div className="toeic-flex-between" style={{ flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--ds-text)' }}>
                      🔢 Bảng Theo Dõi Toàn Đề (101–200)
                    </span>
                    <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', fontSize: '0.72rem', color: 'var(--ds-text-muted)' }}>
                      <span>🟦 Đã làm ({answeredCount})</span>
                      <span>⬜ Chưa làm ({unansweredQuestions.length})</span>
                      <span>🔷 Đang làm</span>
                      {(examSubmitted || examSessionMode === 'practice') && (
                        <>
                          <span style={{ color: 'var(--ds-success)', fontWeight: 700 }}>🟩 Đúng</span>
                          <span style={{ color: 'var(--ds-danger)', fontWeight: 700 }}>🟥 Sai</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {[
                      { id: 'all', label: `Tất cả (${readingQuestions.length})` },
                      { id: 'unanswered', label: `Chưa làm (${unansweredQuestions.length})` },
                      ...(examSubmitted && examSummary ? [{ id: 'wrong', label: `Câu sai (${examSummary.wrongCount})` }] : []),
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setGridFilter(f.id)}
                        className={`toeic-target-chip ${gridFilter === f.id ? 'active' : ''}`}
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {[
                    { label: 'Part 5 (101–130)', list: part5Questions },
                    { label: 'Part 6 (131–146)', list: part6Questions },
                    { label: 'Part 7 (147–200)', list: part7Questions },
                  ].map(group => {
                    const filtered = group.list.filter(q => {
                      const ans = userAnswers[q.id];
                      if (gridFilter === 'unanswered') return !ans;
                      if (gridFilter === 'wrong') return Boolean(ans) && ans !== q.correct_answer;
                      return true;
                    });
                    if (filtered.length === 0) return null;

                    return (
                      <div key={group.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--ds-text-muted)', minWidth: '102px', paddingTop: '0.25rem' }}>
                          {group.label}:
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.28rem', flex: 1 }}>
                          {filtered.map(q => {
                            const ans = userAnswers[q.id];
                            const isCur = q.id === activeQuestionId;
                            const showGrade = examSubmitted || (examSessionMode === 'practice' && Boolean(ans));
                            const isRight = ans && ans === q.correct_answer;

                            let bg = 'var(--ds-bg-elevated)';
                            let color = 'var(--ds-text-secondary)';
                            let border = '1px solid var(--ds-border)';

                            if (showGrade && ans) {
                              bg = isRight ? 'var(--ds-success-bg)' : 'var(--ds-danger-bg)';
                              color = isRight ? 'var(--ds-success)' : 'var(--ds-danger)';
                              border = `1px solid ${isRight ? 'var(--ds-success)' : 'var(--ds-danger)'}`;
                            } else if (ans) {
                              bg = 'var(--ds-accent-bg)';
                              color = 'var(--ds-accent)';
                              border = '1px solid var(--ds-accent)';
                            }

                            if (isCur) {
                              border = '2px solid var(--ds-accent)';
                            }

                            return (
                              <button
                                key={q.id}
                                type="button"
                                onClick={() => jumpToQuestion(q)}
                                title={`Câu ${q.number}${ans ? ` • Đã chọn: ${ans}` : ' • Chưa làm'}`}
                                style={{
                                  minWidth: '34px',
                                  height: '26px',
                                  padding: '0 0.25rem',
                                  borderRadius: 'var(--ds-radius-sm)',
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  backgroundColor: bg,
                                  color,
                                  border,
                                  cursor: 'pointer',
                                  boxShadow: isCur ? '0 0 0 2px rgba(37,99,235,0.2)' : 'none'
                                }}
                              >
                                {q.number}{ans ? `·${ans}` : ''}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* EXAM SCORE SUMMARY & AI CONVERSION FUNNEL (AFTER SUBMISSION) */}
            {examSessionMode === 'exam' && examSubmitted && examSummary && (
              <div
                className="toeic-card"
                style={{
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  border: '1.5px solid var(--ds-accent)',
                  backgroundColor: 'var(--ds-card)'
                }}
              >
                {/* 1. BASIC SCORING (FREE & VIP) */}
                <div className="toeic-flex-between" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <ToeicBadge variant="success">✓ Đã Nộp Bài • Bảng Chấm Điểm &amp; Phân Tích</ToeicBadge>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.5rem 0 0.25rem 0', color: 'var(--ds-text)' }}>
                      Kết Quả Thi Thử {series} Test {String(testNum).padStart(2, '0')}
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--ds-text-secondary)' }}>
                      Thời gian: <strong>{formatTimer(examElapsedSec)}</strong> • Đúng <strong>{examSummary.correct}</strong> • Sai <strong>{examSummary.wrongCount}</strong> • Bỏ trống <strong>{examSummary.skippedCount}</strong>
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center', padding: '0.75rem 1.25rem', borderRadius: 'var(--ds-radius-md)', backgroundColor: 'var(--ds-accent-bg)', border: '1px solid var(--ds-accent)' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ds-accent)', textTransform: 'uppercase' }}>Điểm Reading Ước Tính</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--ds-accent)' }}>{examSummary.estReadingScore}/495</div>
                    </div>

                    <div style={{ textAlign: 'center', padding: '0.75rem 1.25rem', borderRadius: 'var(--ds-radius-md)', backgroundColor: 'var(--ds-success-bg)', border: '1px solid var(--ds-success)' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ds-success)', textTransform: 'uppercase' }}>Độ Chính Xác</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--ds-success)' }}>{examSummary.correct}/{examSummary.total} ({examSummary.accuracy}%)</div>
                    </div>
                  </div>
                </div>

                {/* Part Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  {[
                    { label: 'Part 5 (Điền câu)', stat: examSummary.p5, part: 5 },
                    { label: 'Part 6 (Điền đoạn văn)', stat: examSummary.p6, part: 6 },
                    { label: 'Part 7 (Đọc hiểu)', stat: examSummary.p7, part: 7 },
                  ].map(item => (
                    <button
                      key={item.part}
                      type="button"
                      onClick={() => setActivePart(item.part)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--ds-radius-md)',
                        border: '1px solid var(--ds-border)',
                        backgroundColor: 'var(--ds-bg-elevated)',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--ds-text-muted)' }}>{item.label}</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ds-text)', marginTop: '0.2rem' }}>
                        {item.stat.correct} / {item.stat.total} đúng
                      </div>
                    </button>
                  ))}
                </div>

                {/* 2. AI WEAKNESS DIAGNOSIS & PERSONALIZED REMEDIATION ROADMAP (TEASER FOR FREE, FULL FOR VIP) */}
                {examSummary.weakTopics.length > 0 && (
                  <div
                    style={{
                      padding: '1.15rem',
                      borderRadius: 'var(--ds-radius-md)',
                      border: '1px solid var(--ds-warning)',
                      backgroundColor: 'var(--ds-bg-elevated)',
                      marginBottom: '1.25rem'
                    }}
                  >
                    <div className="toeic-flex-between" style={{ flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
                      <div>
                        <ToeicBadge variant="warning">🤖 Chẩn Đoán Điểm Yếu AI &amp; Lộ Trình Nâng Điểm</ToeicBadge>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0.4rem 0 0 0', color: 'var(--ds-text)' }}>
                          Phát hiện {examSummary.weakTopics.length} lỗ hổng kiến thức chính — Khắc phục ngay có thể tăng thêm +{examSummary.potentialScoreGain} điểm!
                        </h3>
                      </div>
                      {!isVip && (
                        <button
                          type="button"
                          onClick={() => entitlement.openPaywall('TRG_04_FULL_MOCK_TEST', { testNumber: testNum, series })}
                          className="toeic-btn toeic-btn-primary"
                          style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', fontWeight: 800 }}
                        >
                          🔓 Mở Khóa AI Lộ Trình VIP
                        </button>
                      )}
                    </div>

                    {/* Topic #1 Free Preview */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {examSummary.weakTopics.slice(0, isVip ? 4 : 1).map((wt, idx) => (
                        <div
                          key={wt.topicId}
                          style={{
                            padding: '0.75rem 0.9rem',
                            borderRadius: 'var(--ds-radius-sm)',
                            backgroundColor: 'var(--ds-card)',
                            border: '1px solid var(--ds-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.6rem'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--ds-text)' }}>
                              {idx + 1}. {wt.topicName} <span style={{ color: 'var(--ds-danger)' }}>(Sai/Bỏ {wt.wrongOrSkipped}/{wt.total} câu • Mất ~{wt.estPointsLost}đ)</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)', marginTop: '0.15rem' }}>
                              Các câu cần ôn: {wt.wrongNumbers.slice(0, 6).map(n => `#${n}`).join(', ')}{wt.wrongNumbers.length > 6 ? '...' : ''}
                            </div>
                          </div>
                          {isVip ? (
                            <a
                              href={`/toeic/practice/${wt.topicId}`}
                              className="toeic-btn toeic-btn-primary"
                              style={{ fontSize: '0.76rem', padding: '0.38rem 0.8rem', fontWeight: 700, textDecoration: 'none' }}
                            >
                              ⚡ Luyện vá lỗ hổng này &rarr;
                            </a>
                          ) : (
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--ds-success)' }}>
                              ✓ Xem trước miễn phí
                            </span>
                          )}
                        </div>
                      ))}

                      {/* VIP-only items: blurred/locked teaser for Free users, full process for VIP */}
                      {!isVip ? (
                        <div
                          style={{
                            padding: '1rem',
                            borderRadius: 'var(--ds-radius-sm)',
                            border: '1px dashed var(--ds-warning)',
                            backgroundColor: 'var(--ds-card)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.55rem'
                          }}
                        >
                          <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--ds-text)' }}>
                            🔒 Còn {Math.max(0, examSummary.weakTopics.length - 1)} chủ điểm yếu khác &amp; Bẫy lỗi sai lặp lại đang bị ẩn:
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--ds-text-secondary)', lineHeight: 1.5 }}>
                            • <strong>Chẩn đoán bẫy nhận thức (Error Trap DNA)</strong>: chỉ rõ bạn hay sập bẫy từ loại, bẫy ngữ nghĩa hay bẫy lặp từ.<br />
                            • <strong>Lộ trình 3 bước nâng cấp điểm sai qua từng đề</strong>: tự động tạo bài luyện tập đúng vào các câu sai + Câu Sinh Đôi (Twin Questions) giúp tăng <strong>+{examSummary.potentialScoreGain} điểm</strong> ở đề tiếp theo.<br />
                            • <strong>Giải thích AI chi tiết từng phương án A/B/C/D</strong> cho toàn bộ 100 câu trong đề.
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => entitlement.openPaywall('TRG_04_FULL_MOCK_TEST', { testNumber: testNum, series })}
                              className="toeic-btn toeic-btn-primary"
                              style={{ fontSize: '0.82rem', padding: '0.55rem 1.15rem', fontWeight: 800 }}
                            >
                              ✨ Mở Khóa VIP Để Xem Lộ Trình Tăng +{examSummary.potentialScoreGain} Điểm
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: '0.9rem 1rem',
                            borderRadius: 'var(--ds-radius-sm)',
                            backgroundColor: 'var(--ds-card)',
                            border: '1px solid var(--ds-accent)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.45rem'
                          }}
                        >
                          <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--ds-accent)' }}>
                            🗺️ Quy Trình Nâng Cấp Điểm Sai Cá Nhân Hóa (VIP Process):
                          </div>
                          {examSummary.errorTraps.length > 0 && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--ds-text-secondary)' }}>
                              <strong>Bẫy hay mắc nhất:</strong> {examSummary.errorTraps.map(tr => `${tr.name} (${tr.count} lần)`).join(' • ')}
                            </div>
                          )}
                          <div style={{ fontSize: '0.78rem', color: 'var(--ds-text-secondary)', lineHeight: 1.5 }}>
                            <strong>Bước 1:</strong> Bấm vào nút &ldquo;Luyện vá lỗ hổng&rdquo; ở trên để xử lý triệt để {examSummary.weakTopics.length} chủ điểm yếu.<br />
                            <strong>Bước 2:</strong> Bấm lọc <strong>&ldquo;Câu sai ({examSummary.wrongCount})&rdquo;</strong> trên Bảng Câu Hỏi để xem giải thích AI + làm Câu Sinh Đôi.<br />
                            <strong>Bước 3:</strong> Chuyển sang đề tiếp theo để kiểm chứng mục tiêu tăng <strong>+{examSummary.potentialScoreGain} điểm</strong>!
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. DATA SCIENCE TELEMETRY: IRT THETA, FATIGUE DROP & REMEDIATION PLAN LINK */}
                {serverDsResult?.analysis && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem', padding: '0.85rem 1rem', borderRadius: 'var(--ds-radius-md)', backgroundColor: 'var(--ds-bg-elevated)', border: '1px solid var(--ds-border)' }}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.8rem', color: 'var(--ds-text-secondary)' }}>
                      <span>📐 <strong>IRT 3PL Ability (θ):</strong> {serverDsResult.analysis.thetaEstimate}</span>
                      <span>⚡ <strong>Suy giảm thể lực Part 7:</strong> {serverDsResult.analysis.fatigue?.fatigueDropRate || 0}%</span>
                      {typeof serverDsResult.verifiedDelta === 'number' && (
                        <span style={{ color: serverDsResult.verifiedDelta >= 0 ? 'var(--ds-success)' : 'var(--ds-danger)', fontWeight: 800 }}>
                          📈 Chênh lệch từ Lộ trình trước: {serverDsResult.verifiedDelta >= 0 ? `+${serverDsResult.verifiedDelta}` : serverDsResult.verifiedDelta} điểm
                        </span>
                      )}
                    </div>
                    {serverDsResult.analysis.fatigue?.hasFatigueWarning && serverDsResult.analysis.fatigue?.coachingTip && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--ds-warning)', fontWeight: 600 }}>
                        ⚠️ {serverDsResult.analysis.fatigue.coachingTip}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {serverDsResult?.remediationPlanId && (
                    <a
                      href={`/toeic/remediation/${serverDsResult.remediationPlanId}`}
                      className="toeic-btn toeic-btn-primary"
                      style={{ fontSize: '0.82rem', fontWeight: 800, textDecoration: 'none' }}
                    >
                      🚀 Bắt Đầu Lộ Trình Vá Lỗ Hổng ({(serverDsResult.analysis?.prescribedDrillQuestionIds?.length || 0) + (serverDsResult.analysis?.prescribedTwinQuestionIds?.length || 0)} câu đặc trị) &rarr;
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleStartMode('exam')}
                    className="toeic-btn toeic-btn-secondary"
                    style={{ fontSize: '0.82rem', fontWeight: 700 }}
                  >
                    ↻ Làm Lại Bài Thi Thử
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartMode('practice')}
                    className="toeic-btn toeic-btn-secondary"
                    style={{ fontSize: '0.82rem', fontWeight: 700 }}
                  >
                    🎯 Chuyển Sang Luyện Tập Tự Do
                  </button>
                </div>
              </div>
            )}

            {/* PART NAVIGATION SWITCHER */}
            {examSessionMode && !isLoading && !isVipLocked && !errorMsg && (
              <div
                className="toeic-card"
                style={{
                  padding: '0.75rem 1rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  backgroundColor: 'var(--ds-bg-elevated)',
                  border: '1px solid var(--ds-border)'
                }}
              >
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--ds-text-secondary)', marginRight: '0.25rem' }}>
                Chọn Phần Thi:
              </span>

              <button
                type="button"
                onClick={() => {
                  setActivePart(5);
                  if (part5Questions[0]) setActiveQuestionId(part5Questions[0].id);
                }}
                className={`toeic-target-chip ${activePart === 5 ? 'active' : ''}`}
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
              >
                📝 Part 5: Điền Câu ({part5Questions.length} câu)
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivePart(6);
                  if (part6Questions[0]) setActiveQuestionId(part6Questions[0].id);
                }}
                className={`toeic-target-chip ${activePart === 6 ? 'active' : ''}`}
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
              >
                📄 Part 6: Điền Đoạn Văn ({part6Questions.length} câu)
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivePart(7);
                  if (part7Questions[0]) setActiveQuestionId(part7Questions[0].id);
                }}
                className={`toeic-target-chip ${activePart === 7 ? 'active' : ''}`}
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
              >
                📖 Part 7: Đọc Hiểu ({part7Questions.length} câu)
              </button>

              <button
                type="button"
                onClick={() => setActivePart('all')}
                className={`toeic-target-chip ${activePart === 'all' ? 'active' : ''}`}
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem', marginLeft: 'auto' }}
              >
                📋 Xem Toàn Đề
              </button>
              </div>
            )}

            {isLoading ? (
              <div style={{ minHeight: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', textAlign: 'center' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid var(--ds-accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ds-text-muted)' }}>
                  Đang tải nội dung đề {series} Test {testNum}...
                </p>
              </div>
            ) : isVipLocked ? (
              <div
                className="toeic-card"
                style={{
                  textAlign: 'center',
                  padding: '3rem 1.5rem',
                  maxWidth: '680px',
                  margin: '2rem auto',
                  border: '1px dashed var(--ds-warning)',
                  backgroundColor: 'var(--ds-bg-elevated)',
                  borderRadius: 'var(--ds-radius-lg)'
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--ds-warning-bg, rgba(234, 179, 8, 0.12))',
                    color: 'var(--ds-warning)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.25rem auto'
                  }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>

                <div style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
                  <ToeicBadge variant="warning">🔒 Phân Hệ VIP Premium</ToeicBadge>
                </div>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.75rem 0', color: 'var(--ds-text)' }}>
                  Mở Khóa Đề Thi {series} Test {String(testNum).padStart(2, '0')}
                </h2>

                <p style={{ fontSize: '0.9rem', color: 'var(--ds-text-secondary)', lineHeight: 1.6, maxWidth: '520px', margin: '0 auto 1.5rem auto' }}>
                  Toàn bộ 20 đề thi chuẩn hóa ETS 2024 &amp; ETS 2026 kèm tính năng tra cứu dẫn chứng tự động <strong>Auto-Highlight</strong> và bóc tách quang phổ <strong>Sentence X-Ray</strong> thuộc gói VIP.
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <ToeicButton
                    variant="primary"
                    onClick={() => entitlement.openPaywall('TRG_04_FULL_MOCK_TEST', { testNumber: testNum, series })}
                    style={{ padding: '0.75rem 1.75rem', fontWeight: 800 }}
                  >
                    Nâng Cấp Gói VIP Ngay ✨
                  </ToeicButton>

                  <a
                    href="/toeic/tests"
                    className="toeic-btn toeic-btn-secondary"
                    style={{ padding: '0.75rem 1.25rem', fontWeight: 700 }}
                  >
                    &larr; Về Đề Thi Miễn Phí (Test 01 &amp; 02)
                  </a>
                </div>
              </div>
            ) : errorMsg ? (
              <div className="toeic-card" style={{ textAlign: 'center', padding: '2rem', border: '1px solid var(--ds-danger-border)', backgroundColor: 'var(--ds-danger-bg)' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--ds-danger)', marginBottom: '1rem' }}>{errorMsg}</p>
                <a
                  href="/toeic/tests"
                  className="toeic-btn toeic-btn-primary"
                >
                  Quay Lại
                </a>
              </div>
            ) : !examSessionMode ? (
              <div style={{ maxWidth: '820px', margin: '1.5rem auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="toeic-card" style={{ padding: '1.75rem', textAlign: 'center' }}>
                  <ToeicBadge variant="primary">ETS Standard • {series} Test {String(testNum).padStart(2, '0')}</ToeicBadge>
                  <h1 style={{ fontSize: '1.55rem', fontWeight: 900, margin: '0.65rem 0 0.4rem 0', color: 'var(--ds-text)' }}>
                    Chọn Chế Độ Làm Bài Thi TOEIC Reading ({readingQuestions.length} câu)
                  </h1>
                  <p style={{ fontSize: '0.88rem', color: 'var(--ds-text-secondary)', margin: 0 }}>
                    Part 5 ({part5Questions.length} câu) • Part 6 ({part6Questions.length} câu) • Part 7 ({part7Questions.length} câu)
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.15rem' }}>
                  {/* OPTION 1: PRACTICE MODE */}
                  <div
                    className="toeic-card"
                    style={{
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      border: '1.5px solid var(--ds-accent)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🎯</div>
                      <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--ds-text)' }}>
                        1. Chế Độ Luyện Tập (Practice)
                      </h2>
                      <p style={{ fontSize: '0.84rem', color: 'var(--ds-text-secondary)', lineHeight: 1.55, margin: 0 }}>
                        Không giới hạn thời gian. Ngay khi chọn đáp án ở Part 5, 6, 7 sẽ <strong>hiển thị Đúng / Sai, Giải thích chi tiết &amp; Dẫn chứng tức thì</strong> để học sâu từng câu.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleStartMode('practice')}
                      className="toeic-btn toeic-btn-primary"
                      style={{ width: '100%', padding: '0.7rem 1rem', fontWeight: 800 }}
                    >
                      Bắt Đầu Luyện Tập Ngay &rarr;
                    </button>
                  </div>

                  {/* OPTION 2: MOCK EXAM MODE */}
                  <div
                    className="toeic-card"
                    style={{
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      border: '1.5px solid var(--ds-warning)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>⏱️</div>
                      <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--ds-text)' }}>
                        2. Chế Độ Thi Thử (Real Exam)
                      </h2>
                      <p style={{ fontSize: '0.84rem', color: 'var(--ds-text-secondary)', lineHeight: 1.55, margin: 0 }}>
                        Đồng hồ đếm ngược <strong>75 phút</strong> chuẩn phòng thi, ẩn đáp án khi đang làm, có <strong>chọn nhanh các câu chưa làm</strong>, tự do đổi đáp án và <strong>Nộp bài chấm điểm tổng kết</strong>.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleStartMode('exam')}
                      className="toeic-btn"
                      style={{
                        width: '100%',
                        padding: '0.7rem 1rem',
                        fontWeight: 800,
                        backgroundColor: 'var(--ds-warning)',
                        color: '#ffffff',
                        border: 'none'
                      }}
                    >
                      Bắt Đầu Thi Thử (75 Phút) &rarr;
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* 1. PART 5 SECTION */}
                {(activePart === 5 || activePart === 'all') && part5Questions.length > 0 && (
                  <div>
                    <div className="toeic-flex-between" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--ds-border)', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ToeicBadge variant="primary">Part 5</ToeicBadge>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--ds-text)' }}>
                          Incomplete Sentences (Câu 101 – 130)
                        </h2>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)', fontWeight: 600 }}>
                        {part5Questions.filter(q => userAnswers[q.id]).length} / {part5Questions.length} câu đã chọn
                      </span>
                    </div>

                    {/* Part 5 Question Palette */}
                    <div
                      className="toeic-card"
                      style={{
                        padding: '0.75rem 1rem',
                        marginBottom: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        flexWrap: 'wrap'
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-text-muted)', marginRight: '0.25rem' }}>
                        Câu:
                      </span>
                      {part5Questions.map((q, i) => {
                        const isAns = !!userAnswers[q.id];
                        const isCur = i === currentPart5Index;

                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => setActiveQuestionId(q.id)}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: 'var(--ds-radius-sm)',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              border: isCur ? '2px solid var(--ds-accent)' : '1px solid var(--ds-border)',
                              backgroundColor: isCur
                                ? 'var(--ds-accent-bg)'
                                : isAns
                                ? 'var(--ds-success-bg)'
                                : 'var(--ds-card)',
                              color: isCur
                                ? 'var(--ds-accent)'
                                : isAns
                                ? 'var(--ds-success)'
                                : 'var(--ds-text)',
                              cursor: 'pointer'
                            }}
                          >
                            {q.number || 101 + i}
                          </button>
                        );
                      })}
                    </div>

                    {/* Part 5 Question Workspace */}
                    {activePart5Question && (
                      <div>
                        <SentenceXRayCard
                          key={activePart5Question.id}
                          question={activePart5Question}
                          examMode={examSessionMode || 'practice'}
                          initialSelectedOption={userAnswers[activePart5Question.id] || null}
                          forceReview={isReviewMode || examSubmitted}
                          onAnswerSubmit={({ selectedOption }) => {
                            handleSelectOption(activePart5Question.id, selectedOption);
                          }}
                          onNextQuestion={() => {
                            if (currentPart5Index < part5Questions.length - 1) {
                              setActiveQuestionId(part5Questions[currentPart5Index + 1].id);
                            } else {
                              setActivePart(6);
                              if (part6Questions[0]) setActiveQuestionId(part6Questions[0].id);
                            }
                          }}
                        />

                        {/* Part 5 Stepper Controls */}
                        <div className="toeic-flex-between" style={{ marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: 'var(--ds-radius-md)', backgroundColor: 'var(--ds-card)', border: '1px solid var(--ds-border)' }}>
                          <button
                            type="button"
                            disabled={currentPart5Index === 0}
                            onClick={() => setActiveQuestionId(part5Questions[currentPart5Index - 1].id)}
                            className="toeic-btn toeic-btn-secondary"
                            style={{ opacity: currentPart5Index === 0 ? 0.4 : 1, cursor: currentPart5Index === 0 ? 'default' : 'pointer' }}
                          >
                            &larr; Câu trước ({part5Questions[currentPart5Index - 1]?.number || 101})
                          </button>

                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--ds-text)' }}>
                            Câu #{activePart5Question.number} ({currentPart5Index + 1}/{part5Questions.length})
                          </span>

                          {currentPart5Index < part5Questions.length - 1 ? (
                            <button
                              type="button"
                              onClick={() => setActiveQuestionId(part5Questions[currentPart5Index + 1].id)}
                              className="toeic-btn toeic-btn-primary"
                            >
                              <span>Câu tiếp theo ({part5Questions[currentPart5Index + 1]?.number}) &rarr;</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setActivePart(6);
                                if (part6Questions[0]) setActiveQuestionId(part6Questions[0].id);
                              }}
                              className="toeic-btn toeic-btn-success"
                            >
                              <span>Xong Part 5 ➔ Sang Part 6 &rarr;</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. PART 6 SECTION */}
                {(activePart === 6 || activePart === 'all') && part6Questions.length > 0 && (
                  <div>
                    <div className="toeic-flex-between" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--ds-border)', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ToeicBadge variant="primary">Part 6</ToeicBadge>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--ds-text)' }}>
                          Text Completion (Câu 131 – 146)
                        </h2>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)' }}>
                        Split-Screen Reader Mode • 4 Đoạn Văn
                      </span>
                    </div>

                    <SplitPassageReader
                      passages={part6Passages}
                      questions={part6Questions}
                      activeQuestionId={activeQuestionId}
                      examMode={examSessionMode || 'practice'}
                      isReviewMode={isReviewMode || examSubmitted}
                      isVip={isVip}
                      crowdStats={serverDsResult?.crowdStats || null}
                      onRequireVip={() => entitlement.openPaywall('TRG_04_FULL_MOCK_TEST', { testNumber: testNum, series })}
                      userAnswers={userAnswers}
                      onSelectOption={handleSelectOption}
                      onQuestionClick={(qId) => setActiveQuestionId(qId)}
                    />
                  </div>
                )}

                {/* 3. PART 7 SECTION */}
                {(activePart === 7 || activePart === 'all') && part7Questions.length > 0 && (
                  <div>
                    <div className="toeic-flex-between" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--ds-border)', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ToeicBadge variant="warning">Part 7</ToeicBadge>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--ds-text)' }}>
                          Reading Comprehension (Câu 147 – 200)
                        </h2>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)' }}>
                        Single, Double &amp; Triple Passages (54 câu)
                      </span>
                    </div>

                    <SplitPassageReader
                      passages={part7Passages}
                      questions={part7Questions}
                      activeQuestionId={activeQuestionId}
                      examMode={examSessionMode || 'practice'}
                      isReviewMode={isReviewMode || examSubmitted}
                      isVip={isVip}
                      crowdStats={serverDsResult?.crowdStats || null}
                      onRequireVip={() => entitlement.openPaywall('TRG_04_FULL_MOCK_TEST', { testNumber: testNum, series })}
                      userAnswers={userAnswers}
                      onSelectOption={handleSelectOption}
                      onQuestionClick={(qId) => setActiveQuestionId(qId)}
                    />
                  </div>
                )}

              </div>
            )}
          </div>
        </div>

        {/* TOEIC Smart Paywall Modal */}
        <ToeicSmartPaywallModal
          isOpen={entitlement.paywallState.isOpen}
          onClose={entitlement.closePaywall}
          triggerId={entitlement.paywallState.triggerId}
          context={entitlement.paywallState.context}
        />
      </AppShell2026>
    </>
  );
}
