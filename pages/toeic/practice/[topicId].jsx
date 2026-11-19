import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import AppShell2026 from '../../../components/ui-2026/AppShell2026';
import { KitIcon } from '../../../components/ui-2026/KitIcon';
import SentenceXRayCard from '../../../components/toeic/SentenceXRayCard';
import AITutorDrawer from '../../../components/toeic/AITutorDrawer';
import useGlobalAuth from '../../../hooks/useGlobalAuth';
import useToeicEntitlement from '../../../hooks/useToeicEntitlement';
import ToeicSmartPaywallModal from '../../../components/toeic/premium/ToeicSmartPaywallModal';
import { ToeicBadge } from '../../../components/toeic/ui';

export default function TopicPracticePage() {
  const router = useRouter();
  const globalAuth = useGlobalAuth();
  const entitlement = useToeicEntitlement();
  const isVip = entitlement.isVip;
  const uid = globalAuth.currentUser?.id || 'guest';
  const { topicId } = router.query;
  const [isLight, setIsLight] = useState(true);
  const [topicInfo, setTopicInfo] = useState(null);
  const [allTopics, setAllTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionNonce, setSessionNonce] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isAiTutorOpen, setIsAiTutorOpen] = useState(false);
  const [aiTutorContext, setAiTutorContext] = useState({ question: null, selectedOption: null });
  const questionCardRef = useRef(null);

  const scrollToQuestionCard = () => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth < 768 && questionCardRef.current) {
      questionCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (!topicId || globalAuth.isLoading) return;
    let isMounted = true;
    setIsLoading(true);
    setErrorMsg(null);
    setIsCompleted(false);

    const headers = {};
    if (globalAuth.activeAuthToken) {
      headers.Authorization = `Bearer ${globalAuth.activeAuthToken}`;
    }

    fetch(`/api/toeic/practice/drill?topicId=${encodeURIComponent(topicId)}&limit=15`, { headers })
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data.topicInfo) {
          setTopicInfo(data.topicInfo);
        }
        if (Array.isArray(data.allTopics)) {
          setAllTopics(data.allTopics);
        }
        if (data.success) {
          setQuestions(data.questions || []);
          setIsPreviewMode(Boolean(data.isPreviewMode));
          setCurrentIndex(0);
          setCorrectCount(0);
          setIsCompleted(false);
        } else if (data.locked || data.isVipRequired) {
          setQuestions([]);
          setIsPreviewMode(false);
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
  }, [topicId, globalAuth.isLoading, globalAuth.activeAuthToken]);

  const currentQ = questions[currentIndex] || null;
  const isLockedForFree = !isLoading && questions.length === 0 && topicInfo && parseInt(topicInfo.target_score_band || 450, 10) >= 550 && !isVip;

  const recommendedTopics = useMemo(() => {
    if (!allTopics.length) return [];
    const curBand = Number(topicInfo?.target_score_band || 450);
    const others = allTopics.filter((t) => t.id !== topicId);
    return [...others]
      .sort((a, b) => {
        const diffA = Math.abs(Number(a.target_score_band || 450) - curBand);
        const diffB = Math.abs(Number(b.target_score_band || 450) - curBand);
        if (diffA !== diffB) return diffA - diffB;
        return Number(b.weight_in_toeic || 0) - Number(a.weight_in_toeic || 0);
      })
      .slice(0, 4);
  }, [allTopics, topicId, topicInfo]);

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
            <div className="toeic-flex-between toeic-practice-topbar" style={{ marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <Link
                  href="/toeic/practice"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: 'var(--ds-accent)',
                    textDecoration: 'none'
                  }}
                >
                  <span>&larr; Chọn bài khác (24)</span>
                </Link>
                <span className="ge-hide-mobile" style={{ color: 'var(--ds-border)' }}>|</span>
                <Link
                  href="/toeic"
                  className="ge-hide-mobile"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--ds-text-muted)',
                    textDecoration: 'none'
                  }}
                >
                  <span>TOEIC Hub</span>
                </Link>
              </div>

              {topicInfo && (
                <div className="toeic-practice-topic-meta" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.45rem', fontSize: '0.8rem', color: 'var(--ds-text-secondary)' }}>
                  <span>
                    Chủ điểm: <strong style={{ color: 'var(--ds-text)' }}>{topicInfo.name_vi}</strong>
                  </span>
                  <span className="ge-hide-mobile">•</span>
                  <span className="ge-hide-mobile" style={{ whiteSpace: 'nowrap' }}>Band {topicInfo.target_score_band}+</span>
                  <span className="ge-hide-mobile">•</span>
                  <span className="ge-hide-mobile" style={{ whiteSpace: 'nowrap' }}>Trọng số {topicInfo.weight_in_toeic}%</span>
                </div>
              )}
            </div>

            {/* VIP LOCKED STATE FOR FREE USERS ON TARGET >= 550 */}
            {isLockedForFree ? (
              <div
                className="toeic-card"
                style={{
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  borderRadius: '1.25rem',
                  backgroundColor: 'var(--ds-card)',
                  borderColor: 'var(--ds-card-border)',
                  marginTop: '1.5rem'
                }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--ds-warning-bg)', color: 'var(--ds-warning)', marginBottom: '0.75rem' }}>
                  <KitIcon name="lock" size={26} />
                </div>
                <div style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
                  <ToeicBadge variant="warning">
                    Đặc Quyền VIP • Target {topicInfo?.target_score_band || '550'}+
                  </ToeicBadge>
                </div>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--ds-text)', margin: '0 0 0.5rem 0' }}>
                  {topicInfo?.name_vi || 'Chủ Điểm Ngữ Pháp Chuyên Sâu'}
                </h2>
                <p style={{ fontSize: '0.92rem', color: 'var(--ds-text-secondary)', maxWidth: '540px', margin: '0 auto 1.5rem auto', lineHeight: 1.6 }}>
                  {topicInfo?.theory_summary_vi || 'Chủ điểm ngữ pháp này thuộc band nâng cao (550+), chỉ mở cho thành viên VIP. Tài khoản Miễn phí được học trọn vẹn các chủ điểm nền tảng (Target dưới 550).'}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="toeic-btn toeic-btn-primary"
                    onClick={() => entitlement.openPaywall('TRG_08_GRAMMAR_TARGET_550', {
                      topicId,
                      topicName: topicInfo?.name_vi,
                      targetBand: topicInfo?.target_score_band
                    })}
                    style={{ padding: '0.75rem 1.6rem', fontWeight: 800, fontSize: '0.95rem' }}
                  >
                    Nâng Cấp VIP Mở Khóa Chủ Điểm Này (Từ 29.000đ) &rarr;
                  </button>
                  <a
                    href="/toeic#topics"
                    className="toeic-btn toeic-btn-secondary"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                  >
                    &larr; Xem các chủ điểm Miễn Phí (&lt; 550)
                  </a>
                </div>
              </div>
            ) : (
              <>
                {/* PREVIEW MODE BANNER FOR 550+ BAND (4 FREE PREVIEW QUESTIONS) */}
                {isPreviewMode && !isVip && questions.length > 0 && (
                  <div
                    className="toeic-card"
                    style={{
                      padding: '0.75rem 1rem',
                      marginBottom: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.6rem',
                      border: '1px solid var(--ds-warning-border)',
                      backgroundColor: 'var(--ds-warning-bg)',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--ds-warning)' }}>
                      <KitIcon name="bolt" size={14} />
                      <span>Chế độ dùng thử: Làm miễn phí {questions.length} câu đầu của chuyên đề Band {topicInfo?.target_score_band || 550}+</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => entitlement.openPaywall('TRG_08_GRAMMAR_TARGET_550', {
                        topicId,
                        topicName: topicInfo?.name_vi,
                        targetBand: topicInfo?.target_score_band
                      })}
                      style={{
                        border: 'none',
                        borderRadius: '0.45rem',
                        padding: '0.35rem 0.75rem',
                        backgroundColor: 'var(--ds-btn-warning)',
                        color: '#ffffff',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Mở khóa toàn bộ VIP →
                    </button>
                  </div>
                )}

                {/* PROGRESS BAR */}
                {questions.length > 0 && (
                  <div
                    className="toeic-card toeic-practice-progress-card"
                    style={{
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.65rem',
                      marginBottom: '0.9rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--ds-text)', whiteSpace: 'nowrap' }}>
                        Câu {currentIndex + 1} / {questions.length}
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '0.35rem',
                          backgroundColor: 'var(--ds-success-bg)',
                          color: 'var(--ds-success)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Đúng: {correctCount} câu
                      </span>
                    </div>

                    {/* Progress Indicators */}
                    <div className="toeic-practice-num-strip" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.3rem', maxWidth: '100%' }}>
                      {questions.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          className="toeic-practice-num-btn"
                          onClick={() => {
                            setCurrentIndex(i);
                            scrollToQuestionCard();
                          }}
                          style={{
                            minWidth: '34px',
                            height: '34px',
                            flexShrink: 0,
                            borderRadius: '0.45rem',
                            fontSize: '0.76rem',
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
                ) : isCompleted ? (
                  <div className="toeic-card" style={{ padding: '1.5rem 1.25rem', marginBottom: '1.5rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '1.35rem' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '54px',
                          height: '54px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--ds-success-bg)',
                          color: 'var(--ds-success)',
                          marginBottom: '0.65rem',
                        }}
                      >
                        <KitIcon name="check" size={26} />
                      </div>
                      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--ds-text-heading)', margin: '0 0 0.35rem 0' }}>
                        Hoàn thành chuyên đề!
                      </h2>
                      <p style={{ fontSize: '0.88rem', color: 'var(--ds-text-secondary)', margin: '0 0 0.75rem 0' }}>
                        {topicInfo?.name_vi || topicId}
                      </p>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', padding: '0.5rem 1rem', borderRadius: '999px', backgroundColor: 'var(--ds-bg-elevated)', border: '1px solid var(--ds-border)' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--ds-success)' }}>
                          Đúng {correctCount} / {questions.length} câu
                        </span>
                        <span style={{ color: 'var(--ds-border)' }}>•</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ds-accent)' }}>
                          {questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0}% chính xác
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                      <button
                        type="button"
                        className="toeic-btn toeic-btn-secondary"
                        onClick={() => {
                          setIsCompleted(false);
                          setCurrentIndex(0);
                          setCorrectCount(0);
                          setSessionNonce((n) => n + 1);
                          scrollToQuestionCard();
                        }}
                      >
                        Làm lại bài này
                      </button>
                      <Link
                        href="/toeic/practice"
                        className="toeic-btn toeic-btn-primary"
                        style={{ textDecoration: 'none' }}
                      >
                        Xem tất cả 24 dạng bài &rarr;
                      </Link>
                      <Link
                        href="/toeic"
                        className="toeic-btn toeic-btn-outline"
                        style={{ textDecoration: 'none' }}
                      >
                        Về TOEIC Hub
                      </Link>
                    </div>

                    {/* Next Recommended Topics */}
                    {recommendedTopics.length > 0 && (
                      <div style={{ borderTop: '1px solid var(--ds-border)', paddingTop: '1.25rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ds-text-heading)', margin: '0 0 0.75rem 0' }}>
                          Gợi ý dạng bài luyện tiếp theo
                        </h3>
                        <div className="toeic-grid-2" style={{ gap: '0.75rem' }}>
                          {recommendedTopics.map((rec) => {
                            const recBand = Number(rec.target_score_band || 450);
                            const recFree = recBand < 550;
                            const recAccess = isVip || recFree;
                            return (
                              <Link
                                key={rec.id}
                                href={`/toeic/practice/${rec.id}`}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                              >
                                <div
                                  className="toeic-topic-card"
                                  style={{
                                    padding: '0.85rem 0.95rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    gap: '0.5rem',
                                    height: '100%',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <div>
                                    <div className="toeic-flex-between" style={{ marginBottom: '0.4rem' }}>
                                      <ToeicBadge variant="muted">Band {recBand}+</ToeicBadge>
                                      {recAccess ? (
                                        <ToeicBadge variant="success">{recFree ? 'Miễn phí' : 'VIP'}</ToeicBadge>
                                      ) : (
                                        <ToeicBadge variant="warning">4 câu thử</ToeicBadge>
                                      )}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--ds-text-heading)', lineHeight: 1.35 }}>
                                      {rec.name_vi}
                                    </div>
                                  </div>
                                  <div className="toeic-flex-between" style={{ fontSize: '0.76rem', paddingTop: '0.4rem', borderTop: '1px solid var(--ds-border)' }}>
                                    <span style={{ color: 'var(--ds-text-muted)' }}>Trọng số {rec.weight_in_toeic || 0}%</span>
                                    <span style={{ color: 'var(--ds-accent)', fontWeight: 800 }}>Luyện ngay &rarr;</span>
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : currentQ ? (
                  <div ref={questionCardRef} className="toeic-xray-card-anchor">
                    <SentenceXRayCard
                      key={`${currentQ.id}-${sessionNonce}`}
                      question={currentQ}
                      onAnswerSubmit={({ isCorrect, selectedOption }) => {
                        if (isCorrect) setCorrectCount(prev => prev + 1);
                        if (typeof window !== 'undefined') {
                          try {
                            const stored = JSON.parse(localStorage.getItem(`toeic_responses_${uid}`) || '{}');
                            stored[currentQ.id] = { selectedOption, isCorrect, timestamp: Date.now() };
                            localStorage.setItem(`toeic_responses_${uid}`, JSON.stringify(stored));
                          } catch (e) {}
                        }
                      }}
                      onSaveToSrs={({ word }) => {
                        alert(`Đã lưu "${word}" vào Sổ tay Ôn tập Ngắt quãng (SRS)!`);
                      }}
                      onOpenAiTutor={(q, opt) => {
                        setAiTutorContext({ question: q, selectedOption: opt });
                        setIsAiTutorOpen(true);
                      }}
                      onNextQuestion={() => {
                        if (currentIndex < questions.length - 1) {
                          setCurrentIndex(prev => prev + 1);
                          scrollToQuestionCard();
                        } else {
                          setIsCompleted(true);
                          if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
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
                    <div className="toeic-flex-between ge-toeic-desktop-footer" style={{ marginTop: '1.25rem' }}>
                      <button
                        type="button"
                        disabled={currentIndex === 0}
                        onClick={() => {
                          setCurrentIndex(prev => prev - 1);
                          scrollToQuestionCard();
                        }}
                        className="toeic-btn toeic-btn-secondary"
                        style={{ opacity: currentIndex === 0 ? 0.4 : 1, cursor: currentIndex === 0 ? 'default' : 'pointer' }}
                      >
                        &larr; Câu trước
                      </button>

                      {currentIndex < questions.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentIndex(prev => prev + 1);
                            scrollToQuestionCard();
                          }}
                          className="toeic-btn toeic-btn-primary"
                        >
                          <span>Câu tiếp theo &rarr;</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setIsCompleted(true);
                            if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="toeic-btn toeic-btn-success"
                        >
                          <span>Hoàn Thành &amp; Xem Gợi Ý ✓</span>
                        </button>
                      )}
                    </div>

                    {/* STICKY MOBILE PRACTICE DOCK (Zero-Scroll Navigation) */}
                    {questions.length > 0 && (
                      <div className="ge-mobile-exam-dock" aria-label="Điều hướng luyện tập nhanh">
                        <button
                          type="button"
                          className="ge-mobile-exam-dock-btn"
                          disabled={currentIndex === 0}
                          onClick={() => {
                            setCurrentIndex(prev => prev - 1);
                            scrollToQuestionCard();
                          }}
                        >
                          ← Trước
                        </button>

                        <div
                          style={{
                            flex: 1,
                            textAlign: 'center',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            color: 'var(--ds-text-secondary)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Câu {currentIndex + 1}/{questions.length} • ✓{correctCount}
                        </div>

                        {currentIndex < questions.length - 1 ? (
                          <button
                            type="button"
                            className="ge-mobile-exam-dock-btn primary"
                            onClick={() => {
                              setCurrentIndex(prev => prev + 1);
                              scrollToQuestionCard();
                            }}
                          >
                            Tiếp theo →
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="ge-mobile-exam-dock-btn success"
                            onClick={() => {
                              setIsCompleted(true);
                              if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            style={{ flex: 1 }}
                          >
                            Hoàn thành ✓
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>

        {/* PAYWALL TRIGGER MODAL */}
        <ToeicSmartPaywallModal
          isOpen={entitlement.isPaywallOpen}
          onClose={entitlement.closePaywall}
          triggerId={entitlement.activeTriggerId}
          context={entitlement.paywallContext}
        />
      </AppShell2026>
    </>
  );
}
