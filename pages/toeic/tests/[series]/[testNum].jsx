import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AppShell2026 from '../../../../components/ui-2026/AppShell2026';
import SplitPassageReader from '../../../../components/toeic/SplitPassageReader';
import SentenceXRayCard from '../../../../components/toeic/SentenceXRayCard';
import { ToeicBadge } from '../../../../components/toeic/ui';

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

  useEffect(() => {
    if (!series || !testNum) return;
    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/toeic/tests/${series}/${testNum}?mode=${mode}`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data.success) {
          setTestData(data);
          if (data.questions?.length > 0) {
            setActiveQuestionId(data.questions[0].id);
          }
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
  }, [series, testNum, mode]);

  const questions = testData?.questions || [];
  const passages = testData?.passages || [];

  const part5Questions = useMemo(() => questions.filter(q => q.part === 5), [questions]);
  const part6Questions = useMemo(() => questions.filter(q => q.part === 6), [questions]);
  const part7Questions = useMemo(() => questions.filter(q => q.part === 7), [questions]);

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

  const answeredCount = Object.keys(userAnswers).length;

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

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ds-text-secondary)' }}>
                  Tiến độ: <strong style={{ color: 'var(--ds-accent)' }}>{answeredCount}</strong> / {questions.length} câu
                </span>

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
                  {isReviewMode ? '✓ Đang Xem Giải Thích & Dẫn Chứng' : 'Chế Độ Xem Giải Thích'}
                </button>
              </div>
            </div>

            {/* PART NAVIGATION SWITCHER (Fixed: Part 5 is always easily accessible!) */}
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

            {isLoading ? (
              <div style={{ minHeight: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', textAlign: 'center' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid var(--ds-accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ds-text-muted)' }}>
                  Đang tải nội dung đề {series} Test {testNum}...
                </p>
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
                      isReviewMode={isReviewMode}
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
                      isReviewMode={isReviewMode}
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
      </AppShell2026>
    </>
  );
}
