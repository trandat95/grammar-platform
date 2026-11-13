import React, { useState, useRef, useEffect, useMemo } from 'react';

/**
 * SplitPassageReader Component (Milestone E5 & Section 5.2)
 * Reading interface for Part 6 & Part 7 supporting:
 * - Multi-document passages (Double/Triple texts, doc_order 1..3)
 * - Tabs & Stacked views
 * - ETS tables rendering
 * - Synchronized Evidence Auto-Highlight with smooth scrolling
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
  const passageContainerRef = useRef(null);

  // Sorted passages by doc_order
  const sortedPassages = useMemo(() => {
    return [...passages].sort((a, b) => (a.doc_order || 1) - (b.doc_order || 1));
  }, [passages]);

  const activeQuestion = questions.find(q => q.id === activeQuestionId) || questions[0] || null;
  const evidenceSentence = isReviewMode ? activeQuestion?.ai_analysis?.evidence_sentence_en : null;

  // Auto-scroll to evidence sentence in review mode
  useEffect(() => {
    if (!isReviewMode || !evidenceSentence) return;
    const markEl = passageContainerRef.current?.querySelector('mark.ge-evidence-highlight');
    if (markEl) {
      markEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isReviewMode, evidenceSentence, activeQuestionId, activeDocTab]);

  // Helper to render passage text with highlighted evidence
  const renderPassageContent = (text, pIndex) => {
    if (!text) return null;

    if (isReviewMode && evidenceSentence && text.includes(evidenceSentence.trim())) {
      const parts = text.split(evidenceSentence.trim());
      return (
        <div className="font-serif text-sm sm:text-base leading-relaxed whitespace-pre-line">
          {parts[0]}
          <mark
            className="ge-evidence-highlight px-1.5 py-0.5 rounded font-medium border-b-2 transition-all"
            style={{
              backgroundColor: 'var(--ds-warning-subtle)',
              borderColor: 'var(--ds-warning)',
              color: 'var(--ds-text-primary)'
            }}
          >
            {evidenceSentence.trim()}
          </mark>
          {parts.slice(1).join(evidenceSentence.trim())}
        </div>
      );
    }

    return (
      <div className="font-serif text-sm sm:text-base leading-relaxed whitespace-pre-line"
           style={{ color: 'var(--ds-text-primary)' }}>
        {text}
      </div>
    );
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT COLUMN: PASSAGES (7 cols) */}
      <div
        ref={passageContainerRef}
        className="lg:col-span-7 rounded-2xl p-5 sm:p-6 border shadow-sm space-y-4 max-h-[80vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--ds-surface)', borderColor: 'var(--ds-border)' }}
      >
        {/* Passages Header & Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b"
             style={{ borderColor: 'var(--ds-border)' }}>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                  style={{ backgroundColor: 'var(--ds-surface-secondary)', color: 'var(--ds-text-primary)' }}>
              Đoạn văn {sortedPassages.length > 1 ? `(Bài đọc ${sortedPassages.length} văn bản)` : 'đơn'}
            </span>
            {isReviewMode && evidenceSentence && (
              <span className="text-xs px-2 py-0.5 rounded font-bold animate-pulse"
                    style={{ backgroundColor: 'var(--ds-warning-subtle)', color: 'var(--ds-warning)' }}>
                🔍 Đã tô sáng dẫn chứng
              </span>
            )}
          </div>

          {/* If multi-passages, allow tab/stacked switch */}
          {sortedPassages.length > 1 && (
            <div className="flex items-center gap-1 p-1 rounded-lg border text-xs"
                 style={{ backgroundColor: 'var(--ds-surface-secondary)', borderColor: 'var(--ds-border)' }}>
              <button
                type="button"
                onClick={() => setViewMode('tabs')}
                className={`px-2.5 py-1 rounded font-semibold transition-all ${
                  viewMode === 'tabs' ? 'shadow-sm' : ''
                }`}
                style={{
                  backgroundColor: viewMode === 'tabs' ? 'var(--ds-surface)' : 'transparent',
                  color: 'var(--ds-text-primary)'
                }}
              >
                Chuyển Tabs
              </button>
              <button
                type="button"
                onClick={() => setViewMode('stacked')}
                className={`px-2.5 py-1 rounded font-semibold transition-all ${
                  viewMode === 'stacked' ? 'shadow-sm' : ''
                }`}
                style={{
                  backgroundColor: viewMode === 'stacked' ? 'var(--ds-surface)' : 'transparent',
                  color: 'var(--ds-text-primary)'
                }}
              >
                Xếp Chồng
              </button>
            </div>
          )}
        </div>

        {/* TABS MODE */}
        {sortedPassages.length > 1 && viewMode === 'tabs' && (
          <div className="flex flex-wrap gap-2 pt-1">
            {sortedPassages.map((p, idx) => (
              <button
                key={p.id || idx}
                type="button"
                onClick={() => setActiveDocTab(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  activeDocTab === idx ? 'shadow-sm ring-2 ring-[var(--ds-primary)]' : ''
                }`}
                style={{
                  backgroundColor: activeDocTab === idx ? 'var(--ds-primary-subtle)' : 'var(--ds-surface-secondary)',
                  borderColor: activeDocTab === idx ? 'var(--ds-primary)' : 'var(--ds-border)',
                  color: activeDocTab === idx ? 'var(--ds-primary)' : 'var(--ds-text-primary)'
                }}
              >
                Văn bản {idx + 1} {p.type ? `(${p.type})` : ''}
              </button>
            ))}
          </div>
        )}

        {/* PASSAGES CONTENT */}
        {viewMode === 'tabs' ? (
          // Single Active Passage in Tab
          sortedPassages[activeDocTab] && (
            <div className="space-y-4 pt-2">
              {sortedPassages[activeDocTab].type && (
                <div className="text-xs uppercase font-bold tracking-wider" style={{ color: 'var(--ds-text-muted)' }}>
                  Loại tài liệu: {sortedPassages[activeDocTab].type}
                </div>
              )}

              {/* Render Table if exists */}
              {sortedPassages[activeDocTab].tables?.map((table, tIdx) => (
                <div key={tIdx} className="overflow-x-auto rounded-xl border my-3"
                     style={{ borderColor: 'var(--ds-border)' }}>
                  <table className="w-full text-xs text-left">
                    {table.headers && (
                      <thead style={{ backgroundColor: 'var(--ds-surface-secondary)' }}>
                        <tr>
                          {table.headers.map((h, hi) => (
                            <th key={hi} className="p-2.5 font-bold border-b" style={{ borderColor: 'var(--ds-border)' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {table.rows?.map((row, ri) => (
                        <tr key={ri} className="border-b last:border-0" style={{ borderColor: 'var(--ds-border)' }}>
                          {row.map((cell, ci) => (
                            <td key={ci} className="p-2.5" style={{ color: 'var(--ds-text-primary)' }}>
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
          <div className="space-y-6 pt-2">
            {sortedPassages.map((p, idx) => (
              <div
                key={p.id || idx}
                className="p-4 rounded-xl border space-y-3"
                style={{ backgroundColor: 'var(--ds-surface-secondary)', borderColor: 'var(--ds-border)' }}
              >
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ds-primary)' }}>
                  Văn bản {idx + 1} {p.type ? `• ${p.type}` : ''}
                </div>

                {/* Render Table */}
                {p.tables?.map((table, tIdx) => (
                  <div key={tIdx} className="overflow-x-auto rounded-lg border my-2"
                       style={{ borderColor: 'var(--ds-border)', backgroundColor: 'var(--ds-surface)' }}>
                    <table className="w-full text-xs text-left">
                      {table.headers && (
                        <thead style={{ backgroundColor: 'var(--ds-surface-secondary)' }}>
                          <tr>
                            {table.headers.map((h, hi) => (
                              <th key={hi} className="p-2 font-bold border-b" style={{ borderColor: 'var(--ds-border)' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                      )}
                      <tbody>
                        {table.rows?.map((row, ri) => (
                          <tr key={ri} className="border-b last:border-0" style={{ borderColor: 'var(--ds-border)' }}>
                            {row.map((cell, ci) => (
                              <td key={ci} className="p-2">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}

                {renderPassageContent(p.text, idx)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: QUESTIONS (5 cols) */}
      <div className="lg:col-span-5 space-y-4 max-h-[80vh] overflow-y-auto pr-1">
        <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--ds-border)' }}>
          <h3 className="font-bold text-sm" style={{ color: 'var(--ds-text-primary)' }}>
            Câu Hỏi Đọc Hiểu ({questions.length} câu)
          </h3>
          <span className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>
            {isReviewMode ? 'Bấm vào câu hỏi để dò dẫn chứng' : 'Chọn đáp án trực tiếp'}
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
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isActive ? 'ring-2 ring-[var(--ds-primary)] shadow-sm' : 'hover:border-[var(--ds-border)]'
              }`}
              style={{
                backgroundColor: 'var(--ds-surface)',
                borderColor: isActive ? 'var(--ds-primary)' : 'var(--ds-border)'
              }}
            >
              {/* Question Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{ backgroundColor: 'var(--ds-surface-secondary)', color: 'var(--ds-text-primary)' }}>
                  #{q.number || qIdx + 1}
                </span>

                {isReviewMode && (
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: isCorrectAnswer ? 'var(--ds-success-subtle)' : 'var(--ds-danger-subtle)',
                      color: isCorrectAnswer ? 'var(--ds-success)' : 'var(--ds-danger)'
                    }}
                  >
                    {isCorrectAnswer ? '✓ Đúng' : `✗ Sai (Đ/A: ${q.correct_answer})`}
                  </span>
                )}
              </div>

              {/* Question Stem */}
              <p className="text-xs sm:text-sm font-semibold mb-3 leading-snug" style={{ color: 'var(--ds-text-primary)' }}>
                {q.stem || q.context_sentence}
              </p>

              {/* Options */}
              <div className="space-y-1.5">
                {(['A', 'B', 'C', 'D']).map((optKey) => {
                  const optText = q.options?.[optKey];
                  if (!optText) return null;

                  const isOptSelected = userAns === optKey;
                  const isRight = optKey === q.correct_answer;

                  let optBg = 'var(--ds-surface)';
                  let optBorder = 'var(--ds-border)';

                  if (isReviewMode) {
                    if (isRight) {
                      optBg = 'var(--ds-success-subtle)';
                      optBorder = 'var(--ds-success)';
                    } else if (isOptSelected && !isRight) {
                      optBg = 'var(--ds-danger-subtle)';
                      optBorder = 'var(--ds-danger)';
                    }
                  } else if (isOptSelected) {
                    optBg = 'var(--ds-primary-subtle)';
                    optBorder = 'var(--ds-primary)';
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
                      className="w-full p-2.5 rounded-lg border text-left flex items-center gap-2 text-xs transition-all"
                      style={{
                        backgroundColor: optBg,
                        borderColor: optBorder,
                        color: 'var(--ds-text-primary)'
                      }}
                    >
                      <span className="w-5 h-5 rounded font-bold flex items-center justify-center shrink-0 text-[11px]"
                            style={{ backgroundColor: 'var(--ds-surface-secondary)' }}>
                        {optKey}
                      </span>
                      <span className="leading-tight">{optText}</span>
                    </button>
                  );
                })}
              </div>

              {/* Review Evidence Snippet */}
              {isReviewMode && q.ai_analysis?.evidence_sentence_en && (
                <div className="mt-3 pt-2 border-t text-[11px] space-y-1" style={{ borderColor: 'var(--ds-border)' }}>
                  <div className="font-bold" style={{ color: 'var(--ds-primary)' }}>
                    📍 Dẫn chứng trong bài:
                  </div>
                  <div className="italic" style={{ color: 'var(--ds-text-secondary)' }}>
                    "{q.ai_analysis.evidence_sentence_en}"
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
