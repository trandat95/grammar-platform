import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { KitIcon } from '../ui-2026/KitIcon';
import { ToeicBadge } from './ui';

/**
 * SentenceXRayCard Component (X-Ray 2.0 — Milestones MX1 to MX4)
 * 4-State Machine:
 * 1. STATE_SOLVING (Câu gốc, thẻ ngữ cảnh tách biệt, công cụ gạch loại trừ Strike-through)
 * 2. STATE_STRUCTURAL_BREAKDOWN (Thanh Quang Phổ 3 Khối, Chốt chặn học thuật, Option Inspector, Word Family, Collocations)
 * 3. STATE_RULE_FORMULA (Hộp công thức chuẩn, quy tắc sống còn, bẫy tư duy, 3 bước 10s)
 * 4. STATE_TWIN_REMEDIATION (Chuỗi 1..3 Câu hỏi sinh đôi gỡ điểm kèm giải thích X-Ray tại chỗ)
 * Strict Design Token Discipline: var(--ds-*).
 */
export const XRAY_STATES = {
  SOLVING: 'STATE_SOLVING',
  HINT_ACTIVE: 'STATE_HINT_ACTIVE',
  SUBMITTED: 'STATE_SUBMITTED_XRAY',
  STRUCTURAL_BREAKDOWN: 'STATE_STRUCTURAL_BREAKDOWN',
  RULE_FORMULA: 'STATE_RULE_FORMULA',
  TWIN_REMEDIATION: 'STATE_TWIN_REMEDIATION'
};

function cleanTokenWord(word) {
  return String(word || '')
    .replace(/^[^a-zA-Z0-9$€£¥%]+|[^a-zA-Z0-9$€£¥%]+$/g, '')
    .toLowerCase();
}

/**
 * MX1.2: Extract leading [Memo: ...] / [Doc 1 ... / Doc 2 ...] / [Part 3 Transcript: ...]
 * into a separate Context Document / Transcript Card so the main question stem stays clean.
 */
function parseContextAndStem(rawSentence) {
  const text = String(rawSentence || '').trim();
  const match = text.match(/^\[([^\]]+)\]\s*(.+)$/s);
  if (!match) {
    return { contextHeader: null, contextBody: null, mainStem: text };
  }
  const bracketContent = match[1].trim();
  const remainder = match[2].trim();
  const colonIdx = bracketContent.indexOf(':');
  if (colonIdx > 0 && colonIdx < 42) {
    return {
      contextHeader: bracketContent.slice(0, colonIdx).trim(),
      contextBody: bracketContent.slice(colonIdx + 1).trim(),
      mainStem: remainder
    };
  }
  return {
    contextHeader: 'Ngữ cảnh / Đoạn trích',
    contextBody: bracketContent,
    mainStem: remainder
  };
}

/**
 * MX1.1: Contiguous Phrase-Window Anchor Matcher around the blank token.
 * Prevents short function words ('a', 'in', 'to', 'the') far from the blank from being falsely highlighted.
 */
function findAnchorTokenIndices(tokenObjs, anchorPhrase, blankIndex, direction) {
  const matched = new Set();
  if (!anchorPhrase) return matched;

  const anchorWords = String(anchorPhrase)
    .trim()
    .split(/\s+/)
    .map(cleanTokenWord)
    .filter(Boolean);

  if (anchorWords.length === 0) return matched;

  const startBound = direction === 'left' ? 0 : Math.max(0, blankIndex + 1);
  const endBound =
    direction === 'left'
      ? blankIndex >= 0
        ? blankIndex - 1
        : tokenObjs.length - 1
      : tokenObjs.length - 1;

  if (endBound < startBound) return matched;

  // Search for contiguous window matching anchorWords (preferring closest to blankIndex)
  const candidates = [];
  for (let i = startBound; i <= endBound - anchorWords.length + 1; i++) {
    let ok = true;
    for (let j = 0; j < anchorWords.length; j++) {
      if (tokenObjs[i + j].norm !== anchorWords[j]) {
        ok = false;
        break;
      }
    }
    if (ok) {
      candidates.push(i);
    }
  }

  if (candidates.length > 0) {
    const chosenStart =
      direction === 'left' ? candidates[candidates.length - 1] : candidates[0];
    for (let j = 0; j < anchorWords.length; j++) {
      matched.add(chosenStart + j);
    }
    return matched;
  }

  // Fallback: match individual words closest to blank within a 6-token radius
  const windowStart =
    direction === 'left' ? Math.max(0, endBound - 6) : startBound;
  const windowEnd =
    direction === 'left' ? endBound : Math.min(endBound, startBound + 6);
  const anchorSet = new Set(anchorWords.filter(w => w.length > 1));
  for (let i = windowStart; i <= windowEnd; i++) {
    if (anchorSet.has(tokenObjs[i].norm)) {
      matched.add(i);
    }
  }
  return matched;
}

