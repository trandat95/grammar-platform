import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AppShell2026 from '../../../../components/ui-2026/AppShell2026';
import SplitPassageReader from '../../../../components/toeic/SplitPassageReader';
import SentenceXRayCard from '../../../../components/toeic/SentenceXRayCard';

export default function TestSimulationPage() {
  const router = useRouter();
  const { series = 'ETS2024', testNum = '1', mode = 'full' } = router.query;
  const [isLight, setIsLight] = useState(true);
  const [testData, setTestData] = useState(null);
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
  const passageGroups = testData?.passageGroups || {};

  const part5Questions = questions.filter(q => q.part === 5);
  const readingComprehensionQuestions = questions.filter(q => q.part === 6 || q.part === 7);

  const activeQuestion = questions.find(q => q.id === activeQuestionId) || questions[0] || null;

  // Find passage group matching the active question
  const currentPassages = React.useMemo(() => {
    if (!activeQuestion) return passages.slice(0, 2);
    const pGroup = activeQuestion.passage_group_id || activeQuestion.passage_id;
    if (pGroup && passageGroups[pGroup]) {
      return passageGroups[pGroup];
    }
    // Fallback: search passages that list this question number
    const matched = passages.filter(p => p.questions?.includes(activeQuestion.number));
    return matched.length > 0 ? matched : passages.slice(0, 1);
  }, [activeQuestion, passageGroups, passages]);

  const handleSelectOption = (qId, optKey) => {
    setUserAnswers(prev => ({
      ...prev,
      [qId]: optKey
    }));
  };

  return (
    <>
      <Head>
        <title>{series} Test {String(testNum).padStart(2, '0')} ({mode.toUpperCase()}) | Grammar Engine</title>
        <meta name="description" content="Thi thử và làm bài thi TOEIC trực tuyến chuẩn ETS." />
      </Head>

      <AppShell2026
        activeView="quiz"
        onSelectView={(v) => {
          if (v === 'dashboard') window.location.href = '/';
          else if (v === 'study') window.location.href = '/';
          else if (v === 'vip') window.location.href = '/';
          else if (v === 'gamification') window.location.href = '/';
        }}
        isLight={isLight}
        onToggleTheme={() => setIsLight(prev => !prev)}
        currentChapterTitle={`${series} Test ${testNum}`}
      >
        <main className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-6" style={{ backgroundColor: 'var(--ds-background)' }}>
          <div className="max-w-6xl mx-auto space-y-6">
            {/* TOP BAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <a
                href="/toeic/tests"
                className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
                style={{ color: 'var(--ds-primary)' }}
              >
                <span>← Danh sách 20 đề thi</span>
              </a>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsReviewMode(prev => !prev)}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold border transition-all"
                  style={{
                    backgroundColor: isReviewMode ? 'var(--ds-warning-subtle)' : 'var(--ds-surface)',
                    borderColor: isReviewMode ? 'var(--ds-warning)' : 'var(--ds-border)',
                    color: isReviewMode ? 'var(--ds-warning)' : 'var(--ds-text-primary)'
                  }}
                >
                  {isReviewMode ? '✓ Đang Xem Giải Thích & Dẫn Chứng' : 'Chế Độ Xem Giải Thích'}
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
                     style={{ borderColor: 'var(--ds-primary)', borderTopColor: 'transparent' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--ds-text-muted)' }}>
                  Đang tải nội dung đề {series} Test {testNum}...
                </p>
              </div>
            ) : errorMsg ? (
              <div className="rounded-2xl p-6 border text-center space-y-3"
                   style={{ backgroundColor: 'var(--ds-danger-subtle)', borderColor: 'var(--ds-danger)' }}>
                <p className="text-sm font-bold" style={{ color: 'var(--ds-danger)' }}>{errorMsg}</p>
                <a
                  href="/toeic/tests"
                  className="inline-block px-4 py-2 rounded-xl text-xs font-bold"
                  style={{ backgroundColor: 'var(--ds-primary)', color: 'var(--ds-surface)' }}
                >
                  Quay Lại
                </a>
              </div>
            ) : (
              <div className="space-y-6">
                {/* PART 5 QUESTIONS (SENTENCE X-RAY) */}
                {mode !== 'part6' && mode !== 'part7' && part5Questions.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b"
                         style={{ borderColor: 'var(--ds-border)' }}>
                      <h2 className="text-lg font-bold" style={{ color: 'var(--ds-text-primary)' }}>
                        Part 5: Incomplete Sentences ({part5Questions.length} câu)
                      </h2>
                      <span className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>
                        Sentence X-Ray Mode
                      </span>
                    </div>

                    {activeQuestion && activeQuestion.part === 5 && (
                      <SentenceXRayCard
                        question={activeQuestion}
                        onAnswerSubmit={({ selectedOption }) => {
                          handleSelectOption(activeQuestion.id, selectedOption);
                        }}
                      />
                    )}
                  </div>
                )}

                {/* PART 6 & PART 7 (SPLIT PASSAGE READER) */}
                {readingComprehensionQuestions.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b"
                         style={{ borderColor: 'var(--ds-border)' }}>
                      <h2 className="text-lg font-bold" style={{ color: 'var(--ds-text-primary)' }}>
                        Part 6 & Part 7: Reading Comprehension & Passages
                      </h2>
                      <span className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>
                        Split-Screen Reader Mode
                      </span>
                    </div>

                    <SplitPassageReader
                      passages={currentPassages}
                      questions={readingComprehensionQuestions}
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
        </main>
      </AppShell2026>
    </>
  );
}
