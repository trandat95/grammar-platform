import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ToeicBadge, ToeicButton } from './ui';

/**
 * SentenceXRayCard Component (Milestone U4 / AC-U4.1 - AC-U4.4)
 * 4-State Machine:
 * 1. STATE_SOLVING (Câu gốc & lựa chọn)
 * 2. STATE_STRUCTURAL_BREAKDOWN (Bóc tách cấu trúc câu Subject, Verb, Object, Modifiers)
 * 3. STATE_RULE_FORMULA (Hộp công thức chuẩn, quy tắc sống còn, bẫy tư duy)
 * 4. STATE_TWIN_REMEDIATION (Câu hỏi sinh đôi gỡ điểm & nâng cao)
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

export default function SentenceXRayCard({
  question,
  onAnswerSubmit,
  onSaveToSrs,
  onOpenAiTutor
}) {
  if (!question) return null;

  const [state, setState] = useState(XRAY_STATES.SOLVING);
  const [activeTab, setActiveTab] = useState('breakdown'); // 'breakdown' | 'formula' | 'twin'
  const [selectedOption, setSelectedOption] = useState(null);
  const [timeSpentSec, setTimeSpentSec] = useState(0);
  const [usedHint, setUsedHint] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);
  const [twinQuestion, setTwinQuestion] = useState(null);
  const [twinAnswered, setTwinAnswered] = useState(null);
  const [srsSavedWords, setSrsSavedWords] = useState({});

  const aiAnalysis = question.ai_analysis || {};
  const xray = aiAnalysis.sentence_xray || null;
  const recommendedTime = question.recommended_time_sec || 12;

  // Reset state when question changes
  useEffect(() => {
    setState(XRAY_STATES.SOLVING);
    setActiveTab('breakdown');
    setSelectedOption(null);
    setTimeSpentSec(0);
    setUsedHint(false);
    setSelectedToken(null);
    setTwinQuestion(null);
    setTwinAnswered(null);
  }, [question.id]);

  // Pacing Timer in SOLVING state
  useEffect(() => {
    if (state !== XRAY_STATES.SOLVING && state !== XRAY_STATES.HINT_ACTIVE) return;
    const interval = setInterval(() => {
      setTimeSpentSec(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [state]);

  // Handle Option Selection
  const handleSelectOption = useCallback((optionKey) => {
    if (state !== XRAY_STATES.SOLVING && state !== XRAY_STATES.HINT_ACTIVE) return;
    setSelectedOption(optionKey);
    setState(XRAY_STATES.SUBMITTED);

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
  }, [state, question, timeSpentSec, usedHint, onAnswerSubmit]);

  // Trigger Hint
  const handleToggleHint = useCallback(() => {
    if (state === XRAY_STATES.SOLVING) {
      setUsedHint(true);
      setState(XRAY_STATES.HINT_ACTIVE);
    }
  }, [state]);

  // Trigger Twin Remediation
  const handleOpenTwinRemediation = async () => {
    setActiveTab('twin');
    if (!twinQuestion && aiAnalysis.similar_question_ids?.length > 0) {
      try {
        const res = await fetch('/api/toeic/practice/check-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId: question.id, selectedOption: selectedOption || 'A' })
        });
        const data = await res.json();
        if (data.twinQuestions && data.twinQuestions.length > 0) {
          setTwinQuestion(data.twinQuestions[0]);
        }
      } catch (e) {
        console.error('Failed to load twin question:', e);
      }
    }
  };

  // Keyboard Shortcuts (1-4 / A-D / H)
  useEffect(() => {
    function handleKeyDown(e) {
      const key = e.key.toUpperCase();
      if (state === XRAY_STATES.SOLVING || state === XRAY_STATES.HINT_ACTIVE) {
        if (key === '1' || key === 'A') handleSelectOption('A');
        else if (key === '2' || key === 'B') handleSelectOption('B');
        else if (key === '3' || key === 'C') handleSelectOption('C');
        else if (key === '4' || key === 'D') handleSelectOption('D');
        else if (key === 'H') handleToggleHint();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, handleSelectOption, handleToggleHint]);

  // Pacing Ratio
  const pacingRatio = timeSpentSec / recommendedTime;
  let pacingColor = 'var(--ds-success)';
  if (pacingRatio > 1.0) pacingColor = 'var(--ds-warning)';
  else if (pacingRatio > 0.7) pacingColor = 'var(--ds-accent)';

  const isSubmitted = state !== XRAY_STATES.SOLVING && state !== XRAY_STATES.HINT_ACTIVE;
  const isCorrect = selectedOption === question.correct_answer;
  const selectedFeedback = selectedOption && aiAnalysis.option_deep_analysis?.[selectedOption];

  // Tokenize context sentence for Part-of-Speech Interactive Analysis (AC-U4.2)
  const interactiveTokens = useMemo(() => {
    const raw = question.context_sentence || question.stem || '';
    const words = raw.split(/\s+/);
    return words.map((w, idx) => {
      const cleanWord = w.replace(/^[.,/#!$%^&*;:{}=\-_`~()]+|[.,/#!$%^&*;:{}=\-_`~()]+$/g, '');
      const isBlank = w.includes('-------') || w.includes('_____');
      // Match with linked vocabulary or word family if available
      const linked = aiAnalysis.linked_vocabulary?.find(
        v => v.word.toLowerCase() === cleanWord.toLowerCase()
      );
      const isAnchor =
        (xray?.left_anchor_words && xray.left_anchor_words.includes(cleanWord)) ||
        (xray?.right_anchor_words && xray.right_anchor_words.includes(cleanWord));

      return {
        id: idx,
        raw: w,
        clean: cleanWord,
        isBlank,
        isAnchor,
        pos: linked?.pos || (isBlank ? xray?.required_grammatical_role : null),
        meaning: linked?.meaning_vi || null,
        linkedData: linked
      };
    });
  }, [question, aiAnalysis, xray]);

  // Render Prompt
  const renderPromptSentence = () => {
    if (!isSubmitted) {
      const rawSentence = question.context_sentence || question.stem || '';
      if (!rawSentence.includes('-------') && !rawSentence.includes('_____')) {
        return <span>{rawSentence}</span>;
      }
      const parts = rawSentence.split(/-------|_____/);
      return (
        <span style={{ lineHeight: 1.6 }}>
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
      );
    }

    // When submitted: Interactive POS Token Stream
    return (
      <div style={{ lineHeight: 1.8, fontSize: '1.05rem' }}>
        {interactiveTokens.map(tok => {
          if (tok.isBlank) {
            const correctWord = question.options?.[question.correct_answer] || '';
            return (
              <span
                key={tok.id}
                style={{
                  display: 'inline-block',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '0.4rem',
                  backgroundColor: isCorrect ? 'var(--ds-success-bg)' : 'var(--ds-accent-bg)',
                  border: `1.5px solid ${isCorrect ? 'var(--ds-success)' : 'var(--ds-accent)'}`,
                  color: isCorrect ? 'var(--ds-success)' : 'var(--ds-accent)',
                  fontWeight: 800,
                  margin: '0 0.3rem'
                }}
              >
                {correctWord}
              </span>
            );
          }

          const isSelected = selectedToken?.id === tok.id;

          return (
            <span
              key={tok.id}
              onClick={() => setSelectedToken(isSelected ? null : tok)}
              className={`toeic-pos-token ${isSelected ? 'active' : ''}`}
              title="Click để xem phân tích từ loại & cấu trúc"
            >
              <span style={{ fontWeight: tok.isAnchor ? 800 : 500, color: tok.isAnchor ? 'var(--ds-warning)' : 'inherit' }}>
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
    );
  };

  return (
    <div className="toeic-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
      {/* 1. TOP HEADER & PACING TIMER */}
      <div className="toeic-flex-between" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--ds-border)', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <ToeicBadge variant="muted">
            Part {question.part} • #{question.number || 101}
          </ToeicBadge>
          <ToeicBadge variant="primary">
            {aiAnalysis.primary_topic_name_vi || question.primary_grammar_topic_id}
          </ToeicBadge>
          <span style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)', fontWeight: 600 }}>
            Band {question.target_score_band || 500}+
          </span>
        </div>

        {/* Pacing Timer & Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              border: `1px solid ${pacingColor}`,
              color: pacingColor,
              fontSize: '0.75rem',
              fontWeight: 700
            }}
          >
            <span>⏱️ {timeSpentSec}s</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--ds-text-muted)' }}>
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
                padding: '0.3rem 0.7rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--ds-border)',
                backgroundColor: state === XRAY_STATES.HINT_ACTIVE ? 'var(--ds-accent-bg)' : 'transparent',
                color: 'var(--ds-accent)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <span>💡 Gợi ý X-Ray (H)</span>
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
                padding: '0.3rem 0.7rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--ds-border)',
                backgroundColor: 'var(--ds-bg-elevated)',
                color: 'var(--ds-text)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <span>🧑‍🏫 AI Gia Sư</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. HINT BANNER (When Hint Active) */}
      {state === XRAY_STATES.HINT_ACTIVE && xray && (
        <div className="toeic-formula-box trap" style={{ margin: '0 0 1.25rem 0' }}>
          <div className="toeic-formula-title">
            <span>🔍 GỢI Ý QUANG PHỔ CÂU (SENTENCE X-RAY):</span>
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

      {/* 3. PROMPT SENTENCE */}
      <div style={{ margin: '0.75rem 0 1.5rem 0', fontWeight: 500 }}>
        {renderPromptSentence()}
      </div>

      {/* 4. INTERACTIVE TOKEN DETAILS POPOVER (AC-U4.2) */}
      {selectedToken && (
        <div className="toeic-pos-popover" style={{ marginBottom: '1.25rem' }}>
          <div className="toeic-flex-between" style={{ marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ds-text)' }}>
                {selectedToken.clean}
              </span>
              {selectedToken.pos && (
                <ToeicBadge variant="primary">{selectedToken.pos}</ToeicBadge>
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
              <strong>Vai trò trong câu:</strong> {selectedToken.pos ? `Bổ nghĩa / Thành phần ${selectedToken.pos}` : 'Thành phần ngữ pháp trong mệnh đề'}
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

      {/* 5. 4 OPTIONS (A, B, C, D) */}
      <div className="toeic-grid-2" style={{ gap: '0.75rem', marginBottom: '1.5rem' }}>
        {(['A', 'B', 'C', 'D']).map(optKey => {
          const optText = question.options?.[optKey];
          if (!optText) return null;

          const isSelected = selectedOption === optKey;
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
              badgeColor = '#ffffff';
            } else if (isSelected && !isCorrectAnswer) {
              btnBg = 'var(--ds-danger-bg)';
              btnBorder = 'var(--ds-danger)';
              badgeBg = 'var(--ds-danger)';
              badgeColor = '#ffffff';
            }
          } else if (isSelected) {
            btnBg = 'var(--ds-accent-bg)';
            btnBorder = 'var(--ds-accent)';
            badgeBg = 'var(--ds-accent)';
            badgeColor = '#ffffff';
          }

          return (
            <button
              key={optKey}
              type="button"
              disabled={isSubmitted}
              onClick={() => handleSelectOption(optKey)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                borderRadius: '0.75rem',
                border: `1.5px solid ${btnBorder}`,
                backgroundColor: btnBg,
                textAlign: 'left',
                cursor: isSubmitted ? 'default' : 'pointer',
                transition: 'all 0.15s ease'
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
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ds-text)' }}>
                  {optText}
                </span>
              </div>

              {isSubmitted && optAnalysis && (
                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--ds-border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--ds-text-muted)' }}>
                  <span style={{ fontFamily: 'monospace' }}>{optAnalysis.pos_or_role || 'Từ loại N/A'}</span>
                  {isCorrectAnswer && (
                    <span style={{ fontWeight: 700, color: 'var(--ds-success)' }}>✓ Đáp án đúng</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 6. POST-SUBMISSION 4-STATE PEDAGOGICAL WORKSPACE (Milestone U4) */}
      {isSubmitted && (
        <div style={{ borderTop: '1px solid var(--ds-border)', paddingTop: '1.25rem' }}>
          {/* Navigation Tabs for X-Ray Analysis */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveTab('breakdown')}
              className={`toeic-target-chip ${activeTab === 'breakdown' ? 'active' : ''}`}
            >
              📐 Bóc Tách Cấu Trúc (State 2)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('formula')}
              className={`toeic-target-chip ${activeTab === 'formula' ? 'active' : ''}`}
            >
              📐 Hộp Quy Tắc &amp; Công Thức (State 3)
            </button>
            <button
              type="button"
              onClick={handleOpenTwinRemediation}
              className={`toeic-target-chip ${activeTab === 'twin' ? 'active' : ''}`}
            >
              🎯 Câu Sinh Đôi Twin-Questions (State 4)
            </button>
          </div>

          {/* TAB 1: STRUCTURAL BREAKDOWN (State 2 / AC-U4.1) */}
          {activeTab === 'breakdown' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Cognitive Error Pattern Alert if wrong */}
              {selectedFeedback && !isCorrect && (
                <div className="toeic-formula-box critical">
                  <div className="toeic-formula-title">
                    <span>⚠️ PHÂN TÍCH LỖI NHẬN THỨC:</span>
                    {selectedFeedback.error_pattern_name_vi && (
                      <ToeicBadge variant="danger">{selectedFeedback.error_pattern_name_vi}</ToeicBadge>
                    )}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--ds-text)', margin: '0.35rem 0 0 0', lineHeight: 1.5 }}>
                    {selectedFeedback.ai_feedback_vi}
                  </p>
                </div>
              )}

              {/* Structural Pattern Display */}
              {xray?.xray_pattern_display && (
                <div style={{ padding: '0.85rem 1rem', borderRadius: '0.75rem', backgroundColor: 'var(--ds-bg-elevated)', border: '1px solid var(--ds-border)', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--ds-accent)' }}>
                  <span style={{ fontWeight: 800 }}>📐 Cấu trúc câu: </span>
                  <span>{xray.xray_pattern_display}</span>
                </div>
              )}

              {/* Word Family Matrix */}
              {aiAnalysis.word_family_matrix?.length > 0 && (
                <div style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--ds-border)', backgroundColor: 'var(--ds-card)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ds-text)', marginBottom: '0.75rem' }}>
                    📚 Bảng Họ Từ Loại (Word Family Matrix):
                  </div>
                  <div className="toeic-grid-4" style={{ gap: '0.5rem' }}>
                    {aiAnalysis.word_family_matrix.map((wf, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '0.65rem',
                          borderRadius: '0.5rem',
                          border: `1px solid ${wf.is_correct ? 'var(--ds-success)' : 'var(--ds-border)'}`,
                          backgroundColor: wf.is_correct ? 'var(--ds-success-bg)' : 'var(--ds-bg-elevated)',
                          fontSize: '0.8rem'
                        }}
                      >
                        <div style={{ fontWeight: 700, color: 'var(--ds-text)' }}>
                          ({wf.option}) {wf.word}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--ds-text-muted)' }}>
                          {wf.grammatical_role}
                        </div>
                      </div>
                    ))}
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
                  <div className="toeic-formula-title">
                    <span>⚡ CÔNG THỨC NGỮ PHÁP CHUẨN:</span>
                  </div>
                  <div className="toeic-formula-text">
                    {aiAnalysis.micro_rule_formula_vi}
                  </div>
                </div>
              )}

              {/* Trap Alert */}
              {aiAnalysis.common_traps_vi && (
                <div className="toeic-formula-box trap">
                  <div className="toeic-formula-title">
                    <span>⚠️ BẪY NHẬN THỨC THƯỜNG GẶP:</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--ds-text)', lineHeight: 1.5 }}>
                    {aiAnalysis.common_traps_vi}
                  </div>
                </div>
              )}

              {/* 3 Solving Steps */}
              {aiAnalysis.solving_steps_vi?.length > 0 && (
                <div className="toeic-formula-box tip">
                  <div className="toeic-formula-title">
                    <span>💡 3 BƯỚC GIẢI NHANH 10 GIÂY:</span>
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

          {/* TAB 3: TWIN QUESTIONS REMEDIATION (State 4 / AC-U4.4) */}
          {activeTab === 'twin' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {twinQuestion ? (
                <div className="toeic-card" style={{ border: '1.5px solid var(--ds-warning-border)', backgroundColor: 'var(--ds-warning-bg)' }}>
                  <div className="toeic-flex-between" style={{ marginBottom: '0.75rem' }}>
                    <ToeicBadge variant="warning">
                      🎯 Câu Hỏi Sinh Đôi (Twin Question Remediation)
                    </ToeicBadge>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)' }}>
                      #{twinQuestion.id}
                    </span>
                  </div>

                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ds-text)', marginBottom: '1rem' }}>
                    {twinQuestion.context_sentence || twinQuestion.stem}
                  </div>

                  <div className="toeic-grid-2" style={{ gap: '0.5rem', marginBottom: '1rem' }}>
                    {(['A', 'B', 'C', 'D']).map(tOpt => {
                      const tText = twinQuestion.options?.[tOpt];
                      if (!tText) return null;

                      const isTwinSelected = twinAnswered === tOpt;
                      const isTwinCorrect = tOpt === twinQuestion.correct_answer;

                      let tBg = 'var(--ds-card)';
                      let tBorder = 'var(--ds-border)';
                      if (twinAnswered) {
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
                          disabled={!!twinAnswered}
                          onClick={() => setTwinAnswered(tOpt)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '0.5rem',
                            border: `1px solid ${tBorder}`,
                            backgroundColor: tBg,
                            color: 'var(--ds-text)',
                            fontSize: '0.85rem',
                            cursor: twinAnswered ? 'default' : 'pointer'
                          }}
                        >
                          <span style={{ fontWeight: 800 }}>({tOpt})</span>
                          <span>{tText}</span>
                        </button>
                      );
                    })}
                  </div>

                  {twinAnswered && (
                    <div
                      style={{
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        backgroundColor: twinAnswered === twinQuestion.correct_answer ? 'var(--ds-success-bg)' : 'var(--ds-danger-bg)',
                        color: twinAnswered === twinQuestion.correct_answer ? 'var(--ds-success)' : 'var(--ds-danger)'
                      }}
                    >
                      {twinAnswered === twinQuestion.correct_answer
                        ? '🎉 Xuất sắc! Bạn đã gỡ điểm thành công và nắm vững quy tắc này!'
                        : `Đáp án đúng là (${twinQuestion.correct_answer}). Hãy lưu câu này vào sổ tay SRS để ôn lại sau!`}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--ds-text-muted)', fontSize: '0.85rem' }}>
                  Đang tải câu hỏi tương tự để bạn luyện tập khắc phục lỗi...
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
