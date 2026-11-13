import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AppShell2026 from '../../../components/ui-2026/AppShell2026';
import SentenceXRayCard from '../../../components/toeic/SentenceXRayCard';
import AITutorDrawer from '../../../components/toeic/AITutorDrawer';

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
  const [isAiTutorOpen, setIsAiTutorOpen] = useState(false);
  const [aiTutorContext, setAiTutorContext] = useState({ question: null, selectedOption: null });

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
              <div
                className="toeic-card"
                style={{
                  padding: '0.85rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--ds-text)' }}>
                    Câu {currentIndex + 1} / {questions.length}
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '0.35rem',
                      backgroundColor: 'var(--ds-success-bg)',
                      color: 'var(--ds-success)'
                    }}
                  >
                    Đúng: {correctCount} câu
                  </span>
                </div>

                {/* Progress Indicators */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', overflowX: 'auto' }}>
                  {questions.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentIndex(i)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '0.35rem',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        border: i === currentIndex ? '1.5px solid var(--ds-accent)' : '1px solid var(--ds-border)',
                        backgroundColor: i < currentIndex
                          ? 'var(--ds-accent)'
                          : i === currentIndex
                          ? 'var(--ds-accent-bg)'
                          : 'var(--ds-card)',
                        color: i < currentIndex
                          ? '#ffffff'
                          : i === currentIndex
                          ? 'var(--ds-accent)'
                          : 'var(--ds-text)',
                        cursor: 'pointer'
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
              <div style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', textAlign: 'center' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid var(--ds-accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ds-text-muted)' }}>
                  Đang tải ngân hàng câu hỏi Sentence X-Ray...
                </p>
              </div>
            ) : errorMsg ? (
              <div className="toeic-card" style={{ textAlign: 'center', padding: '2rem', border: '1px solid var(--ds-danger-border)', backgroundColor: 'var(--ds-danger-bg)' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--ds-danger)', marginBottom: '1rem' }}>{errorMsg}</p>
                <a
                  href="/toeic"
                  className="toeic-btn toeic-btn-primary"
                >
                  Quay Lại Hub
                </a>
              </div>
            ) : currentQ ? (
              <div>
                <SentenceXRayCard
                  question={currentQ}
                  onAnswerSubmit={({ isCorrect }) => {
                    if (isCorrect) setCorrectCount(prev => prev + 1);
                  }}
                  onSaveToSrs={({ word }) => {
                    alert(`Đã lưu "${word}" vào Sổ tay Ôn tập Ngắt quãng (SRS)!`);
                  }}
                  onOpenAiTutor={(q, opt) => {
                    setAiTutorContext({ question: q, selectedOption: opt });
                    setIsAiTutorOpen(true);
                  }}
                />

                {/* AI Tutor Drawer Component */}
                <AITutorDrawer
                  isOpen={isAiTutorOpen}
                  onClose={() => setIsAiTutorOpen(false)}
                  question={aiTutorContext.question}
                  selectedOption={aiTutorContext.selectedOption}
                />

                {/* BOTTOM NAVIGATION */}
                <div className="toeic-flex-between" style={{ marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex(prev => prev - 1)}
                    className="toeic-btn toeic-btn-secondary"
                    style={{ opacity: currentIndex === 0 ? 0.4 : 1, cursor: currentIndex === 0 ? 'default' : 'pointer' }}
                  >
                    &larr; Câu trước
                  </button>

                  {currentIndex < questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentIndex(prev => prev + 1)}
                      className="toeic-btn toeic-btn-primary"
                    >
                      <span>Câu tiếp theo &rarr;</span>
                    </button>
                  ) : (
                    <a
                      href="/toeic"
                      className="toeic-btn toeic-btn-success"
                    >
                      <span>Hoàn Thành 15 Câu • Về Hub ✓</span>
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
