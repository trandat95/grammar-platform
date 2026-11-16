import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ToeicBadge } from './ui';

/**
 * SplitPassageReader Component (Milestone U5 & Post-Launch UI/UX Optimization)
 * Set-based Split-Screen Reading Workspace for Part 6 & Part 7:
 * - Every passage set links the reading passage(s) directly to its matching 2-5 questions
 * - Independent smooth scrolling for Passage and Questions with Sticky left pane
 * - Multi-document support (Double/Triple texts with doc_order)
 * - Clean Table Rendering (invoices, schedules, price lists)
 * - Synchronized Evidence Auto-Highlighting with center scroll
 * - Set Switcher Stepper ensuring 100% alignment (zero empty white space)
 * - Mobile responsive mode switcher (Tabs / Stacked / Mobile Split Toggle)
 * Strict Design Token Discipline: var(--ds-*).
 */
export default function SplitPassageReader({
  passages = [],
  questions = [],
  activeQuestionId = null,
  examMode = 'practice',
  isReviewMode = false,
  isVip = false,
  crowdStats = null,
  onRequireVip = null,
  userAnswers = {},
  onSelectOption,
  onQuestionClick
}) {
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [activeDocTab, setActiveDocTab] = useState(0);
  const [viewMode, setViewMode] = useState('tabs'); // 'tabs' | 'stacked'
  const [mobileTab, setMobileTab] = useState('passage'); // 'passage' | 'questions'
  const [fontSize, setFontSize] = useState(15); // px
  const passageContainerRef = useRef(null);

  // Group passages & questions into unified Passage Sets
  const passageSets = useMemo(() => {
    if (!passages || passages.length === 0) {
      // Fallback: If only questions provided without passages
      return [{
        setId: 'set_all',
        label: `Tất cả (${questions.length} câu)`,
        type: 'General',
        passages: [],
        questions
      }];
    }

    const setsMap = new Map();

    // 1. Group passage documents by set ID (e.g. P131-134, P147-148)
    for (const p of passages) {
      let setId = p.passage_group_id;
      if (!setId && p.id) {
        const parts = p.id.split('_D')[0].split('_');
        setId = parts[parts.length - 1]; // e.g. P131-134
      }
      if (!setId) setId = p.id || 'P_UNKNOWN';

      if (!setsMap.has(setId)) {
        setsMap.set(setId, {
          setId,
          passages: [],
          questions: [],
          type: p.type || 'Reading Document',
          questionNumbers: new Set(p.questions || [])
        });
      }

      setsMap.get(setId).passages.push(p);
      if (Array.isArray(p.questions)) {
        p.questions.forEach(n => setsMap.get(setId).questionNumbers.add(n));
      }
    }

    // Sort documents within each set by doc_order
    for (const set of setsMap.values()) {
      set.passages.sort((a, b) => (a.doc_order || 1) - (b.doc_order || 1));
    }

    // 2. Associate questions with their corresponding set
    for (const q of questions) {
      let matched = false;
      const qGroup = q.passage_group_id || q.passage_id;

      if (qGroup && setsMap.has(qGroup)) {
        setsMap.get(qGroup).questions.push(q);
        matched = true;
      } else {
        // Match by question number
        for (const set of setsMap.values()) {
          if (set.questionNumbers.has(q.number)) {
            set.questions.push(q);
            matched = true;
            break;
          }
        }
      }

      // If unmatched, add to first set as fallback
      if (!matched && setsMap.size > 0) {
        setsMap.values().next().value.questions.push(q);
      }
    }

    // 3. Format sets array with clean labels (e.g., Q131-134)
    const result = Array.from(setsMap.values()).filter(s => s.questions.length > 0 || s.passages.length > 0);

    return result.map(s => {
      const qNums = s.questions.map(q => q.number).sort((a, b) => a - b);
      const label = qNums.length > 0
        ? qNums.length === 1
          ? `Câu #${qNums[0]}`
          : `Q${qNums[0]}-${qNums[qNums.length - 1]}`
        : s.setId;

      return {
        ...s,
        label
      };
    });
  }, [passages, questions]);

  // Sync activeSetIndex if activeQuestionId changes from outside
  useEffect(() => {
    if (!activeQuestionId) return;
    const foundIdx = passageSets.findIndex(s =>
      s.questions.some(q => q.id === activeQuestionId)
    );
    if (foundIdx !== -1 && foundIdx !== activeSetIndex) {
      setActiveSetIndex(foundIdx);
      setActiveDocTab(0);
    }
  }, [activeQuestionId, passageSets, activeSetIndex]);

  const currentSet = passageSets[activeSetIndex] || passageSets[0] || { passages: [], questions: [] };
  const currentPassages = currentSet.passages || [];
  const setQuestions = currentSet.questions || [];

  const activeQuestion = setQuestions.find(q => q.id === activeQuestionId) || setQuestions[0] || null;
  const canShowEvidence = isReviewMode || (examMode === 'practice' && Boolean(userAnswers[activeQuestion?.id]));
  const evidenceSentence = canShowEvidence ? (activeQuestion?.ai_analysis?.evidence_sentence_en || null) : null;

  // Auto-scroll to evidence sentence in review mode or when clicking questions
  useEffect(() => {
    if (!evidenceSentence) return;
    const markEl = passageContainerRef.current?.querySelector('mark.toeic-evidence-highlight');
    if (markEl) {
      markEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [evidenceSentence, activeQuestionId, activeDocTab, viewMode, activeSetIndex]);

  // Helper to render passage content with highlighted evidence
  const renderPassageContent = (text) => {
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
    <div style={{ width: '100%' }}>
      {/* 1. SET SWITCHER STEPPER (Milestone U5 / Synchronized Sets) */}
      <div
        className="toeic-card"
        style={{
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--ds-text-secondary)', textTransform: 'uppercase' }}>
            Bộ Đoạn Văn:
          </span>
          <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', maxWidth: '100%', padding: '0.1rem 0' }}>
            {passageSets.map((s, idx) => {
              const isActive = idx === activeSetIndex;
              const setAnsweredCount = s.questions.filter(q => Boolean(userAnswers[q.id])).length;
              const hasAllAnswered = s.questions.length > 0 && setAnsweredCount === s.questions.length;

              return (
                <button
                  key={s.setId || idx}
                  type="button"
                  onClick={() => {
                    setActiveSetIndex(idx);
                    setActiveDocTab(0);
                    if (s.questions.length > 0 && onQuestionClick) {
                      onQuestionClick(s.questions[0].id);
                    }
                  }}
                  className={`toeic-target-chip ${isActive ? 'active' : ''}`}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.3rem 0.65rem',
                    whiteSpace: 'nowrap',
                    borderColor: hasAllAnswered && !isActive ? 'var(--ds-success)' : undefined
                  }}
                >
                  {hasAllAnswered && !isActive ? '✓ ' : ''}{s.label}
                  {!hasAllAnswered && s.questions.length > 0 ? ` (${setAnsweredCount}/${s.questions.length})` : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* Set Prev/Next Steppers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: 'auto' }}>
          <button
            type="button"
            disabled={activeSetIndex === 0}
            onClick={() => {
              const prevIdx = Math.max(0, activeSetIndex - 1);
              setActiveSetIndex(prevIdx);
              setActiveDocTab(0);
              if (passageSets[prevIdx]?.questions?.length > 0 && onQuestionClick) {
                onQuestionClick(passageSets[prevIdx].questions[0].id);
              }
            }}
            className="toeic-btn toeic-btn-secondary"
            style={{
              padding: '0.3rem 0.65rem',
              fontSize: '0.75rem',
              opacity: activeSetIndex === 0 ? 0.4 : 1,
              cursor: activeSetIndex === 0 ? 'default' : 'pointer'
            }}
          >
            &larr; Đoạn trước
          </button>

          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-text-muted)' }}>
            {activeSetIndex + 1}/{passageSets.length}
          </span>

          <button
            type="button"
            disabled={activeSetIndex >= passageSets.length - 1}
            onClick={() => {
              const nextIdx = Math.min(passageSets.length - 1, activeSetIndex + 1);
              setActiveSetIndex(nextIdx);
              setActiveDocTab(0);
              if (passageSets[nextIdx]?.questions?.length > 0 && onQuestionClick) {
                onQuestionClick(passageSets[nextIdx].questions[0].id);
              }
            }}
            className="toeic-btn toeic-btn-secondary"
            style={{
              padding: '0.3rem 0.65rem',
              fontSize: '0.75rem',
              opacity: activeSetIndex >= passageSets.length - 1 ? 0.4 : 1,
              cursor: activeSetIndex >= passageSets.length - 1 ? 'default' : 'pointer'
            }}
          >
            Đoạn tiếp &rarr;
          </button>
        </div>
      </div>

      {/* MOBILE TAB TOGGLE (< 1024px) */}
      <div className="ge-show-mobile-only" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.25rem', backgroundColor: 'var(--ds-bg-elevated)', borderRadius: 'var(--ds-radius-md)', border: '1px solid var(--ds-border)' }}>
          <button
            type="button"
            onClick={() => setMobileTab('passage')}
            className={`toeic-target-chip ${mobileTab === 'passage' ? 'active' : ''}`}
            style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }}
          >
            📄 Bài Đọc ({currentPassages.length} văn bản)
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('questions')}
            className={`toeic-target-chip ${mobileTab === 'questions' ? 'active' : ''}`}
            style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }}
          >
            ❓ Câu Hỏi ({setQuestions.length} câu)
          </button>
        </div>
      </div>

      {/* 2. SPLIT-SCREEN WORKSPACE */}
      <div className="toeic-split-reader">
        {/* LEFT COLUMN: PASSAGES PANE (Sticky & Perfectly Aligned) */}
        <div
          ref={passageContainerRef}
          className={`toeic-card toeic-passage-pane ${mobileTab !== 'passage' ? 'ge-hide-mobile' : ''}`}
          style={{
            padding: '1.25rem 1.5rem',
            position: 'sticky',
            top: '1rem',
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto'
          }}
        >
          {/* Passage Toolbar */}
          <div className="toeic-flex-between" style={{ paddingBottom: '0.85rem', borderBottom: '1px solid var(--ds-border)', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <ToeicBadge variant="primary">
                {currentPassages.length > 1 ? `Bài đọc ${currentPassages.length} văn bản` : 'Bài đọc đơn'}
              </ToeicBadge>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-text-secondary)' }}>
                {currentSet.label}
              </span>
              {evidenceSentence && (
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ds-warning)', backgroundColor: 'var(--ds-warning-bg)', padding: '0.2rem 0.5rem', borderRadius: 'var(--ds-radius-sm)' }}>
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
                    borderRadius: 'var(--ds-radius-sm)',
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
                    borderRadius: 'var(--ds-radius-sm)',
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

              {currentPassages.length > 1 && (
                <div style={{ display: 'flex', gap: '0.25rem', padding: '0.2rem', backgroundColor: 'var(--ds-bg-elevated)', borderRadius: 'var(--ds-radius-sm)', border: '1px solid var(--ds-border)' }}>
                  <button
                    type="button"
                    onClick={() => setViewMode('tabs')}
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--ds-radius-sm)',
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
                      borderRadius: 'var(--ds-radius-sm)',
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
          {currentPassages.length > 1 && viewMode === 'tabs' && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {currentPassages.map((p, idx) => (
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
          {currentPassages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--ds-text-muted)' }}>
              Đoạn văn đọc hiểu đang được nạp...
            </div>
          ) : viewMode === 'tabs' ? (
            currentPassages[activeDocTab] && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {currentPassages[activeDocTab].type && (
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ds-text-muted)', letterSpacing: '0.04em' }}>
                    Thể loại tài liệu: {currentPassages[activeDocTab].type}
                  </div>
                )}

                {/* Render ETS Table if present (AC-U5.3) */}
                {currentPassages[activeDocTab].tables?.map((table, tIdx) => (
                  <div key={tIdx} style={{ overflowX: 'auto', borderRadius: 'var(--ds-radius-md)', border: '1px solid var(--ds-border)', margin: '0.75rem 0' }}>
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

                {renderPassageContent(currentPassages[activeDocTab].text)}
              </div>
            )
          ) : (
            // Stacked Cards Mode
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {currentPassages.map((p, idx) => (
                <div key={p.id || idx} style={{ padding: '1rem', borderRadius: 'var(--ds-radius-md)', border: '1px solid var(--ds-border)', backgroundColor: 'var(--ds-bg-elevated)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ds-accent)', marginBottom: '0.75rem' }}>
                    Văn bản {idx + 1} {p.type ? `• ${p.type}` : ''}
                  </div>
                  {renderPassageContent(p.text)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: QUESTIONS PANE (Only matching questions for current set!) */}
        <div
          className={`${mobileTab !== 'questions' ? 'ge-hide-mobile' : ''}`}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          <div className="toeic-flex-between" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--ds-border)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--ds-text)' }}>
              Câu Hỏi Cho Bài Đọc Này ({setQuestions.length} câu)
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)' }}>
              {isReviewMode ? 'Bấm câu hỏi để dò dẫn chứng' : 'Chọn đáp án trực tiếp'}
            </span>
          </div>

          {setQuestions.map((q, qIdx) => {
            const isActive = q.id === activeQuestionId || q.id === activeQuestion?.id;
            const userAns = userAnswers[q.id];
            const hasAnswered = Boolean(userAns);
            const showFeedback = isReviewMode || (examMode === 'practice' && hasAnswered);
            const isCorrectAnswer = userAns === q.correct_answer;
            const ai = q.ai_analysis || {};
            const selectedAnalysis = userAns ? ai.option_deep_analysis?.[userAns] : null;
            const correctAnalysis = q.correct_answer ? ai.option_deep_analysis?.[q.correct_answer] : null;

            return (
              <div
                key={q.id || qIdx}
                onClick={() => onQuestionClick && onQuestionClick(q.id)}
                className="toeic-card"
                style={{
                  padding: '1.15rem',
                  border: `1.5px solid ${isActive ? 'var(--ds-accent)' : 'var(--ds-border)'}`,
                  boxShadow: isActive ? 'var(--ds-shadow-sm)' : 'none',
                  cursor: 'pointer'
                }}
              >
                {/* Question Header */}
                <div className="toeic-flex-between" style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <ToeicBadge variant={isActive ? 'primary' : 'muted'}>
                      Câu #{q.number || qIdx + 1}
                    </ToeicBadge>
                    {ai.primary_topic_name_vi && (
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--ds-text-muted)' }}>
                        {ai.primary_topic_name_vi}
                      </span>
                    )}
                  </div>

                  {showFeedback && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--ds-radius-sm)',
                        backgroundColor: isCorrectAnswer ? 'var(--ds-success-bg)' : 'var(--ds-danger-bg)',
                        color: isCorrectAnswer ? 'var(--ds-success)' : 'var(--ds-danger)',
                        flexShrink: 0
                      }}
                    >
                      {isCorrectAnswer ? '✓ Đúng' : `✗ Sai (Đáp án: ${q.correct_answer})`}
                    </span>
                  )}
                </div>

                {/* Question Stem */}
                <p style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--ds-text)', lineHeight: 1.5, margin: '0 0 0.85rem 0' }}>
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
                    let badgeBg = 'var(--ds-bg-elevated)';
                    let badgeColor = 'var(--ds-text)';
                    if (showFeedback) {
                      if (isRight) {
                        optBg = 'var(--ds-success-bg)';
                        optBorder = 'var(--ds-success)';
                        badgeBg = 'var(--ds-success)';
                        badgeColor = '#ffffff';
                      } else if (isOptSelected && !isRight) {
                        optBg = 'var(--ds-danger-bg)';
                        optBorder = 'var(--ds-danger)';
                        badgeBg = 'var(--ds-danger)';
                        badgeColor = '#ffffff';
                      }
                    } else if (isOptSelected) {
                      optBg = 'var(--ds-accent-bg)';
                      optBorder = 'var(--ds-accent)';
                      badgeBg = 'var(--ds-accent)';
                      badgeColor = '#ffffff';
                    }

                    return (
                      <button
                        key={optKey}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectOption) onSelectOption(q.id, optKey);
                          if (onQuestionClick) onQuestionClick(q.id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.65rem',
                          padding: '0.65rem 0.85rem',
                          borderRadius: 'var(--ds-radius-md)',
                          border: `1.5px solid ${optBorder}`,
                          backgroundColor: optBg,
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              backgroundColor: badgeBg,
                              color: badgeColor,
                              flexShrink: 0
                            }}
                          >
                            {optKey}
                          </span>
                          <span style={{ fontSize: '0.88rem', color: 'var(--ds-text)', lineHeight: 1.4 }}>
                            {optText}
                          </span>
                        </div>
                        {showFeedback && isRight && (
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ds-success)', flexShrink: 0 }}>
                            ✓ Đáp án đúng
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation & Evidence Box (Basic for Free Exam Review, Deep AI for VIP & Practice) */}
                {showFeedback && (() => {
                  const canSeeDeepAi = isVip || examMode === 'practice';
                  const qCrowd = crowdStats?.[q.id];
                  const showCrowd = Boolean(qCrowd && qCrowd.visible && qCrowd.attemptCount >= 20);
                  const crowdWrongPct = showCrowd && userAns && qCrowd?.optionSelectionCounts?.[userAns]
                    ? Math.round((qCrowd.optionSelectionCounts[userAns] / qCrowd.attemptCount) * 100)
                    : null;
                  return (
                    <div
                      style={{
                        marginTop: '0.9rem',
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--ds-radius-md)',
                        backgroundColor: 'var(--ds-bg-elevated)',
                        border: '1px solid var(--ds-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.45rem',
                        fontSize: '0.82rem',
                        lineHeight: 1.55,
                        color: 'var(--ds-text-secondary)'
                      }}
                    >
                      <div className="toeic-flex-between" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, color: 'var(--ds-accent)', fontSize: '0.8rem' }}>
                          💡 {canSeeDeepAi ? 'Giải thích AI & Dẫn chứng' : 'Đáp án & Giải thích cơ bản'} (Câu #{q.number})
                        </span>
                        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                          {showCrowd && qCrowd.correctRate !== null && (
                            <ToeicBadge variant="muted">
                              📊 {qCrowd.correctRate}% làm đúng ({qCrowd.attemptCount} lượt{qCrowd.sampleTier === 'preliminary' ? ' • Sơ bộ' : ''})
                            </ToeicBadge>
                          )}
                          {!canSeeDeepAi && (
                            <ToeicBadge variant="warning">VIP AI Locked</ToeicBadge>
                          )}
                        </div>
                      </div>

                      {!isCorrectAnswer && crowdWrongPct !== null && crowdWrongPct > 0 && (
                        <div style={{ fontSize: '0.76rem', color: 'var(--ds-warning)', fontWeight: 700 }}>
                          ⚠️ Bẫy phổ biến: {crowdWrongPct}% học viên cũng chọn nhầm đáp án ({userAns}) ở câu này{qCrowd.sampleTier === 'preliminary' ? ' (dữ liệu sơ bộ)' : ''}.
                        </div>
                      )}

                      {(q.explanation_vi || correctAnalysis?.ai_feedback_vi) && (
                        <div style={{ color: 'var(--ds-text)' }}>
                          • Đáp án đúng <strong>({q.correct_answer})</strong>: {q.explanation_vi || correctAnalysis?.ai_feedback_vi}
                        </div>
                      )}

                      {(ai.evidence_sentence_en || q.key_clue) && (
                        <div
                          style={{
                            padding: '0.45rem 0.65rem',
                            borderRadius: 'var(--ds-radius-sm)',
                            backgroundColor: 'var(--ds-warning-bg)',
                            borderLeft: '3px solid var(--ds-warning)',
                            color: 'var(--ds-text)',
                            fontSize: '0.8rem'
                          }}
                        >
                          <strong>📌 Dẫn chứng:</strong> &ldquo;{ai.evidence_sentence_en || q.key_clue}&rdquo;
                        </div>
                      )}

                      {canSeeDeepAi ? (
                        <>
                          {selectedAnalysis && !isCorrectAnswer && selectedAnalysis.ai_feedback_vi && (
                            <div style={{ color: 'var(--ds-danger)', fontWeight: 600 }}>
                              • Bẫy lỗi ở ({userAns}): {selectedAnalysis.ai_feedback_vi}
                            </div>
                          )}

                          {Array.isArray(ai.solving_steps_vi) && ai.solving_steps_vi.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.15rem' }}>
                              {ai.solving_steps_vi.map((step, sIdx) => (
                                <div key={sIdx} style={{ fontSize: '0.78rem', color: 'var(--ds-text-muted)' }}>
                                  {step}
                                </div>
                              ))}
                            </div>
                          )}

                          {ai.micro_rule_formula_vi && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--ds-text-muted)', borderTop: '1px dashed var(--ds-border)', paddingTop: '0.4rem', marginTop: '0.15rem' }}>
                              <strong>📐 Mẹo / Công thức:</strong> {ai.micro_rule_formula_vi}
                            </div>
                          )}
                        </>
                      ) : (
                        <div
                          style={{
                            marginTop: '0.25rem',
                            padding: '0.65rem 0.85rem',
                            borderRadius: 'var(--ds-radius-sm)',
                            border: '1px dashed var(--ds-warning)',
                            backgroundColor: 'var(--ds-card)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.5rem'
                          }}
                        >
                          <span style={{ fontSize: '0.78rem', color: 'var(--ds-text-secondary)' }}>
                            🔒 <strong>Phân tích bẫy lỗi AI &amp; Công thức xử lý nhanh</strong> cho dạng câu <em>{ai.primary_topic_name_vi || 'Đọc hiểu'}</em>
                          </span>
                          {onRequireVip && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRequireVip();
                              }}
                              className="toeic-btn toeic-btn-primary"
                              style={{ fontSize: '0.74rem', padding: '0.3rem 0.7rem', fontWeight: 700 }}
                            >
                              Mở Khóa VIP ✨
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })}

          {/* Set Bottom Navigation: Advance to Next Set */}
          {activeSetIndex < passageSets.length - 1 && (
            <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => {
                  const nextIdx = activeSetIndex + 1;
                  setActiveSetIndex(nextIdx);
                  setActiveDocTab(0);
                  if (passageSets[nextIdx]?.questions.length > 0 && onQuestionClick) {
                    onQuestionClick(passageSets[nextIdx].questions[0].id);
                  }
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                className="toeic-btn toeic-btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.6rem 1.25rem',
                  fontWeight: 800
                }}
              >
                <span>Sang Đoạn Tiếp Theo ({passageSets[activeSetIndex + 1]?.label})</span>
                <span>&rarr;</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
