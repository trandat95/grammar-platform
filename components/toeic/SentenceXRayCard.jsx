import React, { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * SentenceXRayCard Component (Milestone E4 & Section 5.1)
 * 4-State Machine:
 * 1. STATE_SOLVING
 * 2. STATE_HINT_ACTIVE
 * 3. STATE_SUBMITTED_XRAY
 * 4. STATE_TWIN_REMEDIATION
 * Strict Design Token Discipline: var(--ds-*).
 */
export const XRAY_STATES = {
  SOLVING: 'STATE_SOLVING',
  HINT_ACTIVE: 'STATE_HINT_ACTIVE',
  SUBMITTED: 'STATE_SUBMITTED_XRAY',
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
  const [selectedOption, setSelectedOption] = useState(null);
  const [timeSpentSec, setTimeSpentSec] = useState(0);
  const [usedHint, setUsedHint] = useState(false);
  const [twinQuestion, setTwinQuestion] = useState(null);
  const [twinAnswered, setTwinAnswered] = useState(null);
  const [srsSavedWords, setSrsSavedWords] = useState({});

  const aiAnalysis = question.ai_analysis || {};
  const xray = aiAnalysis.sentence_xray || null;
  const recommendedTime = question.recommended_time_sec || 12;

  // Reset state when question changes
  useEffect(() => {
    setState(XRAY_STATES.SOLVING);
    setSelectedOption(null);
    setTimeSpentSec(0);
    setUsedHint(false);
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
    if (state === XRAY_STATES.SUBMITTED || state === XRAY_STATES.TWIN_REMEDIATION) return;
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
    setState(XRAY_STATES.TWIN_REMEDIATION);
    if (!twinQuestion && aiAnalysis.similar_question_ids?.length > 0) {
      try {
        const firstSimId = aiAnalysis.similar_question_ids[0];
        const res = await fetch(`/api/toeic/practice/check-answer`, {
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

  // Pacing Color
  const pacingRatio = timeSpentSec / recommendedTime;
  let pacingColor = 'var(--ds-success)';
  if (pacingRatio > 1.0) pacingColor = 'var(--ds-warning)';
  else if (pacingRatio > 0.7) pacingColor = 'var(--ds-primary)';

  const isSubmitted = state === XRAY_STATES.SUBMITTED || state === XRAY_STATES.TWIN_REMEDIATION;
  const isCorrect = selectedOption === question.correct_answer;
  const selectedFeedback = selectedOption && aiAnalysis.option_deep_analysis?.[selectedOption];

  // Render Prompt with Blank or X-Ray Highlights
  const renderedPrompt = useMemo(() => {
    const rawSentence = question.context_sentence || question.stem || '';
    if (!rawSentence.includes('-------') && !rawSentence.includes('_____')) {
      return <span>{rawSentence}</span>;
    }

    const parts = rawSentence.split(/-------|_____/);
    const beforeBlank = parts[0] || '';
    const afterBlank = parts[1] || '';

    if (state === XRAY_STATES.HINT_ACTIVE && xray) {
      return (
        <span className="leading-relaxed">
          {beforeBlank}
          <span
            className="inline-block px-2 py-0.5 rounded border mx-1 font-bold animate-pulse text-xs"
            style={{
              backgroundColor: 'var(--ds-primary-subtle)',
              borderColor: 'var(--ds-primary)',
              color: 'var(--ds-primary)'
            }}
          >
            [ Cần: {xray.required_grammatical_role || '?'} ]
          </span>
          {afterBlank}
        </span>
      );
    }

    if (isSubmitted) {
      const correctWord = question.options?.[question.correct_answer] || '';
      return (
        <span className="leading-relaxed">
          {beforeBlank}
          <span
            className="inline-block px-2.5 py-0.5 rounded-lg border mx-1 font-bold text-sm"
            style={{
              backgroundColor: isCorrect ? 'var(--ds-success-subtle)' : 'var(--ds-primary-subtle)',
              borderColor: isCorrect ? 'var(--ds-success)' : 'var(--ds-primary)',
              color: isCorrect ? 'var(--ds-success)' : 'var(--ds-primary)'
            }}
          >
            {correctWord}
          </span>
          {afterBlank}
        </span>
      );
    }

    return (
      <span className="leading-relaxed">
        {beforeBlank}
        <span
          className="inline-block px-3 py-0.5 rounded-lg border mx-1 font-mono font-bold text-xs"
          style={{
            backgroundColor: 'var(--ds-surface-secondary)',
            borderColor: 'var(--ds-border)',
            color: 'var(--ds-text-primary)'
          }}
        >
          [ &nbsp; ? &nbsp; ]
        </span>
        {afterBlank}
      </span>
    );
  }, [question, state, xray, isSubmitted, isCorrect]);

  return (
    <div
      className="w-full rounded-2xl p-6 sm:p-8 border shadow-sm space-y-6 transition-all"
      style={{
        backgroundColor: 'var(--ds-surface)',
        borderColor: 'var(--ds-border)'
      }}
    >
      {/* 1. TOP HEADER & PACING TIMER */}
      <div className="flex items-center justify-between pb-4 border-b"
           style={{ borderColor: 'var(--ds-border)' }}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                style={{ backgroundColor: 'var(--ds-surface-secondary)', color: 'var(--ds-text-primary)' }}>
            Part {question.part} • #{question.number || 101}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded"
                style={{ backgroundColor: 'var(--ds-primary-subtle)', color: 'var(--ds-primary)' }}>
            {aiAnalysis.primary_topic_name_vi || question.primary_grammar_topic_id}
          </span>
          <span className="text-xs px-2 py-0.5 rounded"
                style={{ backgroundColor: 'var(--ds-surface-secondary)', color: 'var(--ds-text-muted)' }}>
            Band {question.target_score_band || 500}+
          </span>
        </div>

        {/* Pacing Timer & Actions */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border"
               style={{ borderColor: pacingColor, color: pacingColor }}>
            <span>⏱️ {timeSpentSec}s</span>
            <span className="text-[10px] font-normal" style={{ color: 'var(--ds-text-muted)' }}>
              /{recommendedTime}s
            </span>
          </div>

          {!isSubmitted && (
            <button
              type="button"
              onClick={handleToggleHint}
              disabled={state === XRAY_STATES.HINT_ACTIVE}
              className="text-xs px-3 py-1 rounded-xl border flex items-center gap-1 font-bold transition-all hover:bg-[var(--ds-primary-subtle)] active:scale-95"
              style={{
                backgroundColor: state === XRAY_STATES.HINT_ACTIVE ? 'var(--ds-primary-subtle)' : 'transparent',
                borderColor: state === XRAY_STATES.HINT_ACTIVE ? 'var(--ds-primary)' : 'var(--ds-border)',
                color: 'var(--ds-primary)'
              }}
            >
              <span>💡 Gợi ý X-Ray (H)</span>
            </button>
          )}

          {onOpenAiTutor && (
            <button
              type="button"
              onClick={() => onOpenAiTutor(question, selectedOption)}
              className="text-xs px-3 py-1 rounded-xl border font-bold transition-all hover:bg-[var(--ds-surface-secondary)]"
              style={{ borderColor: 'var(--ds-border)', color: 'var(--ds-text-primary)' }}
            >
              🧑‍🏫 AI Gia Sư
            </button>
          )}
        </div>
      </div>

      {/* 2. HINT BOX (If STATE_HINT_ACTIVE) */}
      {state === XRAY_STATES.HINT_ACTIVE && xray && (
        <div
          className="rounded-xl p-4 border space-y-2 animate-fadeIn"
          style={{
            backgroundColor: 'var(--ds-primary-subtle)',
            borderColor: 'var(--ds-primary)'
          }}
        >
          <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--ds-primary)' }}>
            <span>🔍 GỢI Ý QUANG PHỔ CÂU (SENTENCE X-RAY):</span>
          </div>
          <div className="text-xs sm:text-sm space-y-1" style={{ color: 'var(--ds-text-primary)' }}>
            <div>
              Từ neo trước chỗ trống: <strong className="underline">{xray.left_anchor_words || 'N/A'}</strong>
              &nbsp;•&nbsp; Từ neo sau chỗ trống: <strong className="underline">{xray.right_anchor_words || 'N/A'}</strong>
            </div>
            <div>
              Vị trí này bắt buộc là: <strong>{xray.required_grammatical_role}</strong>
            </div>
            {aiAnalysis.micro_rule_formula_vi && (
              <div className="pt-1 font-mono text-xs font-bold" style={{ color: 'var(--ds-primary)' }}>
                Công thức: {aiAnalysis.micro_rule_formula_vi}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. QUESTION PROMPT */}
      <div className="text-base sm:text-lg font-medium leading-relaxed" style={{ color: 'var(--ds-text-primary)' }}>
        {renderedPrompt}
      </div>

      {/* 4. STRUCTURAL X-RAY PATTERN DISPLAY (When Submitted) */}
      {isSubmitted && xray?.xray_pattern_display && (
        <div
          className="p-3.5 rounded-xl border font-mono text-xs sm:text-sm overflow-x-auto whitespace-nowrap"
          style={{
            backgroundColor: 'var(--ds-surface-secondary)',
            borderColor: 'var(--ds-border)',
            color: 'var(--ds-primary)'
          }}
        >
          <span className="font-bold">📐 Sơ đồ cấu trúc: </span>
          <span>{xray.xray_pattern_display}</span>
        </div>
      )}

      {/* 5. 4 OPTIONS (A, B, C, D) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {(['A', 'B', 'C', 'D']).map((optKey) => {
          const optText = question.options?.[optKey];
          if (!optText) return null;

          const isSelected = selectedOption === optKey;
          const isCorrectAnswer = optKey === question.correct_answer;
          const optAnalysis = aiAnalysis.option_deep_analysis?.[optKey];

          let btnBg = 'var(--ds-surface)';
          let btnBorder = 'var(--ds-border)';
          let badgeBg = 'var(--ds-surface-secondary)';
          let badgeColor = 'var(--ds-text-primary)';

          if (isSubmitted) {
            if (isCorrectAnswer) {
              btnBg = 'var(--ds-success-subtle)';
              btnBorder = 'var(--ds-success)';
              badgeBg = 'var(--ds-success)';
              badgeColor = 'var(--ds-surface)';
            } else if (isSelected && !isCorrectAnswer) {
              btnBg = 'var(--ds-danger-subtle)';
              btnBorder = 'var(--ds-danger)';
              badgeBg = 'var(--ds-danger)';
              badgeColor = 'var(--ds-surface)';
            }
          } else if (isSelected) {
            btnBg = 'var(--ds-primary-subtle)';
            btnBorder = 'var(--ds-primary)';
            badgeBg = 'var(--ds-primary)';
            badgeColor = 'var(--ds-surface)';
          }

          return (
            <button
              key={optKey}
              type="button"
              disabled={isSubmitted}
              onClick={() => handleSelectOption(optKey)}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                !isSubmitted ? 'hover:border-[var(--ds-primary)] active:scale-[0.99]' : ''
              }`}
              style={{
                backgroundColor: btnBg,
                borderColor: btnBorder
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-all"
                  style={{
                    backgroundColor: badgeBg,
                    color: badgeColor
                  }}
                >
                  {optKey}
                </span>
                <span className="text-sm sm:text-base font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
                  {optText}
                </span>
              </div>

              {/* Show POS label under option when submitted */}
              {isSubmitted && optAnalysis && (
                <div className="mt-2 pt-2 border-t flex items-center justify-between text-xs"
                     style={{ borderColor: 'var(--ds-border)', color: 'var(--ds-text-muted)' }}>
                  <span className="font-mono">{optAnalysis.pos_or_role || 'Từ loại N/A'}</span>
                  {isCorrectAnswer && (
                    <span className="font-bold" style={{ color: 'var(--ds-success)' }}>✓ Đáp án đúng</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 6. AI FEEDBACK & 3 SOLVING STEPS (When Submitted) */}
      {isSubmitted && (
        <div className="space-y-4 pt-2 animate-fadeIn">
          {/* Selected Option Feedback Box */}
          {selectedFeedback && (
            <div
              className="p-4 rounded-xl border space-y-2"
              style={{
                backgroundColor: isCorrect ? 'var(--ds-success-subtle)' : 'var(--ds-danger-subtle)',
                borderColor: isCorrect ? 'var(--ds-success)' : 'var(--ds-danger)'
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-bold text-sm" style={{ color: isCorrect ? 'var(--ds-success)' : 'var(--ds-danger)' }}>
                  {isCorrect ? '🎉 Chính xác! Bạn đã áp dụng đúng quy tắc.' : '⚠️ Chưa chính xác! Phân tích lỗi nhận thức:'}
                </div>
                {selectedFeedback.error_pattern_name_vi && (
                  <span
                    className="text-xs px-2.5 py-0.5 rounded-full font-bold"
                    style={{
                      backgroundColor: 'var(--ds-surface)',
                      color: 'var(--ds-danger)'
                    }}
                  >
                    Lỗi: {selectedFeedback.error_pattern_name_vi}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--ds-text-primary)' }}>
                {selectedFeedback.ai_feedback_vi}
              </p>
            </div>
          )}

          {/* 3 Solving Steps */}
          {aiAnalysis.solving_steps_vi?.length > 0 && (
            <div
              className="p-4 rounded-xl border space-y-2"
              style={{ backgroundColor: 'var(--ds-surface-secondary)', borderColor: 'var(--ds-border)' }}
            >
              <h4 className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--ds-text-primary)' }}>
                💡 3 Bước Giải Nhanh:
              </h4>
              <div className="space-y-1.5 text-xs sm:text-sm" style={{ color: 'var(--ds-text-secondary)' }}>
                {aiAnalysis.solving_steps_vi.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="font-bold" style={{ color: 'var(--ds-primary)' }}>{idx + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2-COLUMN FOOTER: Word Family Matrix + Collocations & Linked Vocab */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Column Left: Word Family Matrix & Collocations */}
            <div
              className="p-4 rounded-xl border space-y-3"
              style={{ backgroundColor: 'var(--ds-surface-secondary)', borderColor: 'var(--ds-border)' }}
            >
              <h4 className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--ds-text-primary)' }}>
                📚 Bảng Họ Từ Loại (Word Family Matrix):
              </h4>
              {aiAnalysis.word_family_matrix?.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {aiAnalysis.word_family_matrix.map((wf, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded border"
                      style={{
                        backgroundColor: wf.is_correct ? 'var(--ds-success-subtle)' : 'var(--ds-surface)',
                        borderColor: 'var(--ds-border)'
                      }}
                    >
                      <div className="font-bold" style={{ color: 'var(--ds-text-primary)' }}>
                        ({wf.option}) {wf.word}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--ds-text-muted)' }}>
                        {wf.grammatical_role}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>
                  Không có bảng họ từ cho câu hỏi này.
                </p>
              )}

              {aiAnalysis.collocation_highlights?.length > 0 && (
                <div className="pt-2 border-t" style={{ borderColor: 'var(--ds-border)' }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: 'var(--ds-text-primary)' }}>
                    Cụm Collocation cốt lõi:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {aiAnalysis.collocation_highlights.map((col, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 rounded border font-medium"
                        style={{
                          backgroundColor: 'var(--ds-surface)',
                          borderColor: 'var(--ds-border)',
                          color: 'var(--ds-primary)'
                        }}
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Column Right: Linked Vocabulary & Save to SRS */}
            <div
              className="p-4 rounded-xl border space-y-3"
              style={{ backgroundColor: 'var(--ds-surface-secondary)', borderColor: 'var(--ds-border)' }}
            >
              <h4 className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--ds-text-primary)' }}>
                📖 Từ Vựng Trọng Tâm Trong Câu:
              </h4>
              {aiAnalysis.linked_vocabulary?.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {aiAnalysis.linked_vocabulary.map((v, idx) => {
                    const isSaved = !!srsSavedWords[v.word];
                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border flex items-center justify-between text-xs"
                        style={{ backgroundColor: 'var(--ds-surface)', borderColor: 'var(--ds-border)' }}
                      >
                        <div>
                          <span className="font-bold" style={{ color: 'var(--ds-text-primary)' }}>{v.word}</span>
                          <span className="text-[11px] ml-1.5 italic" style={{ color: 'var(--ds-text-muted)' }}>({v.pos})</span>
                          <div className="text-[11px]" style={{ color: 'var(--ds-text-secondary)' }}>{v.meaning_vi}</div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSrsSavedWords(prev => ({ ...prev, [v.word]: true }));
                            if (onSaveToSrs) onSaveToSrs({ type: 'VOCABULARY', word: v.word, data: v });
                          }}
                          disabled={isSaved}
                          className="px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all"
                          style={{
                            backgroundColor: isSaved ? 'var(--ds-success-subtle)' : 'var(--ds-surface-secondary)',
                            borderColor: isSaved ? 'var(--ds-success)' : 'var(--ds-border)',
                            color: isSaved ? 'var(--ds-success)' : 'var(--ds-text-primary)'
                          }}
                        >
                          {isSaved ? '✓ Đã lưu SRS' : '+ Lưu SRS'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>
                  Không có từ vựng liên kết.
                </p>
              )}
            </div>
          </div>

          {/* 7. TWIN-QUESTIONS REMEDIATION BUTTON (When Wrong) */}
          {!isCorrect && state !== XRAY_STATES.TWIN_REMEDIATION && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleOpenTwinRemediation}
                className="px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center gap-2 mx-auto active:scale-95"
                style={{
                  backgroundColor: 'var(--ds-warning)',
                  color: 'var(--ds-surface)'
                }}
              >
                <span>🔁 Luyện Ngay Câu Tương Tự (Twin-Questions)</span>
                <span>↓</span>
              </button>
            </div>
          )}

          {/* 8. SLIDE-DOWN TWIN QUESTION DRAWER */}
          {state === XRAY_STATES.TWIN_REMEDIATION && twinQuestion && (
            <div
              className="mt-4 rounded-xl p-5 border space-y-4 animate-fadeIn"
              style={{
                backgroundColor: 'var(--ds-surface-secondary)',
                borderColor: 'var(--ds-warning)'
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: 'var(--ds-warning-subtle)', color: 'var(--ds-warning)' }}>
                  🎯 Câu Tương Đương Khắc Phục Lỗi (Twin Question)
                </span>
                <span className="text-xs font-medium" style={{ color: 'var(--ds-text-muted)' }}>
                  #{twinQuestion.id}
                </span>
              </div>

              <div className="text-sm sm:text-base font-medium" style={{ color: 'var(--ds-text-primary)' }}>
                {twinQuestion.context_sentence || twinQuestion.stem}
              </div>

              {/* Twin Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(['A', 'B', 'C', 'D']).map(tOpt => {
                  const tText = twinQuestion.options?.[tOpt];
                  if (!tText) return null;
                  const isTwinSelected = twinAnswered === tOpt;
                  const isTwinCorrect = tOpt === twinQuestion.correct_answer;

                  let tBg = 'var(--ds-surface)';
                  let tBorder = 'var(--ds-border)';
                  if (twinAnswered) {
                    if (isTwinCorrect) {
                      tBg = 'var(--ds-success-subtle)';
                      tBorder = 'var(--ds-success)';
                    } else if (isTwinSelected) {
                      tBg = 'var(--ds-danger-subtle)';
                      tBorder = 'var(--ds-danger)';
                    }
                  }

                  return (
                    <button
                      key={tOpt}
                      type="button"
                      disabled={!!twinAnswered}
                      onClick={() => setTwinAnswered(tOpt)}
                      className="p-3 rounded-xl border text-left flex items-center gap-2.5 text-xs sm:text-sm font-medium transition-all"
                      style={{ backgroundColor: tBg, borderColor: tBorder, color: 'var(--ds-text-primary)' }}
                    >
                      <span className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs"
                            style={{ backgroundColor: 'var(--ds-surface-secondary)', color: 'var(--ds-text-primary)' }}>
                        {tOpt}
                      </span>
                      <span>{tText}</span>
                    </button>
                  );
                })}
              </div>

              {twinAnswered && (
                <div
                  className="p-3 rounded-lg text-xs font-bold text-center"
                  style={{
                    backgroundColor: twinAnswered === twinQuestion.correct_answer ? 'var(--ds-success-subtle)' : 'var(--ds-danger-subtle)',
                    color: twinAnswered === twinQuestion.correct_answer ? 'var(--ds-success)' : 'var(--ds-danger)'
                  }}
                >
                  {twinAnswered === twinQuestion.correct_answer
                    ? '🎉 Xuất sắc! Bạn đã gỡ điểm thành công và nắm vững quy tắc này!'
                    : `Đáp án đúng là (${twinQuestion.correct_answer}). Hãy lưu câu này vào sổ tay SRS để ôn lại sau!`}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
