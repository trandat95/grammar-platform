import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ToeicBadge } from './ui';

/**
 * SplitPassageReader Component (Milestone U5 / AC-U5.1 - AC-U5.3)
 * Split-Screen Reading Workspace for Part 6 & Part 7:
 * - Independent smooth scrolling for Passage and Questions
 * - Multi-document support (Double/Triple texts with doc_order)
 * - Clean Table Rendering (invoices, schedules, price lists)
 * - Synchronized Evidence Auto-Highlighting with center scroll
 * - Mobile responsive mode switcher (Tabs / Stacked / Mobile Split Toggle)
 * Strict Design Token Discipline: var(--ds-*).
 */
export default function SplitPassageReader({
  passages = [],
  questions = [],
  activeQuestionId = null,
  isReviewMode = false,
  userAnswers = {},
  onSelectOption,
  onQuestionClick
}) {
  const [activeDocTab, setActiveDocTab] = useState(0);
  const [viewMode, setViewMode] = useState('tabs'); // 'tabs' | 'stacked'
  const [mobileTab, setMobileTab] = useState('passage'); // 'passage' | 'questions'
  const [fontSize, setFontSize] = useState(15); // px
  const passageContainerRef = useRef(null);

  // Sorted passages by doc_order
  const sortedPassages = useMemo(() => {
    return [...passages].sort((a, b) => (a.doc_order || 1) - (b.doc_order || 1));
  }, [passages]);

  const activeQuestion = questions.find(q => q.id === activeQuestionId) || questions[0] || null;
  const evidenceSentence = activeQuestion?.ai_analysis?.evidence_sentence_en || null;

  // Auto-scroll to evidence sentence in review mode or when clicking questions
  useEffect(() => {
    if (!evidenceSentence) return;
    const markEl = passageContainerRef.current?.querySelector('mark.toeic-evidence-highlight');
    if (markEl) {
      markEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [evidenceSentence, activeQuestionId, activeDocTab, viewMode]);

  // Helper to render passage content with highlighted evidence
  const renderPassageContent = (text, pIndex) => {
    if (!text) return null;

    if (evidenceSentence && text.includes(evidenceSentence.trim())) {
      const parts = text.split(evidenceSentence.trim());
      return (
        <div
          style={{
            fontFamily: "'Merriweather', Georgia, serif",
            fontSize: `${fontSize}px`,
            lineHeight: 1.75,
            whiteSpace: 'pre-line',
            color: 'var(--ds-text)'
          }}
        >
          {parts[0]}
          <mark
            className="toeic-evidence-highlight is-focused"
            title={`Dẫn chứng câu #${activeQuestion?.number || ''}`}
          >
            {evidenceSentence.trim()}
          </mark>
          {parts.slice(1).join(evidenceSentence.trim())}
        </div>
      );
    }

    return (
      <div
        style={{
          fontFamily: "'Merriweather', Georgia, serif",
          fontSize: `${fontSize}px`,
          lineHeight: 1.75,
          whiteSpace: 'pre-line',
          color: 'var(--ds-text)'
        }}
      >
        {text}
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* MOBILE TAB TOGGLE (< 1024px) */}
      <div className="ge-show-mobile-only" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.25rem', backgroundColor: 'var(--ds-bg-elevated)', borderRadius: '0.75rem', border: '1px solid var(--ds-border)' }}>
          <button
            type="button"
            onClick={() => setMobileTab('passage')}
            className={`toeic-target-chip ${mobileTab === 'passage' ? 'active' : ''}`}
            style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }}
          >
            📄 Bài Đọc ({sortedPassages.length} văn bản)
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('questions')}
            className={`toeic-target-chip ${mobileTab === 'questions' ? 'active' : ''}`}
            style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }}
          >
            ❓ Câu Hỏi ({questions.length} câu)
          </button>
        </div>
      </div>

      {/* SPLIT-SCREEN WORKSPACE */}
      <div className="toeic-split-reader">
        {/* LEFT COLUMN: PASSAGES PANE */}
        <div
          ref={passageContainerRef}
          className={`toeic-card toeic-passage-pane ${mobileTab !== 'passage' ? 'ge-hide-mobile' : ''}`}
          style={{ padding: '1.25rem 1.5rem' }}
        >
          {/* Passage Toolbar */}
          <div className="toeic-flex-between" style={{ paddingBottom: '0.85rem', borderBottom: '1px solid var(--ds-border)', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ToeicBadge variant="primary">
                {sortedPassages.length > 1 ? `Bài đọc ${sortedPassages.length} văn bản` : 'Bài đọc đơn'}
              </ToeicBadge>
              {evidenceSentence && (
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-warning)', backgroundColor: 'var(--ds-warning-bg)', padding: '0.2rem 0.5rem', borderRadius: '0.35rem' }}>
                  📍 Đang soi dẫn chứng
                </span>
              )}
            </div>

            {/* Controls: Multi-text switcher + Font Size */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* Font Size Adjuster */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => setFontSize(prev => Math.max(13, prev - 1))}
                  title="Giảm cỡ chữ"
                  style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.35rem',
                    border: '1px solid var(--ds-border)',
                    backgroundColor: 'var(--ds-card)',
                    color: 'var(--ds-text)',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize(prev => Math.min(19, prev + 1))}
                  title="Tăng cỡ chữ"
                  style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.35rem',
                    border: '1px solid var(--ds-border)',
                    backgroundColor: 'var(--ds-card)',
                    color: 'var(--ds-text)',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  A+
                </button>
              </div>

              {sortedPassages.length > 1 && (
                <div style={{ display: 'flex', gap: '0.25rem', padding: '0.2rem', backgroundColor: 'var(--ds-bg-elevated)', borderRadius: '0.5rem', border: '1px solid var(--ds-border)' }}>
                  <button
                    type="button"
                    onClick={() => setViewMode('tabs')}
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '0.35rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      border: 'none',
                      backgroundColor: viewMode === 'tabs' ? 'var(--ds-card)' : 'transparent',
                      color: viewMode === 'tabs' ? 'var(--ds-accent)' : 'var(--ds-text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    Tabs
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('stacked')}
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '0.35rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      border: 'none',
                      backgroundColor: viewMode === 'stacked' ? 'var(--ds-card)' : 'transparent',
                      color: viewMode === 'stacked' ? 'var(--ds-accent)' : 'var(--ds-text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    Xếp Chồng
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* DOCUMENT TABS (When Multi-Passages) */}
          {sortedPassages.length > 1 && viewMode === 'tabs' && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {sortedPassages.map((p, idx) => (
                <button
                  key={p.id || idx}
                  type="button"
                  onClick={() => setActiveDocTab(idx)}
                  className={`toeic-target-chip ${activeDocTab === idx ? 'active' : ''}`}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                >
                  Văn bản {idx + 1} {p.type ? `(${p.type})` : ''}
                </button>
              ))}
            </div>
          )}

          {/* PASSAGE TEXT CONTENT */}
          {viewMode === 'tabs' ? (
            sortedPassages[activeDocTab] && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {sortedPassages[activeDocTab].type && (
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ds-text-muted)', letterSpacing: '0.04em' }}>
                    Thể loại tài liệu: {sortedPassages[activeDocTab].type}
                  </div>
                )}

                {/* Render ETS Table if present (AC-U5.3) */}
                {sortedPassages[activeDocTab].tables?.map((table, tIdx) => (
                  <div key={tIdx} style={{ overflowX: 'auto', borderRadius: '0.75rem', border: '1px solid var(--ds-border)', margin: '0.75rem 0' }}>
                    <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                      {table.headers && (
                        <thead style={{ backgroundColor: 'var(--ds-bg-elevated)' }}>
                          <tr>
                            {table.headers.map((h, hi) => (
                              <th key={hi} style={{ padding: '0.65rem 0.85rem', fontWeight: 800, borderBottom: '1px solid var(--ds-border)', color: 'var(--ds-text)' }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                      )}
                      <tbody>
                        {table.rows?.map((row, ri) => (
                          <tr key={ri} style={{ borderBottom: '1px solid var(--ds-border-subtle)', backgroundColor: ri % 2 === 1 ? 'var(--ds-bg-elevated)' : 'transparent' }}>
                            {row.map((cell, ci) => (
                              <td key={ci} style={{ padding: '0.65rem 0.85rem', color: 'var(--ds-text)' }}>
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}

                {renderPassageContent(sortedPassages[activeDocTab].text, activeDocTab)}
              </div>
            )
          ) : (
            // Stacked Cards Mode
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {sortedPassages.map((p, idx) => (
                <div key={p.id || idx} style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--ds-border)', backgroundColor: 'var(--ds-bg-elevated)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ds-accent)', marginBottom: '0.75rem' }}>
                    Văn bản {idx + 1} {p.type ? `• ${p.type}` : ''}
                  </div>
                  {renderPassageContent(p.text, idx)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: QUESTIONS PANE */}
        <div
          className={`space-y-4 ${mobileTab !== 'questions' ? 'ge-hide-mobile' : ''}`}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          <div className="toeic-flex-between" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--ds-border)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--ds-text)' }}>
              Câu Hỏi Đọc Hiểu ({questions.length} câu)
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)' }}>
              {isReviewMode ? 'Bấm câu hỏi để dò dẫn chứng' : 'Chọn đáp án trực tiếp'}
            </span>
          </div>

          {questions.map((q, qIdx) => {
            const isActive = q.id === activeQuestionId || q.id === activeQuestion?.id;
            const userAns = userAnswers[q.id];
            const isCorrectAnswer = userAns === q.correct_answer;

            return (
              <div
                key={q.id || qIdx}
                onClick={() => onQuestionClick && onQuestionClick(q.id)}
                className="toeic-card"
                style={{
                  padding: '1.15rem',
                  border: `1.5px solid ${isActive ? 'var(--ds-accent)' : 'var(--ds-border)'}`,
                  boxShadow: isActive ? '0 0 0 2px var(--ds-accent-border)' : 'none',
                  cursor: 'pointer'
                }}
              >
                {/* Question Header */}
                <div className="toeic-flex-between" style={{ marginBottom: '0.75rem' }}>
                  <ToeicBadge variant={isActive ? 'primary' : 'muted'}>
                    Câu #{q.number || qIdx + 1}
                  </ToeicBadge>

                  {isReviewMode && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '0.35rem',
                        backgroundColor: isCorrectAnswer ? 'var(--ds-success-bg)' : 'var(--ds-danger-bg)',
                        color: isCorrectAnswer ? 'var(--ds-success)' : 'var(--ds-danger)'
                      }}
                    >
                      {isCorrectAnswer ? '✓ Đúng' : `✗ Sai (Đáp án: ${q.correct_answer})`}
                    </span>
                  )}
                </div>

                {/* Question Stem */}
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ds-text)', lineHeight: 1.5, margin: '0 0 0.85rem 0' }}>
                  {q.stem || q.context_sentence}
                </p>

                {/* 4 Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(['A', 'B', 'C', 'D']).map(optKey => {
                    const optText = q.options?.[optKey];
                    if (!optText) return null;

                    const isOptSelected = userAns === optKey;
                    const isRight = optKey === q.correct_answer;

                    let optBg = 'var(--ds-card)';
                    let optBorder = 'var(--ds-border)';
                    if (isReviewMode) {
                      if (isRight) {
                        optBg = 'var(--ds-success-bg)';
                        optBorder = 'var(--ds-success)';
                      } else if (isOptSelected && !isRight) {
                        optBg = 'var(--ds-danger-bg)';
                        optBorder = 'var(--ds-danger)';
                      }
                    } else if (isOptSelected) {
                      optBg = 'var(--ds-accent-bg)';
                      optBorder = 'var(--ds-accent)';
                    }

                    return (
                      <button
                        key={optKey}
                        type="button"
                        disabled={isReviewMode}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectOption) onSelectOption(q.id, optKey);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.55rem 0.85rem',
                          borderRadius: '0.5rem',
                          border: `1px solid ${optBorder}`,
                          backgroundColor: optBg,
                          color: 'var(--ds-text)',
                          fontSize: '0.85rem',
                          textAlign: 'left',
                          cursor: isReviewMode ? 'default' : 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            backgroundColor: 'var(--ds-bg-elevated)',
                            flexShrink: 0
                          }}
                        >
                          {optKey}
                        </span>
                        <span style={{ lineHeight: 1.4 }}>{optText}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Review Evidence Snippet */}
                {isReviewMode && q.ai_analysis?.evidence_sentence_en && (
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid var(--ds-border-subtle)', fontSize: '0.8rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--ds-warning)', marginBottom: '0.2rem' }}>
                      📍 Dẫn chứng trong bài đọc:
                    </div>
                    <div style={{ fontStyle: 'italic', color: 'var(--ds-text-secondary)', lineHeight: 1.4 }}>
                      "{q.ai_analysis.evidence_sentence_en}"
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