export default function SentenceXRayCard({
  question,
  examMode = 'practice', // 'practice' | 'exam'
  initialSelectedOption = null,
  forceReview = false,
  onAnswerSubmit,
  onSaveToSrs,
  onOpenAiTutor,
  onNextQuestion
}) {
  if (!question) return null;

  const [state, setState] = useState(
    forceReview || (examMode === 'practice' && initialSelectedOption)
      ? XRAY_STATES.SUBMITTED
      : XRAY_STATES.SOLVING
  );
  const [activeTab, setActiveTab] = useState('breakdown'); // 'breakdown' | 'formula' | 'twin'
  const [selectedOption, setSelectedOption] = useState(initialSelectedOption || null);
  const [inspectedOption, setInspectedOption] = useState(initialSelectedOption || null);
  const [eliminatedOptions, setEliminatedOptions] = useState({});
  const [timeSpentSec, setTimeSpentSec] = useState(0);
  const [usedHint, setUsedHint] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);
  const [twinQuestions, setTwinQuestions] = useState([]);
  const [activeTwinIdx, setActiveTwinIdx] = useState(0);
  const [twinAnswersByIdx, setTwinAnswersByIdx] = useState({});
  const [isLoadingTwin, setIsLoadingTwin] = useState(false);
  const [srsSavedWords, setSrsSavedWords] = useState({});

  const aiAnalysis = question.ai_analysis || {};
  const xray = aiAnalysis.sentence_xray || null;
  const recommendedTime = question.recommended_time_sec || 12;

  // Reset / sync state when question or review mode changes
  useEffect(() => {
    setSelectedOption(initialSelectedOption || null);
    setInspectedOption(initialSelectedOption || null);
    setEliminatedOptions({});
    if (forceReview || (examMode === 'practice' && initialSelectedOption)) {
      setState(XRAY_STATES.SUBMITTED);
    } else {
      setState(XRAY_STATES.SOLVING);
    }
    setActiveTab('breakdown');
    setTimeSpentSec(0);
    setUsedHint(false);
    setSelectedToken(null);
    setTwinQuestions([]);
    setActiveTwinIdx(0);
    setTwinAnswersByIdx({});
    setIsLoadingTwin(false);
  }, [question.id, forceReview, examMode]);

  // Keep selectedOption synced when initialSelectedOption updates externally
  useEffect(() => {
    if (initialSelectedOption !== undefined) {
      setSelectedOption(initialSelectedOption || null);
      setInspectedOption(initialSelectedOption || null);
    }
  }, [initialSelectedOption]);

  // Pacing Timer in SOLVING state
  useEffect(() => {
    if (forceReview || (state !== XRAY_STATES.SOLVING && state !== XRAY_STATES.HINT_ACTIVE)) return;
    const interval = setInterval(() => {
      setTimeSpentSec(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [state, forceReview]);

  // Handle Option Selection
  const handleSelectOption = useCallback((optionKey) => {
    if (forceReview) {
      setInspectedOption(optionKey);
      return;
    }
    if (examMode === 'practice' && state !== XRAY_STATES.SOLVING && state !== XRAY_STATES.HINT_ACTIVE) {
      setInspectedOption(optionKey);
      return;
    }

    setSelectedOption(optionKey);
    setInspectedOption(optionKey);
    if (examMode === 'practice') {
      setState(XRAY_STATES.SUBMITTED);
    }

    const isCorrect = optionKey === question.correct_answer;
    if (onAnswerSubmit) {
      onAnswerSubmit({
        questionId: question.id,
        selectedOption: optionKey,
        isCorrect,
        timeSpentSec,
        usedHint
      });
    }
  }, [forceReview, examMode, state, question, timeSpentSec, usedHint, onAnswerSubmit]);

  // Toggle strike-through elimination before submitting (MX3.1)
  const handleToggleEliminate = useCallback((e, optKey) => {
    e.stopPropagation();
    setEliminatedOptions(prev => ({ ...prev, [optKey]: !prev[optKey] }));
  }, []);

  // Trigger Hint
  const handleToggleHint = useCallback(() => {
    if (state === XRAY_STATES.SOLVING) {
      setUsedHint(true);
      setState(XRAY_STATES.HINT_ACTIVE);
    }
  }, [state]);

  // Trigger Twin Remediation (MX4.1: Load all 1..3 twin questions)
  const handleOpenTwinRemediation = async () => {
    setActiveTab('twin');
    if (twinQuestions.length === 0 && !isLoadingTwin) {
      setIsLoadingTwin(true);
      try {
        const res = await fetch('/api/toeic/practice/check-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId: question.id, selectedOption: selectedOption || question.correct_answer || 'A' })
        });
        const data = await res.json();
        if (Array.isArray(data.twinQuestions) && data.twinQuestions.length > 0) {
          setTwinQuestions(data.twinQuestions);
          setActiveTwinIdx(0);
        }
      } catch (e) {
        console.error('Failed to load twin questions:', e);
      } finally {
        setIsLoadingTwin(false);
      }
    }
  };

  // Keyboard Shortcuts (1-4 / A-D / H / Enter for Next)
  useEffect(() => {
    function handleKeyDown(e) {
      const key = e.key.toUpperCase();
      if (state === XRAY_STATES.SOLVING || state === XRAY_STATES.HINT_ACTIVE) {
        if (key === '1' || key === 'A') handleSelectOption('A');
        else if (key === '2' || key === 'B') handleSelectOption('B');
        else if (key === '3' || key === 'C') handleSelectOption('C');
        else if (key === '4' || key === 'D') handleSelectOption('D');
        else if (key === 'H') handleToggleHint();
      } else if (onNextQuestion && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight')) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          onNextQuestion();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, handleSelectOption, handleToggleHint, onNextQuestion]);

  // Pacing Ratio
  const pacingRatio = timeSpentSec / recommendedTime;
  let pacingColor = 'var(--ds-success)';
  if (pacingRatio > 1.0) pacingColor = 'var(--ds-warning)';
  else if (pacingRatio > 0.7) pacingColor = 'var(--ds-accent)';

  const isSubmitted = forceReview || (state !== XRAY_STATES.SOLVING && state !== XRAY_STATES.HINT_ACTIVE);
  const isCorrect = selectedOption === question.correct_answer;
  const activeInspectKey = inspectedOption || selectedOption || question.correct_answer;
  const inspectedFeedback = activeInspectKey && aiAnalysis.option_deep_analysis?.[activeInspectKey];
  const distractorWhyVi = activeInspectKey && aiAnalysis.distractor_analysis?.[activeInspectKey];

  // MX1.2: Parse optional [Context / Transcript / Doc 1 & 2] prefix from sentence
  const parsedPrompt = useMemo(() => {
    const raw = question.context_sentence || question.stem || '';
    return parseContextAndStem(raw);
  }, [question]);

  // MX1.1: Tokenize sentence with Contiguous Phrase-Window Anchor Matching
  const interactiveTokens = useMemo(() => {
    const raw = parsedPrompt.mainStem || question.context_sentence || question.stem || '';
    const words = raw.split(/\s+/).filter(Boolean);
    const baseTokens = words.map((w, idx) => {
      const cleanWord = w.replace(/^[.,/#!$%^&*;:{}=\-_`~()'"]+|[.,/#!$%^&*;:{}=\-_`~()'"]+$/g, '');
      const isBlank = w.includes('-------') || w.includes('_____');
      return {
        id: idx,
        raw: w,
        clean: cleanWord,
        norm: cleanTokenWord(w),
        isBlank
      };
    });

    const blankIdx = baseTokens.findIndex(t => t.isBlank);
    const leftAnchorIndices = findAnchorTokenIndices(
      baseTokens,
      xray?.left_anchor_words,
      blankIdx,
      'left'
    );
    const rightAnchorIndices = findAnchorTokenIndices(
      baseTokens,
      xray?.right_anchor_words,
      blankIdx,
      'right'
    );

    return baseTokens.map((tok, idx) => {
      const linked = aiAnalysis.linked_vocabulary?.find(
        v => v.word.toLowerCase() === tok.clean.toLowerCase()
      );
      const isLeftAnchor = leftAnchorIndices.has(idx);
      const isRightAnchor = rightAnchorIndices.has(idx);
      const isAnchor = isLeftAnchor || isRightAnchor;

      return {
        ...tok,
        isAnchor,
        anchorSide: isLeftAnchor ? 'left' : isRightAnchor ? 'right' : null,
        pos: linked?.pos || (tok.isBlank ? xray?.required_grammatical_role : null),
        meaning: linked?.meaning_vi || null,
        linkedData: linked
      };
    });
  }, [parsedPrompt, question, aiAnalysis, xray]);

  // Render Context Card + Prompt Sentence
  const renderPromptSentence = () => {
    const contextCard = parsedPrompt.contextBody ? (
      <div className="toeic-xray-context-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ds-accent)' }}>
            <KitIcon name="books" size={13} />
            <span>{parsedPrompt.contextHeader}</span>
          </span>
          {isSubmitted && xray?.left_anchor_words && parsedPrompt.contextBody.includes(xray.left_anchor_words) && (
            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.12rem 0.45rem', borderRadius: '999px', backgroundColor: 'var(--ds-warning-bg)', color: 'var(--ds-warning)', border: '1px solid var(--ds-warning-border)' }}>
              Bằng chứng: &ldquo;{xray.left_anchor_words}&rdquo;
            </span>
          )}
        </div>
        <div style={{ color: 'var(--ds-text)', fontWeight: 500 }}>
          {parsedPrompt.contextBody}
        </div>
      </div>
    ) : null;

    if (!isSubmitted) {
      const rawSentence = parsedPrompt.mainStem || question.context_sentence || question.stem || '';
      if (!rawSentence.includes('-------') && !rawSentence.includes('_____')) {
        return (
          <>
            {contextCard}
            <span>{rawSentence}</span>
          </>
        );
      }
      const parts = rawSentence.split(/-------|_____/);
      return (
        <>
          {contextCard}
          <span style={{ lineHeight: 1.65 }}>
            {parts[0]}
            {state === XRAY_STATES.HINT_ACTIVE && xray ? (
              <span
                style={{
                  display: 'inline-block',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '0.35rem',
                  border: '1.5px dashed var(--ds-accent)',
                  backgroundColor: 'var(--ds-accent-bg)',
                  color: 'var(--ds-accent)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  margin: '0 0.35rem'
                }}
              >
                [ Cần: {xray.required_grammatical_role || '?'} ]
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-block',
                  padding: '0.15rem 0.75rem',
                  borderRadius: '0.35rem',
                  border: '1px solid var(--ds-border)',
                  backgroundColor: 'var(--ds-bg-elevated)',
                  color: 'var(--ds-text-muted)',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  margin: '0 0.35rem'
                }}
              >
                [ &nbsp; ? &nbsp; ]
              </span>
            )}
            {parts[1]}
          </span>
        </>
      );
    }

    // When submitted: Interactive POS Token Stream with exact left/right phrase anchors
    return (
      <>
        {contextCard}
        <div className="toeic-xray-sentence-stream">
          {interactiveTokens.map(tok => {
            if (tok.isBlank) {
              const correctWord = question.options?.[question.correct_answer] || '';
              return (
                <span
                  key={tok.id}
                  style={{
                    display: 'inline-block',
                    padding: '0.08rem 0.5rem',
                    borderRadius: '0.35rem',
                    backgroundColor: isCorrect ? 'var(--ds-success-bg)' : 'var(--ds-accent-bg)',
                    border: `1.5px solid ${isCorrect ? 'var(--ds-success)' : 'var(--ds-accent)'}`,
                    color: isCorrect ? 'var(--ds-success)' : 'var(--ds-accent)',
                    fontWeight: 800,
                    lineHeight: 1.35,
                    margin: '0 0.2rem'
                  }}
                >
                  {correctWord}
                </span>
              );
            }

            const isSelected = selectedToken?.id === tok.id;
            const anchorClass =
              tok.anchorSide === 'left'
                ? 'is-anchor is-left-anchor'
                : tok.anchorSide === 'right'
                  ? 'is-anchor is-right-anchor'
                  : '';

            return (
              <span
                key={tok.id}
                onClick={() => setSelectedToken(isSelected ? null : tok)}
                className={`toeic-pos-token ${anchorClass} ${isSelected ? 'active' : ''}`}
                title={
                  tok.anchorSide === 'left'
                    ? 'Từ neo phía trước (Left Anchor) — Click để xem chi tiết'
                    : tok.anchorSide === 'right'
                      ? 'Từ neo phía sau (Right Anchor) — Click để xem chi tiết'
                      : 'Click để xem phân tích từ loại & cấu trúc'
                }
              >
                <span
                  style={{
                    fontWeight: tok.isAnchor ? 800 : 500,
                    color:
                      tok.anchorSide === 'left'
                        ? 'var(--ds-warning)'
                        : tok.anchorSide === 'right'
                          ? 'var(--ds-accent)'
                          : 'inherit'
                  }}
                >
                  {tok.raw}
                </span>
                {tok.pos && (
                  <span className="toeic-pos-tag">
                    {tok.pos}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </>
    );
  };

  const currentTwin = twinQuestions[activeTwinIdx] || null;
  const currentTwinAnswer = currentTwin ? twinAnswersByIdx[activeTwinIdx] || null : null;

  return (
    <div className="toeic-card toeic-xray-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
      {/* 1. TOP HEADER & PACING TIMER */}
      <div className="toeic-flex-between toeic-xray-card-header" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--ds-border)', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <ToeicBadge variant="muted">
            Part {question.part} • #{question.number || 101}
          </ToeicBadge>
          <span className="ge-hide-mobile" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <ToeicBadge variant="primary">
              {aiAnalysis.primary_topic_name_vi || question.primary_grammar_topic_id}
            </ToeicBadge>
            <span style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)', fontWeight: 600 }}>
              Band {question.target_score_band || 500}+
            </span>
          </span>
        </div>

        {/* Pacing Timer & Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.55rem',
              borderRadius: '9999px',
              border: `1px solid ${pacingColor}`,
              color: pacingColor,
              fontSize: '0.74rem',
              fontWeight: 700,
              whiteSpace: 'nowrap'
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
              <KitIcon name="timer" size={13} />
              <span>{timeSpentSec}s</span>
            </span>
            <span className="ge-hide-mobile" style={{ fontSize: '0.65rem', color: 'var(--ds-text-muted)' }}>
              /{recommendedTime}s
            </span>
          </div>

          {!isSubmitted && (
            <button
              type="button"
              onClick={handleToggleHint}
              disabled={state === XRAY_STATES.HINT_ACTIVE}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.28rem 0.6rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--ds-border)',
                backgroundColor: state === XRAY_STATES.HINT_ACTIVE ? 'var(--ds-accent-bg)' : 'transparent',
                color: 'var(--ds-accent)',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <KitIcon name="bulb" size={13} />
              <span>Gợi ý<span className="ge-hide-mobile"> X-Ray (H)</span></span>
            </button>
          )}

          {onOpenAiTutor && (
            <button
              type="button"
              onClick={() => onOpenAiTutor(question, selectedOption)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.28rem 0.6rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--ds-border)',
                backgroundColor: 'var(--ds-bg-elevated)',
                color: 'var(--ds-text)',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <KitIcon name="bot" size={13} color="var(--ds-accent)" />
              <span>AI<span className="ge-hide-mobile"> Gia Sư</span></span>
            </button>
          )}
        </div>
      </div>

      {/* 2. HINT BANNER (When Hint Active) */}
      {state === XRAY_STATES.HINT_ACTIVE && xray && (
        <div className="toeic-formula-box trap" style={{ margin: '0 0 1.25rem 0' }}>
          <div className="toeic-formula-title" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <KitIcon name="search" size={14} />
            <span>GỢI Ý QUANG PHỔ CÂU (SENTENCE X-RAY):</span>
          </div>
          <div style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
            <div>
              Neo trước: <strong>{xray.left_anchor_words || 'N/A'}</strong> • Neo sau: <strong>{xray.right_anchor_words || 'N/A'}</strong>
            </div>
            <div>
              Vị trí ô trống cần: <strong style={{ color: 'var(--ds-accent)' }}>{xray.required_grammatical_role}</strong>
            </div>
          </div>
        </div>
      )}

      {/* 3. PROMPT SENTENCE & CONTEXT CARD */}
      <div className="toeic-xray-prompt-wrap" style={{ margin: '0.75rem 0 1.25rem 0', fontWeight: 500 }}>
        {renderPromptSentence()}
      </div>

      {/* 4. INTERACTIVE TOKEN DETAILS POPOVER (AC-U4.2) */}
      {selectedToken && (
        <div className="toeic-pos-popover" style={{ marginBottom: '1.25rem' }}>
          <div className="toeic-flex-between" style={{ marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ds-text)' }}>
                {selectedToken.clean}
              </span>
              {selectedToken.pos && (
                <ToeicBadge variant="primary">{selectedToken.pos}</ToeicBadge>
              )}
              {selectedToken.anchorSide === 'left' && (
                <ToeicBadge variant="warning">Neo Trái (Left Anchor)</ToeicBadge>
              )}
              {selectedToken.anchorSide === 'right' && (
                <ToeicBadge variant="primary">Neo Phải (Right Anchor)</ToeicBadge>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelectedToken(null)}
              style={{ background: 'none', border: 'none', color: 'var(--ds-text-muted)', cursor: 'pointer', fontSize: '1rem' }}
            >
              ✕
            </button>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--ds-text-secondary)', lineHeight: 1.5 }}>
            <div>
              <strong>Vai trò trong câu:</strong>{' '}
              {selectedToken.anchorSide
                ? `Từ khóa neo (${selectedToken.anchorSide === 'left' ? 'phía trước' : 'phía sau'} chỗ trống) quyết định trực tiếp việc chọn "${question.options?.[question.correct_answer]}"`
                : selectedToken.pos
                  ? `Bổ nghĩa / Thành phần ${selectedToken.pos}`
                  : 'Thành phần ngữ pháp trong mệnh đề'}
            </div>
            {selectedToken.meaning && (
              <div>
                <strong>Nghĩa ngữ cảnh:</strong> {selectedToken.meaning}
              </div>
            )}
          </div>

          {selectedToken.linkedData && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--ds-border-subtle)' }}>
              <button
                type="button"
                onClick={() => {
                  setSrsSavedWords(prev => ({ ...prev, [selectedToken.clean]: true }));
                  if (onSaveToSrs) onSaveToSrs({ type: 'VOCABULARY', word: selectedToken.clean, data: selectedToken.linkedData });
                }}
                disabled={!!srsSavedWords[selectedToken.clean]}
                className="toeic-btn toeic-btn-sm toeic-btn-outline"
              >
                {srsSavedWords[selectedToken.clean] ? '✓ Đã lưu vào Sổ tay SRS' : '+ Lưu từ này vào Sổ tay SRS'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5. 4 OPTIONS (A, B, C, D) WITH STRIKE-THROUGH & POST-SUBMISSION INSPECTOR (MX3) */}
      <div className="toeic-grid-2 toeic-xray-options-grid" style={{ gap: '0.75rem', marginBottom: '1.25rem' }}>
        {(['A', 'B', 'C', 'D']).map(optKey => {
          const optText = question.options?.[optKey];
          if (!optText) return null;

          const isSelected = selectedOption === optKey;
          const isInspected = isSubmitted && activeInspectKey === optKey;
          const isEliminated = !isSubmitted && !!eliminatedOptions[optKey];
          const isCorrectAnswer = optKey === question.correct_answer;
          const optAnalysis = aiAnalysis.option_deep_analysis?.[optKey];

          let btnBg = 'var(--ds-card)';
          let btnBorder = 'var(--ds-border)';
          let badgeBg = 'var(--ds-bg-elevated)';
          let badgeColor = 'var(--ds-text)';

          if (isSubmitted) {
            if (isCorrectAnswer) {
              btnBg = 'var(--ds-success-bg)';
              btnBorder = 'var(--ds-success)';
              badgeBg = 'var(--ds-success)';
              badgeColor = 'var(--ds-text-on-accent)';
            } else if (isSelected && !isCorrectAnswer) {
              btnBg = 'var(--ds-danger-bg)';
              btnBorder = 'var(--ds-danger)';
              badgeBg = 'var(--ds-danger)';
              badgeColor = 'var(--ds-text-on-accent)';
            }
          } else if (isSelected) {
            btnBg = 'var(--ds-accent-bg)';
            btnBorder = 'var(--ds-accent)';
            badgeBg = 'var(--ds-accent)';
            badgeColor = 'var(--ds-text-on-accent)';
          }

          return (
            <div key={optKey} className="toeic-xray-option-wrap">
              {!isSubmitted && (
                <button
                  type="button"
                  onClick={(e) => handleToggleEliminate(e, optKey)}
                  className={`toeic-xray-eliminate-toggle ${isEliminated ? 'active' : ''}`}
                  title={isEliminated ? 'Bỏ gạch loại trừ phương án này' : 'Gạch loại trừ phương án nhiễu này'}
                  aria-label={`Loại trừ đáp án ${optKey}`}
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                className={`toeic-xray-option-btn ${isEliminated ? 'is-eliminated' : ''} ${isInspected ? 'is-inspected' : ''}`}
                onClick={() => handleSelectOption(optKey)}
                title={isSubmitted ? `Bấm để soi phân tích chi tiết phương án (${optKey})` : undefined}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  paddingRight: !isSubmitted ? '2.25rem' : '1rem',
                  borderRadius: '0.75rem',
                  border: `1.5px solid ${btnBorder}`,
                  backgroundColor: btnBg,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  width: '100%'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      backgroundColor: badgeBg,
                      color: badgeColor,
                      flexShrink: 0
                    }}
                  >
                    {optKey}
                  </span>
                  <span className="toeic-xray-option-text" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ds-text)' }}>
                    {optText}
                  </span>
                </div>

                {isSubmitted && optAnalysis && (
                  <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--ds-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', color: 'var(--ds-text-muted)', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'monospace' }}>{optAnalysis.pos_or_role || 'Từ loại N/A'}</span>
                    {isCorrectAnswer ? (
                      <span style={{ fontWeight: 800, color: 'var(--ds-success)' }}>✓ Đáp án đúng</span>
                    ) : isSelected ? (
                      <span style={{ fontWeight: 700, color: 'var(--ds-danger)' }}>✗ Bạn đã chọn</span>
                    ) : (
                      <span style={{ fontWeight: 600, color: isInspected ? 'var(--ds-accent)' : 'var(--ds-text-muted)' }}>
                        {isInspected ? '● Đang soi lỗi' : 'Bấm để soi bẫy'}
                      </span>
                    )}
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* QUICK NEXT STRIP (Within Immediate Reach / Cùng Tầm Với) */}
      {isSubmitted && onNextQuestion && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--ds-radius-md)',
            backgroundColor: 'var(--ds-bg-elevated)',
            border: '1.5px solid var(--ds-accent)',
            marginBottom: '1.25rem',
            boxShadow: 'var(--ds-shadow-sm)',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-flex', color: isCorrect ? 'var(--ds-success)' : 'var(--ds-accent)' }}>
              <KitIcon name={isCorrect ? 'check-circle' : 'bulb'} size={18} />
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ds-text)' }}>
              {isCorrect ? 'Chính xác!' : `Đáp án đúng là (${question.correct_answer}).`}
              <span style={{ fontWeight: 500, color: 'var(--ds-text-secondary)', marginLeft: '0.35rem' }}>
                Bấm vào từng phương án A/B/C/D để soi bẫy hoặc bấm Next sang câu mới.
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={onNextQuestion}
            className="toeic-btn toeic-btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 1.15rem',
              fontSize: '0.85rem',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              marginLeft: 'auto'
            }}
          >
            <span>Câu Tiếp Theo &rarr;</span>
            <kbd className="ge-hide-mobile" style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', borderRadius: '4px', backgroundColor: 'var(--ds-bg-elevated)', color: 'var(--ds-accent)' }}>Enter ↵</kbd>
          </button>
        </div>
      )}

      {/* 6. POST-SUBMISSION 4-STATE PEDAGOGICAL WORKSPACE (X-Ray 2.0) */}
      {isSubmitted && (
        <div style={{ borderTop: '1px solid var(--ds-border)', paddingTop: '1.25rem' }}>
          {/* Navigation Tabs for X-Ray Analysis */}
          <div className="toeic-h-scroll-strip" style={{ marginBottom: '1.15rem' }}>
            <button
              type="button"
              onClick={() => setActiveTab('breakdown')}
              className={`toeic-target-chip ${activeTab === 'breakdown' ? 'active' : ''}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', padding: '0.38rem 0.75rem' }}
            >
              <KitIcon name="ruler" size={13} />
              <span>Bóc Tách Cấu Trúc <span className="ge-hide-mobile">(State 2)</span></span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('formula')}
              className={`toeic-target-chip ${activeTab === 'formula' ? 'active' : ''}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', padding: '0.38rem 0.75rem' }}
            >
              <KitIcon name="bolt" size={13} />
              <span>Quy Tắc &amp; Công Thức <span className="ge-hide-mobile">(State 3)</span></span>
            </button>
            <button
              type="button"
              onClick={handleOpenTwinRemediation}
              className={`toeic-target-chip ${activeTab === 'twin' ? 'active' : ''}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', padding: '0.38rem 0.75rem' }}
            >
              <KitIcon name="target" size={13} />
              <span>Câu Sinh Đôi <span className="ge-hide-mobile">Twin-Questions (State 4)</span></span>
            </button>
          </div>

          {/* TAB 1: STRUCTURAL BREAKDOWN (MX2 + MX3) */}
          {activeTab === 'breakdown' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* MX2.1: 3-BLOCK VISUAL X-RAY SPECTRUM BAR */}
              {xray && (
                <div className="toeic-xray-spectrum-bar">
                  <div className="toeic-xray-spectrum-node left-anchor">
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ds-warning)', marginBottom: '0.18rem' }}>
                      1. Từ Neo Phía Trước
                    </span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--ds-text)', wordBreak: 'break-word' }}>
                      {xray.left_anchor_words ? `“${xray.left_anchor_words}”` : '(Đầu câu)'}
                    </span>
                  </div>

                  <div className="toeic-xray-spectrum-arrow">&rarr;</div>

                  <div className="toeic-xray-spectrum-node target-slot">
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ds-success)', marginBottom: '0.18rem' }}>
                      2. Chốt Chặn Cần Điền ({question.correct_answer})
                    </span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--ds-success)' }}>
                      {question.options?.[question.correct_answer]}
                    </span>
                    <span style={{ fontSize: '0.73rem', fontWeight: 600, color: 'var(--ds-text-secondary)', marginTop: '0.1rem' }}>
                      {xray.required_grammatical_role}
                    </span>
                  </div>

                  <div className="toeic-xray-spectrum-arrow">&larr;</div>

                  <div className="toeic-xray-spectrum-node right-anchor">
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ds-accent)', marginBottom: '0.18rem' }}>
                      3. Từ Neo Phía Sau
                    </span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--ds-text)', wordBreak: 'break-word' }}>
                      {xray.right_anchor_words ? `“${xray.right_anchor_words}”` : '(Cuối câu)'}
                    </span>
                  </div>
                </div>
              )}

              {/* MX2.2: UNLOCK ACADEMIC EXPLANATION (explanation_vi) FOR BOTH CORRECT & WRONG ANSWERS */}
              {aiAnalysis.explanation_vi && (
                <div className="toeic-formula-box standard">
                  <div className="toeic-formula-title" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <KitIcon name="check-circle" size={14} />
                    <span>CHỐT CHẶN NGỮ PHÁP &amp; LỜI GIẢI HỌC THUẬT:</span>
                    {aiAnalysis.key_clue && (
                      <ToeicBadge variant="primary">{aiAnalysis.key_clue}</ToeicBadge>
                    )}
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--ds-text)', margin: '0.35rem 0 0 0', lineHeight: 1.55 }}>
                    {aiAnalysis.explanation_vi}
                  </p>
                </div>
              )}

              {/* MX3.2: INTERACTIVE OPTION INSPECTOR (Click any option A/B/C/D above to inspect why it's right or wrong) */}
              {inspectedFeedback && (
                <div className={`toeic-formula-box ${inspectedFeedback.is_correct ? 'tip' : 'critical'}`}>
                  <div className="toeic-formula-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <KitIcon name={inspectedFeedback.is_correct ? 'check-circle' : 'warning'} size={14} />
                      <span>
                        SOI PHƯƠNG ÁN ({activeInspectKey}) &ldquo;{inspectedFeedback.text}&rdquo;:
                      </span>
                      {!inspectedFeedback.is_correct && inspectedFeedback.error_pattern_name_vi && (
                        <ToeicBadge variant="danger">{inspectedFeedback.error_pattern_name_vi}</ToeicBadge>
                      )}
                    </div>
                    <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                      {(['A', 'B', 'C', 'D']).map(k => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setInspectedOption(k)}
                          style={{
                            padding: '0.15rem 0.45rem',
                            borderRadius: '0.35rem',
                            border: `1px solid ${activeInspectKey === k ? 'var(--ds-accent)' : 'var(--ds-border)'}`,
                            backgroundColor: activeInspectKey === k ? 'var(--ds-accent)' : 'var(--ds-card)',
                            color: activeInspectKey === k ? 'var(--ds-text-on-accent)' : 'var(--ds-text-secondary)',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--ds-text)', margin: '0.35rem 0 0 0', lineHeight: 1.5 }}>
                    {inspectedFeedback.ai_feedback_vi || distractorWhyVi}
                  </p>
                </div>
              )}

              {/* Word Family Matrix */}
              {aiAnalysis.word_family_matrix?.length > 0 && (
                <div style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--ds-border)', backgroundColor: 'var(--ds-card)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ds-text)', marginBottom: '0.75rem' }}>
                    <KitIcon name="books" size={14} color="var(--ds-accent)" />
                    <span>Bảng Họ Từ Loại (Word Family Matrix — Bấm để soi từng phương án):</span>
                  </div>
                  <div className="toeic-grid-4" style={{ gap: '0.5rem' }}>
                    {aiAnalysis.word_family_matrix.map((wf, idx) => {
                      const isWfInspected = activeInspectKey === wf.option;
                      return (
                        <div
                          key={idx}
                          onClick={() => setInspectedOption(wf.option)}
                          style={{
                            padding: '0.65rem',
                            borderRadius: '0.5rem',
                            border: `1.5px solid ${
                              wf.is_correct
                                ? 'var(--ds-success)'
                                : isWfInspected
                                  ? 'var(--ds-accent)'
                                  : 'var(--ds-border)'
                            }`,
                            backgroundColor: wf.is_correct
                              ? 'var(--ds-success-bg)'
                              : isWfInspected
                                ? 'var(--ds-accent-bg)'
                                : 'var(--ds-bg-elevated)',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ fontWeight: 700, color: 'var(--ds-text)' }}>
                            ({wf.option}) {wf.word}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--ds-text-muted)' }}>
                            {wf.grammatical_role}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MX2.3: UNLOCK COLLOCATION HIGHLIGHTS & LINKED VOCABULARY STRIP (+1-Click SRS Save) */}
              {(aiAnalysis.collocation_highlights?.length > 0 || aiAnalysis.linked_vocabulary?.length > 0) && (
                <div style={{ padding: '0.9rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--ds-border)', backgroundColor: 'var(--ds-bg-elevated)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ds-accent)' }}>
                    <KitIcon name="bulb" size={14} />
                    <span>Cụm Từ Thương Mại Ăn Điểm (Collocations) &amp; Từ Vựng Học Thuật:</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {(aiAnalysis.collocation_highlights || []).map((col, cIdx) => {
                      const colKey = `col_${cIdx}_${col}`;
                      return (
                        <div
                          key={colKey}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '0.5rem',
                            backgroundColor: 'var(--ds-card)',
                            border: '1px solid var(--ds-border)',
                            fontSize: '0.8rem'
                          }}
                        >
                          <span style={{ fontWeight: 700, color: 'var(--ds-text)' }}>{col}</span>
                          {onSaveToSrs && (
                            <button
                              type="button"
                              disabled={!!srsSavedWords[colKey]}
                              onClick={() => {
                                setSrsSavedWords(prev => ({ ...prev, [colKey]: true }));
                                onSaveToSrs({ type: 'COLLOCATION', word: col, data: { collocation: col, questionId: question.id } });
                              }}
                              style={{
                                border: 'none',
                                background: 'var(--ds-accent-bg)',
                                color: 'var(--ds-accent)',
                                borderRadius: '0.3rem',
                                padding: '0.12rem 0.4rem',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              {srsSavedWords[colKey] ? '✓ Đã lưu' : '+ SRS'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {(aiAnalysis.linked_vocabulary || []).map((voc, vIdx) => {
                      const vocKey = `voc_${vIdx}_${voc.word}`;
                      return (
                        <div
                          key={vocKey}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '0.5rem',
                            backgroundColor: 'var(--ds-card)',
                            border: '1px solid var(--ds-border)',
                            fontSize: '0.8rem'
                          }}
                        >
                          <span>
                            <strong style={{ color: 'var(--ds-text)' }}>{voc.word}</strong>{' '}
                            <span style={{ color: 'var(--ds-text-muted)' }}>({voc.pos})</span>: {voc.meaning_vi}
                          </span>
                          {onSaveToSrs && (
                            <button
                              type="button"
                              disabled={!!srsSavedWords[vocKey]}
                              onClick={() => {
                                setSrsSavedWords(prev => ({ ...prev, [vocKey]: true }));
                                onSaveToSrs({ type: 'VOCABULARY', word: voc.word, data: voc });
                              }}
                              style={{
                                border: 'none',
                                background: 'var(--ds-accent-bg)',
                                color: 'var(--ds-accent)',
                                borderRadius: '0.3rem',
                                padding: '0.12rem 0.4rem',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              {srsSavedWords[vocKey] ? '✓ Đã lưu' : '+ SRS'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RULE & FORMULA BOX VARIANTS (State 3 / AC-U4.3) */}
          {activeTab === 'formula' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Standard Formula */}
              {aiAnalysis.micro_rule_formula_vi && (
                <div className="toeic-formula-box standard">
                  <div className="toeic-formula-title" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <KitIcon name="bolt" size={14} />
                    <span>CÔNG THỨC NGỮ PHÁP CHUẨN:</span>
                  </div>
                  <div className="toeic-formula-text">
                    {aiAnalysis.micro_rule_formula_vi}
                  </div>
                </div>
              )}

              {/* Trap Alert */}
              {aiAnalysis.common_traps_vi && (
                <div className="toeic-formula-box trap">
                  <div className="toeic-formula-title" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <KitIcon name="warning" size={14} />
                    <span>BẪY NHẬN THỨC THƯỜNG GẶP:</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--ds-text)', lineHeight: 1.5 }}>
                    {aiAnalysis.common_traps_vi}
                  </div>
                </div>
              )}

              {/* 3 Solving Steps */}
              {aiAnalysis.solving_steps_vi?.length > 0 && (
                <div className="toeic-formula-box tip">
                  <div className="toeic-formula-title" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <KitIcon name="bulb" size={14} />
                    <span>3 BƯỚC GIẢI NHANH 10 GIÂY:</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
                    {aiAnalysis.solving_steps_vi.map((step, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 800, color: 'var(--ds-success)' }}>{idx + 1}.</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MULTI-TWIN QUESTIONS REMEDIATION CAROUSEL (MX4) */}
          {activeTab === 'twin' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {currentTwin ? (
                <div className="toeic-card" style={{ border: '1.5px solid var(--ds-warning-border)', backgroundColor: 'var(--ds-warning-bg)' }}>
                  <div className="toeic-flex-between" style={{ marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <ToeicBadge variant="warning" icon="target">
                        Câu Sinh Đôi #{activeTwinIdx + 1}/{twinQuestions.length}
                      </ToeicBadge>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)', fontWeight: 700 }}>
                        #{currentTwin.id}
                      </span>
                    </div>

                    {twinQuestions.length > 1 && (
                      <div style={{ display: 'inline-flex', gap: '0.3rem' }}>
                        {twinQuestions.map((tq, tIdx) => {
                          const answeredThis = twinAnswersByIdx[tIdx];
                          const isThisRight = answeredThis && answeredThis === tq.correct_answer;
                          return (
                            <button
                              key={tq.id || tIdx}
                              type="button"
                              onClick={() => setActiveTwinIdx(tIdx)}
                              style={{
                                padding: '0.2rem 0.55rem',
                                borderRadius: '0.4rem',
                                border: `1px solid ${activeTwinIdx === tIdx ? 'var(--ds-accent)' : 'var(--ds-border)'}`,
                                backgroundColor:
                                  activeTwinIdx === tIdx
                                    ? 'var(--ds-accent)'
                                    : answeredThis
                                      ? isThisRight
                                        ? 'var(--ds-success-bg)'
                                        : 'var(--ds-danger-bg)'
                                      : 'var(--ds-card)',
                                color:
                                  activeTwinIdx === tIdx
                                    ? 'var(--ds-text-on-accent)'
                                    : 'var(--ds-text)',
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              Câu {tIdx + 1}
                              {answeredThis ? (isThisRight ? ' ✓' : ' ✗') : ''}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ds-text)', marginBottom: '1rem', lineHeight: 1.55 }}>
                    {currentTwin.context_sentence || currentTwin.stem}
                  </div>

                  <div className="toeic-grid-2" style={{ gap: '0.5rem', marginBottom: '1rem' }}>
                    {(['A', 'B', 'C', 'D']).map(tOpt => {
                      const tText = currentTwin.options?.[tOpt];
                      if (!tText) return null;

                      const isTwinSelected = currentTwinAnswer === tOpt;
                      const isTwinCorrect = tOpt === currentTwin.correct_answer;

                      let tBg = 'var(--ds-card)';
                      let tBorder = 'var(--ds-border)';
                      if (currentTwinAnswer) {
                        if (isTwinCorrect) {
                          tBg = 'var(--ds-success-bg)';
                          tBorder = 'var(--ds-success)';
                        } else if (isTwinSelected) {
                          tBg = 'var(--ds-danger-bg)';
                          tBorder = 'var(--ds-danger)';
                        }
                      }

                      return (
                        <button
                          key={tOpt}
                          type="button"
                          disabled={!!currentTwinAnswer}
                          onClick={() =>
                            setTwinAnswersByIdx(prev => ({ ...prev, [activeTwinIdx]: tOpt }))
                          }
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '0.5rem',
                            border: `1.5px solid ${tBorder}`,
                            backgroundColor: tBg,
                            color: 'var(--ds-text)',
                            fontSize: '0.85rem',
                            cursor: currentTwinAnswer ? 'default' : 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <span style={{ fontWeight: 800 }}>({tOpt})</span>
                          <span style={{ fontWeight: 600 }}>{tText}</span>
                        </button>
                      );
                    })}
                  </div>

                  {currentTwinAnswer && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.55rem',
                        padding: '0.85rem 1rem',
                        borderRadius: '0.65rem',
                        fontSize: '0.85rem',
                        backgroundColor: 'var(--ds-card)',
                        border: `1.5px solid ${
                          currentTwinAnswer === currentTwin.correct_answer
                            ? 'var(--ds-success)'
                            : 'var(--ds-danger)'
                        }`
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontWeight: 800,
                            color:
                              currentTwinAnswer === currentTwin.correct_answer
                                ? 'var(--ds-success)'
                                : 'var(--ds-danger)'
                          }}
                        >
                          {currentTwinAnswer === currentTwin.correct_answer
                            ? '✓ Xuất sắc! Bạn đã gỡ điểm thành công ở câu sinh đôi này!'
                            : `✗ Đáp án đúng là (${currentTwin.correct_answer}) "${currentTwin.options?.[currentTwin.correct_answer]}".`}
                        </span>

                        {activeTwinIdx + 1 < twinQuestions.length && (
                          <button
                            type="button"
                            onClick={() => setActiveTwinIdx(activeTwinIdx + 1)}
                            className="toeic-btn toeic-btn-sm toeic-btn-primary"
                            style={{ padding: '0.3rem 0.75rem', fontSize: '0.76rem', fontWeight: 800 }}
                          >
                            Luyện tiếp Câu sinh đôi #{activeTwinIdx + 2} &rarr;
                          </button>
                        )}
                      </div>

                      {currentTwin.ai_analysis?.key_clue && (
                        <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--ds-accent)', fontWeight: 700 }}>
                          Từ khóa X-Ray: {currentTwin.ai_analysis.key_clue}
                        </div>
                      )}

                      {currentTwin.ai_analysis?.explanation_vi && (
                        <div style={{ color: 'var(--ds-text-secondary)', lineHeight: 1.5 }}>
                          {currentTwin.ai_analysis.explanation_vi}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--ds-text-muted)', fontSize: '0.85rem' }}>
                  {isLoadingTwin
                    ? 'Đang tải chuỗi câu hỏi sinh đôi cùng chủ điểm...'
                    : 'Không tìm thấy câu hỏi sinh đôi cho câu này.'}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
