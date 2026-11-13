import React, { useState } from 'react';
import Head from 'next/head';
import AppShell2026 from '../../components/ui-2026/AppShell2026';

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
      pos: 'adjective',
      meaning_vi: 'Liên tiếp, liên tục (thời gian)',
      example_sentence: 'The team achieved sales targets for three consecutive quarters.',
      ease_factor: 2.4,
      interval_days: 7,
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
      alert('🎉 Bạn đã hoàn thành toàn bộ lượt ôn tập SRS hôm nay!');
      setCurrentIndex(0);
    }
  };

  return (
    <>
      <Head>
        <title>Sổ Tay Câu Sai & Từ Vựng (SRS Spaced Repetition) | Grammar Engine</title>
        <meta name="description" content="Ôn tập câu làm sai và từ vựng TOEIC theo chu kỳ ngắt quãng SM-2." />
      </Head>

      <AppShell2026
        activeView="toeic"
        toeicSubView="srs"
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
        currentChapterTitle="Sổ Tay Câu Sai & Từ Vựng (SRS)"
      >
        <div className="toeic-page-wrap">
          <div className="toeic-container" style={{ maxWidth: '780px' }}>
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
              <div className="space-y-6">
                <div className="flex items-center justify-between text-xs font-semibold"
                     style={{ color: 'var(--ds-text-secondary)' }}>
                  <span>Thẻ {currentIndex + 1} / {filteredCards.length}</span>
                  <span>Đến hạn ôn: {currentCard.next_review_at} • Khoảng cách: {currentCard.interval_days} ngày</span>
                </div>

                <div
                  onClick={() => setIsFlipped(prev => !prev)}
                  className="rounded-3xl p-8 sm:p-12 border shadow-sm cursor-pointer min-h-[320px] flex flex-col justify-between transition-all hover:shadow-md"
                  style={{
                    backgroundColor: 'var(--ds-surface)',
                    borderColor: isFlipped ? 'var(--ds-primary)' : 'var(--ds-border)'
                  }}
                >
                  {/* CARD TYPE BADGE */}
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase"
                      style={{
                        backgroundColor: currentCard.card_type === 'VOCABULARY' ? 'var(--ds-success-subtle)' : 'var(--ds-danger-subtle)',
                        color: currentCard.card_type === 'VOCABULARY' ? 'var(--ds-success)' : 'var(--ds-danger)'
                      }}
                    >
                      {currentCard.card_type === 'VOCABULARY' ? '📖 Flashcard Từ Vựng' : '❌ Câu Hỏi Từng Làm Sai'}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>
                      {isFlipped ? 'Mặt sau (Giải thích)' : 'Nhấp thẻ để lật mặt sau ↻'}
                    </span>
                  </div>

                  {/* CARD BODY */}
                  <div className="my-auto py-6 text-center space-y-4">
                    {!isFlipped ? (
                      // FRONT OF CARD
                      currentCard.card_type === 'VOCABULARY' ? (
                        <div className="space-y-2">
                          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--ds-text-primary)' }}>
                            {currentCard.word}
                          </h2>
                          <div className="text-sm italic" style={{ color: 'var(--ds-text-muted)' }}>
                            ({currentCard.pos})
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 text-left max-w-xl mx-auto">
                          <p className="text-base sm:text-lg font-medium leading-relaxed" style={{ color: 'var(--ds-text-primary)' }}>
                            {currentCard.stem}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(currentCard.options || {}).map(([k, v]) => (
                              <div key={k} className="p-2.5 rounded-lg border"
                                   style={{ backgroundColor: 'var(--ds-surface-secondary)', borderColor: 'var(--ds-border)' }}>
                                <span className="font-bold">({k})</span> {v}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ) : (
                      // BACK OF CARD (REVEALED)
                      currentCard.card_type === 'VOCABULARY' ? (
                        <div className="space-y-3 max-w-md mx-auto">
                          <div className="text-2xl font-bold" style={{ color: 'var(--ds-primary)' }}>
                            {currentCard.meaning_vi}
                          </div>
                          {currentCard.example_sentence && (
                            <div className="text-xs sm:text-sm italic p-3 rounded-xl border leading-relaxed"
                                 style={{ backgroundColor: 'var(--ds-surface-secondary)', borderColor: 'var(--ds-border)', color: 'var(--ds-text-secondary)' }}>
                              "{currentCard.example_sentence}"
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3 text-left max-w-xl mx-auto">
                          <div className="text-sm font-bold" style={{ color: 'var(--ds-success)' }}>
                            ✓ Đáp án đúng: ({currentCard.correct_answer})
                          </div>
                          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--ds-text-primary)' }}>
                            {currentCard.explanation_vi}
                          </p>
                        </div>
                      )
                    )}
                  </div>

                  <div className="text-center text-[11px]" style={{ color: 'var(--ds-text-muted)' }}>
                    Ease Factor: {currentCard.ease_factor}
                  </div>
                </div>

                {/* SM-2 DIFFICULTY RATING BUTTONS */}
                {isFlipped && (
                  <div className="grid grid-cols-4 gap-2 pt-2 animate-fadeIn">
                    <button
                      type="button"
                      onClick={() => handleRateCard(1)}
                      className="py-3 rounded-xl border text-xs font-bold text-center transition-all hover:opacity-90 active:scale-95"
                      style={{
                        backgroundColor: 'var(--ds-danger-subtle)',
                        borderColor: 'var(--ds-danger)',
                        color: 'var(--ds-danger)'
                      }}
                    >
                      <div>Chưa nhớ</div>
                      <div className="text-[10px] font-normal mt-0.5">1 ngày</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRateCard(2)}
                      className="py-3 rounded-xl border text-xs font-bold text-center transition-all hover:opacity-90 active:scale-95"
                      style={{
                        backgroundColor: 'var(--ds-warning-subtle)',
                        borderColor: 'var(--ds-warning)',
                        color: 'var(--ds-warning)'
                      }}
                    >
                      <div>Hơi khó</div>
                      <div className="text-[10px] font-normal mt-0.5">3 ngày</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRateCard(3)}
                      className="py-3 rounded-xl border text-xs font-bold text-center transition-all hover:opacity-90 active:scale-95"
                      style={{
                        backgroundColor: 'var(--ds-primary-subtle)',
                        borderColor: 'var(--ds-primary)',
                        color: 'var(--ds-primary)'
                      }}
                    >
                      <div>Nhớ tốt</div>
                      <div className="text-[10px] font-normal mt-0.5">7 ngày</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRateCard(4)}
                      className="py-3 rounded-xl border text-xs font-bold text-center transition-all hover:opacity-90 active:scale-95"
                      style={{
                        backgroundColor: 'var(--ds-success-subtle)',
                        borderColor: 'var(--ds-success)',
                        color: 'var(--ds-success)'
                      }}
                    >
                      <div>Rất dễ</div>
                      <div className="text-[10px] font-normal mt-0.5">14 ngày</div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl p-8 border text-center space-y-3"
                   style={{ backgroundColor: 'var(--ds-surface)', borderColor: 'var(--ds-border)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
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
