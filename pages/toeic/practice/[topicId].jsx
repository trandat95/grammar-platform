import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AppShell2026 from '../../../components/ui-2026/AppShell2026';
import SentenceXRayCard from '../../../components/toeic/SentenceXRayCard';

export default function TopicPracticePage() {
  const router = useRouter();
  const { topicId } = router.query;
  const [isLight, setIsLight] = useState(true);
  const [topicInfo, setTopicInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (!topicId) return;
    let isMounted = true;
    setIsLoading(true);
    setErrorMsg(null);

    fetch(`/api/toeic/practice/drill?topicId=${topicId}&limit=15`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data.success) {
          setTopicInfo(data.topicInfo);
          setQuestions(data.questions || []);
          setCurrentIndex(0);
          setCorrectCount(0);
        } else {
          setErrorMsg(data.error || 'Không thể tải bài tập');
        }
      })
      .catch(() => {
        if (isMounted) setErrorMsg('Lỗi mạng khi tải bài tập');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [topicId]);

  const currentQ = questions[currentIndex] || null;

  return (
    <>
      <Head>
        <title>{topicInfo?.name_vi || topicId || 'Luyện Tập Chuyên Sâu'} (Sentence X-Ray) | Grammar Engine</title>
        <meta name="description" content="Luyện tập ngữ pháp TOEIC qua lăng kính quang phổ câu Sentence X-Ray." />
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
        currentChapterTitle={topicInfo?.name_vi || 'Luyện Tập TOEIC'}
      >
        <div className="toeic-page-wrap">
          <div className="toeic-container" style={{ maxWidth: '860px' }}>
            {/* BACK TO HUB & TOPIC INFO */}
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

              {topicInfo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--ds-text-secondary)' }}>
                  <span>
                    Chủ điểm: <strong style={{ color: 'var(--ds-text)' }}>{topicInfo.name_vi}</strong>
                  </span>
                  <span>•</span>
                  <span>Band {topicInfo.target_score_band}+</span>
                  <span>•</span>
                  <span>Trọng số {topicInfo.weight_in_toeic}%</span>
                </div>
              )}
            </div>

            {/* PROGRESS BAR */}
            {questions.length > 0 && (
              <div className="p-4 rounded-xl border flex items-center justify-between gap-4"
                   style={{ backgroundColor: 'var(--ds-surface)', borderColor: 'var(--ds-border)' }}>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm" style={{ color: 'var(--ds-text-primary)' }}>
                    Câu {currentIndex + 1} / {questions.length}
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded"
                        style={{ backgroundColor: 'var(--ds-success-subtle)', color: 'var(--ds-success)' }}>
                    Đúng: {correctCount} câu
                  </span>
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center gap-1">
                  {questions.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentIndex(i)}
                      className={`w-6 h-6 rounded-md text-[11px] font-bold transition-all ${
                        i === currentIndex ? 'ring-2 ring-[var(--ds-primary)]' : ''
                      }`}
                      style={{
                        backgroundColor: i < currentIndex
                          ? 'var(--ds-primary)'
                          : i === currentIndex
                          ? 'var(--ds-primary-subtle)'
                          : 'var(--ds-surface-secondary)',
                        color: i < currentIndex
                          ? 'var(--ds-surface)'
                          : 'var(--ds-text-primary)'
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* MAIN SENTENCE X-RAY CARD */}
            {isLoading ? (
              <div className="min-h-[350px] flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
                     style={{ borderColor: 'var(--ds-primary)', borderTopColor: 'transparent' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--ds-text-muted)' }}>
                  Đang tải ngân hàng câu hỏi Sentence X-Ray...
                </p>
              </div>
            ) : errorMsg ? (
              <div className="rounded-2xl p-6 border text-center space-y-3"
                   style={{ backgroundColor: 'var(--ds-danger-subtle)', borderColor: 'var(--ds-danger)' }}>
                <p className="text-sm font-bold" style={{ color: 'var(--ds-danger)' }}>{errorMsg}</p>
                <a
                  href="/toeic"
                  className="inline-block px-4 py-2 rounded-xl text-xs font-bold"
                  style={{ backgroundColor: 'var(--ds-primary)', color: 'var(--ds-surface)' }}
                >
                  Quay Lại Hub
                </a>
              </div>
            ) : currentQ ? (
              <div className="space-y-4">
                <SentenceXRayCard
                  question={currentQ}
                  onAnswerSubmit={({ isCorrect }) => {
                    if (isCorrect) setCorrectCount(prev => prev + 1);
                  }}
                  onSaveToSrs={({ word }) => {
                    alert(`Đã lưu "${word}" vào Sổ tay Ôn tập Ngắt quãng (SRS)!`);
                  }}
                  onOpenAiTutor={(q, opt) => {
                    alert(`AI Gia Sư: Chủ điểm "${q.ai_analysis?.primary_topic_name_vi}". Công thức cốt lõi: ${q.ai_analysis?.micro_rule_formula_vi}`);
                  }}
                />

                {/* BOTTOM NAVIGATION */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex(prev => prev - 1)}
                    className="px-4 py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-40"
                    style={{ borderColor: 'var(--ds-border)', color: 'var(--ds-text-primary)' }}
                  >
                    ← Câu trước
                  </button>

                  {currentIndex < questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentIndex(prev => prev + 1)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                      style={{ backgroundColor: 'var(--ds-primary)', color: 'var(--ds-surface)' }}
                    >
                      <span>Câu tiếp theo</span>
                      <span>→</span>
                    </button>
                  ) : (
                    <a
                      href="/toeic"
                      className="px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                      style={{ backgroundColor: 'var(--ds-success)', color: 'var(--ds-surface)' }}
                    >
                      <span>Hoàn Thành 15 Câu • Về Hub</span>
                      <span>✓</span>
                    </a>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </AppShell2026>
    </>
  );
}
