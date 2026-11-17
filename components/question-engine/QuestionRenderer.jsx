import React, { useMemo, useCallback } from "react";
import {
  QUESTION_MODES,
  resolveQuestionPresentation,
} from "./resolver/QuestionTypeResolver";
import { useQuestionState } from "./hooks/useQuestionState";
import QuestionStem from "./components/QuestionStem";
import QuestionFeedback from "./components/QuestionFeedback";
import MultipleChoiceRenderer from "./renderers/MultipleChoiceRenderer";
import TextInputRenderer from "./renderers/TextInputRenderer";
import MultiBlankRenderer from "./renderers/MultiBlankRenderer";
import BeforeAnswer from "./states/BeforeAnswer";
import AfterCorrect from "./states/AfterCorrect";
import AfterWrong from "./states/AfterWrong";

/**
 * Unified Question Experience Engine entry component shared by Study Exercises and Grammar Quiz.
 * Preserves canonical grading and `question.answers[]` without mutating source data.
 */
export default function QuestionRenderer({
  question,
  fallbackType = "",
  displayNumber,
  scope = "study",
  value,
  onChange,
  onCheck,
  onShowAnswer,
  isAnswerOpen = false,
  checkResult = null,
  disabled = false,
  isSubmitting = false,
  onListen = null,
  onRetry = null,
  onContinue = null,
  renderExplanation = null,
  renderPostAnswerExtra = null,
  showCheckButton = true,
  showAnswerButton = true,
  className = "",
  style = {},
}) {
  const presentation = useMemo(
    () => resolveQuestionPresentation(question, fallbackType),
    [question, fallbackType]
  );

  const {
    value: activeValue,
    setValue: handleValueChange,
    attempts,
    recordAttempt,
  } = useQuestionState({
    scope,
    questionId: question?.id || "",
    value,
    onChange,
  });

  const handleCheck = useCallback(
    (targetQuestion) => {
      recordAttempt();
      if (typeof onCheck === "function") {
        onCheck(targetQuestion || question, activeValue);
      }
    },
    [recordAttempt, onCheck, question, activeValue]
  );

  const handleRetry = useCallback(() => {
    handleValueChange("");
    if (typeof onRetry === "function") {
      onRetry(question);
    }
  }, [handleValueChange, onRetry, question]);

  if (!question) return null;

  const isChecked = Boolean(checkResult?.checked);
  const isCorrect = Boolean(checkResult?.isCorrect);

  let RendererComponent = TextInputRenderer;
  if (presentation.mode === QUESTION_MODES.MULTIPLE_CHOICE) {
    RendererComponent = MultipleChoiceRenderer;
  } else if (presentation.mode === QUESTION_MODES.MULTI_BLANK) {
    RendererComponent = MultiBlankRenderer;
  }

  const content = (
    <>
      <QuestionStem
        question={question}
        displayNumber={displayNumber}
        fallbackType={fallbackType}
        resolvedMode={presentation.mode}
        onListen={onListen}
        attempts={attempts}
      />

      <RendererComponent
        question={question}
        options={presentation.options}
        value={activeValue}
        onChange={handleValueChange}
        onCheck={onCheck ? handleCheck : undefined}
        onShowAnswer={onShowAnswer}
        isAnswerOpen={isAnswerOpen}
        checkResult={checkResult}
        disabled={disabled}
        isSubmitting={isSubmitting}
        showCheckButton={showCheckButton}
        showAnswerButton={showAnswerButton}
      />

      <QuestionFeedback
        question={question}
        checkResult={checkResult}
        isAnswerOpen={isAnswerOpen}
        userValue={activeValue}
        renderExplanation={renderExplanation}
        renderPostAnswerExtra={renderPostAnswerExtra}
      />
    </>
  );

  if (isChecked && isCorrect) {
    return (
      <AfterCorrect
        onContinue={onContinue}
        className={className}
        style={style}
      >
        {content}
      </AfterCorrect>
    );
  }

  if (isChecked && !isCorrect) {
    return (
      <AfterWrong
        question={question}
        userValue={activeValue}
        onRetry={onRetry ? handleRetry : undefined}
        disabled={disabled || isSubmitting}
        className={className}
        style={style}
      >
        {content}
      </AfterWrong>
    );
  }

  return (
    <BeforeAnswer className={className} style={style}>
      {content}
    </BeforeAnswer>
  );
}
