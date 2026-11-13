import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AppShell2026 from '../../components/ui-2026/AppShell2026';
import { ToeicBadge, ToeicButton } from '../../components/toeic/ui';

export default function MistakesSrsPage() {
  const [isLight, setIsLight] = useState(true);
  const [cardType, setCardType] = useState('ALL'); // 'ALL' | 'MISTAKE_QUESTION' | 'VOCABULARY'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Sample SRS cards
  const [srsCards, setSrsCards] = useState([
    {
      id: 'srs_01',
      card_type: 'MISTAKE_QUESTION',
      questionId: 'ETS2024_T01_Q105',
      stem: 'The marketing team is currently _______ new strategies to enhance customer engagement.',
      correct_answer: 'D',
      options: { A: 'update', B: 'updating', C: 'updates', D: 'updated' },
      explanation_vi: 'Cấu trúc be + V-ing/V-ed. Theo ngữ cảnh chủ động "is currently implementing/updating", cần dạng V-ing bổ nghĩa.',
      ease_factor: 2.5,
      interval_days: 1,
      next_review_at: 'Hôm nay'
    },
    {
      id: 'srs_02',
      card_type: 'VOCABULARY',
      word: 'reimbursement',
      ipa: '/ˌriːɪmˈbɜːsmənt/',
      pos: 'noun',
      meaning_vi: 'Sự hoàn tiền, bồi hoàn chi phí công tác',
      example_sentence: 'Please submit your receipts for travel expense reimbursement.',
      ease_factor: 2.6,
      interval_days: 3,
      next_review_at: 'Hôm nay'
    },
    {
      id: 'srs_03',
      card_type: 'VOCABULARY',
      word: 'consecutive',
      ipa: '/kənˈsekjətɪv/',
      pos: 'adjective',
      meaning_vi: 'Liên tiếp, liên tục (thời gian)',
      example_sentence: 'The team achieved sales targets for three consecutive quarters.',
      ease_factor: 2.4,
      interval_days: 7,
      next_review_at: 'Hôm nay'
    },
    {
      id: 'srs_04',
      card_type: 'VOCABULARY',
      word: 'subsequently',
      ipa: '/ˈsʌbsɪkwəntli/',
      pos: 'adverb',
      meaning_vi: 'Sau đó, tiếp theo sau (thời gian)',
      example_sentence: 'He resigned and subsequently moved abroad.',
      ease_factor: 2.5,
      interval_days: 1,
      next_review_at: 'Hôm nay'
    }
  ]);

  const filteredCards = cardType === 'ALL'
    ? srsCards
    : srsCards.filter(c => c.card_type === cardType);

  const currentCard = filteredCards[currentIndex] || null;

  const handleRateCard = (quality) => {
    // SM-2 Interval Simulation
    setIsFlipped(false);
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      alert('🎉 Chúc mừng! Bạn đã hoàn thành toàn bộ lượt ôn tập SRS theo chu kỳ hôm nay!');
      setCurrentIndex(0);
    }
  };

  // TTS Pronunciation
  const handleSpeakWord = (e, text) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Keyboard Shortcuts (Space to flip, 1-4 for SM-2 ratings)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (isFlipped) {
        if (e.key === '1') handleRateCard(1);
        else if (e.key === '2') handleRateCard(2);
        else if (e.key === '3') handleRateCard(3);
        else if (e.key === '4') handleRateCard(4);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentIndex, filteredCards]);

  const handleSelectView = (v) => {
    if (v === 'toeic') {
      if (typeof window !== 'undefined' && window.location.pathname !== '/toeic') {
        window.location.href = '/toeic';
      }
      return;
    }
    if (typeof window !== 'undefined') {
      window.location.href = v === 'dashboard' ? '/' : `/?view=${v}`;
    }
  };

  return (
    <>
      <Head>
        <title>Sổ Tay Câu Sai &amp; Từ Vựng (SRS Spaced Repetition 3D) | Grammar Engine</title>
        <meta name="description" content="Ôn tập câu làm sai và từ vựng TOEIC theo thuật toán ngắt quãng SM-2 với thẻ lật 3D hai mặt." />
      </Head>

      <AppShell2026
        activeView="toeic"
        toeicSubView="srs"
        onSelectView={handleSelectView}
        isLight={isLight}
        onToggleTheme={() => setIsLight(prev => !prev)}
        currentChapterTitle="Sổ Tay Câu Sai & Từ Vựng (SRS)"
      >
        <div className="toeic-page-wrap">
          <div className="toeic-container" style={{ maxWidth: '780px' }}>
            {/* BACK LINK & CATEGORY FILTER */}
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

              {/* CARD TYPE FILTER */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem', borderRadius: '0.75rem', border: '1px solid var(--ds-border)', backgroundColor: 'var(--ds-card)' }}>
                <button
                  type="button"
                  onClick={() => { setCardType('ALL'); setCurrentIndex(0); setIsFlipped(false); }}
                  className={`toeic-target-chip ${cardType === 'ALL' ? 'active' : ''}`}
                  style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                >
                  Tất cả ({srsCards.length})
                </button>
                <button
                  type="button"
                  onClick={() => { setCardType('MISTAKE_QUESTION'); setCurrentIndex(0); setIsFlipped(false); }}
                  className={`toeic-target-chip ${cardType === 'MISTAKE_QUESTION' ? 'active' : ''}`}
                  style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                >
                  Câu sai
                </button>
                <button
                  type="button"
                  onClick={() => { setCardType('VOCABULARY'); setCurrentIndex(0); setIsFlipped(false); }}
                  className={`toeic-target-chip ${cardType === 'VOCABULARY' ? 'active' : ''}`}
                  style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                >
                  Từ vựng
                </button>
              </div>
            </div>

            {/* SRS FLASHCARD CONTAINER */}
            {currentCard ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Meta Indicator */}
                <div className="toeic-flex-between" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ds-text-secondary)' }}>
                  <span>Thẻ {currentIndex + 1} / {filteredCards.length}</span>
                  <span>Đến hạn ôn: <strong>{currentCard.next_review_at}</strong> • Khoảng cách: <strong>{currentCard.interval_days} ngày</strong></span>
                </div>

                {/* 3D FLIP CARD (AC-U6.4) */}
                <div className="toeic-flashcard-perspective">
                  <div
                    onClick={() => setIsFlipped(prev => !prev)}
                    className={`toeic-flashcard-inner ${isFlipped ? 'is-flipped' : ''}`}
                  >
                    {/* FRONT OF CARD */}
                    <div className="toeic-flashcard-front">
                      <div className="toeic-flex-between">
                        <ToeicBadge variant={currentCard.card_type === 'VOCABULARY' ? 'success' : 'danger'}>
                          {currentCard.card_type === 'VOCABULARY' ? '📖 Flashcard Từ Vựng' : '❌ Câu Hỏi Từng Làm Sai'}
                        </ToeicBadge>
                        <span style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)' }}>
                          Nhấp thẻ hoặc phím Space để lật ↻
                        </span>
                      </div>

                      <div style={{ margin: 'auto 0', padding: '1.5rem 0' }}>
                        {currentCard.card_type === 'VOCABULARY' ? (
                          <div>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--ds-text)', letterSpacing: '-0.02em' }}>
                              {currentCard.word}
                            </h2>
                            {currentCard.ipa && (
                              <div style={{ fontSize: '1.1rem', color: 'var(--ds-accent)', fontFamily: 'monospace', marginBottom: '0.5rem' }}>
                                {currentCard.ipa}
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
                              <span style={{ fontStyle: 'italic', color: 'var(--ds-text-muted)', fontSize: '0.9rem' }}>
                                ({currentCard.pos})
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleSpeakWord(e, currentCard.word)}
                                style={{
                                  padding: '0.25rem 0.6rem',
                                  borderRadius: '0.5rem',
                                  border: '1px solid var(--ds-border)',
                                  backgroundColor: 'var(--ds-bg-elevated)',
                                  color: 'var(--ds-accent)',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                🔊 Phát âm
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ textAlign: 'left', maxWidth: '580px', margin: '0 auto' }}>
                            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ds-text)', lineHeight: 1.6, marginBottom: '1rem' }}>
                              {currentCard.stem}
                            </p>
                            <div className="toeic-grid-2" style={{ gap: '0.5rem' }}>
                              {Object.entries(currentCard.options || {}).map(([k, v]) => (
                                <div
                                  key={k}
                                  style={{
                                    padding: '0.65rem 0.85rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--ds-border)',
                                    backgroundColor: 'var(--ds-bg-elevated)',
                                    fontSize: '0.85rem'
                                  }}
                                >
                                  <strong>({k})</strong> {v}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)' }}>
                        Độ dễ (Ease Factor): {currentCard.ease_factor}
                      </div>
                    </div>

                    {/* BACK OF CARD (REVEALED) */}
                    <div className="toeic-flashcard-back">
                      <div className="toeic-flex-between">
                        <ToeicBadge variant="primary">
                          ✓ Mặt Sau: Nghĩa &amp; Giải Thích
                        </ToeicBadge>
                        <span style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)' }}>
                          Chọn mức độ nhớ bên dưới ⇣
                        </span>
                      </div>

                      <div style={{ margin: 'auto 0', padding: '1.5rem 0' }}>
                        {currentCard.card_type === 'VOCABULARY' ? (
                          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
                            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ds-accent)', marginBottom: '1rem' }}>
                              {currentCard.meaning_vi}
                            </div>
                            {currentCard.example_sentence && (
                              <div
                                style={{
                                  fontSize: '0.95rem',
                                  fontStyle: 'italic',
                                  padding: '1rem',
                                  borderRadius: '0.75rem',
                                  border: '1px solid var(--ds-border)',
                                  backgroundColor: 'var(--ds-card)',
                                  color: 'var(--ds-text)',
                                  lineHeight: 1.6
                                }}
                              >
                                "{currentCard.example_sentence}"
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'left', maxWidth: '580px', margin: '0 auto' }}>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ds-success)', marginBottom: '0.75rem' }}>
                              ✓ Đáp án đúng: ({currentCard.correct_answer})
                            </div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--ds-text)', lineHeight: 1.6 }}>
                              {currentCard.explanation_vi}
                            </p>
                          </div>
                        )}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)' }}>
                        SM-2 Interval: {currentCard.interval_days} ngày
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4 SM-2 DIFFICULTY RATING BUTTONS */}
                {isFlipped && (
                  <div className="toeic-grid-4" style={{ gap: '0.5rem', animation: 'toeicFadeIn 0.2s ease-out' }}>
                    <button
                      type="button"
                      onClick={() => handleRateCard(1)}
                      style={{
                        padding: '0.75rem 0.5rem',
                        borderRadius: '0.75rem',
                        border: '1px solid var(--ds-danger-border)',
                        backgroundColor: 'var(--ds-danger-bg)',
                        color: 'var(--ds-danger)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '0.85rem' }}>Chưa nhớ (1)</div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 500, marginTop: '0.15rem' }}>1 ngày</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRateCard(2)}
                      style={{
                        padding: '0.75rem 0.5rem',
                        borderRadius: '0.75rem',
                        border: '1px solid var(--ds-warning-border)',
                        backgroundColor: 'var(--ds-warning-bg)',
                        color: 'var(--ds-warning)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '0.85rem' }}>Hơi khó (2)</div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 500, marginTop: '0.15rem' }}>3 ngày</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRateCard(3)}
                      style={{
                        padding: '0.75rem 0.5rem',
                        borderRadius: '0.75rem',
                        border: '1px solid var(--ds-accent-border)',
                        backgroundColor: 'var(--ds-accent-bg)',
                        color: 'var(--ds-accent)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '0.85rem' }}>Nhớ tốt (3)</div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 500, marginTop: '0.15rem' }}>7 ngày</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRateCard(4)}
                      style={{
                        padding: '0.75rem 0.5rem',
                        borderRadius: '0.75rem',
                        border: '1px solid var(--ds-success-border)',
                        backgroundColor: 'var(--ds-success-bg)',
                        color: 'var(--ds-success)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '0.85rem' }}>Rất dễ (4)</div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 500, marginTop: '0.15rem' }}>14 ngày</div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="toeic-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
                <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ds-text)' }}>
                  Không có thẻ nào thuộc danh mục này!
                </p>
              </div>
            )}
          </div>
        </div>
      </AppShell2026>
    </>
  );
}
