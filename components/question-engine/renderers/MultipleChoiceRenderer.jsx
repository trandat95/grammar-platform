import React, { useRef } from "react";
import RadioChoiceCard from "../components/RadioChoiceCard";
import {
  extractAnswerStrings,
  normalizeAnswer,
} from "../resolver/AnswerCompatibility";

export default function MultipleChoiceRenderer({
  question,
  options = [],
  value = "",
  onChange,
  onCheck,
  onShowAnswer,
  isAnswerOpen = false,
  checkResult = null,
  disabled = false,
  isSubmitting = false,
  showCheckButton = true,
  showAnswerButton = true,
}) {
  const optionRefs = useRef([]);
  const isLocked = disabled || isSubmitting;
  const isChecked = Boolean(checkResult?.checked);
  const normSelected = normalizeAnswer(value);

  const normalizedAnswers = new Set(
    extractAnswerStrings(question?.answers).map(normalizeAnswer)
  );

  const selectedIndex = options.findIndex(
    (opt) => normalizeAnswer(opt.value) === normSelected
  );

  const selectOptionAt = (idx, focusCard = false) => {
    if (isLocked || idx < 0 || idx >= options.length) return;
    const chosen = options[idx];
    if (typeof onChange === "function") {
      onChange(chosen.value);
    }
    if (focusCard && optionRefs.current[idx]) {
      optionRefs.current[idx].focus();
    }
  };

  const handleOptionKeyDown = (idx, e) => {
    if (isLocked) return;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      const nextIdx = (idx + 1) % options.length;
      selectOptionAt(nextIdx, true);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIdx = (idx - 1 + options.length) % options.length;
      selectOptionAt(prevIdx, true);
    } else if (e.key === "Enter" && typeof onCheck === "function") {
      e.preventDefault();
      onCheck(question);
    }
  };

  return (
    <div>
      <div
        role="radiogroup"
        aria-label={
          question?.num
            ? `Các lựa chọn cho câu ${question.num}`
            : "Các lựa chọn trả lời"
        }
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "0.6rem",
        }}
      >
        {options.map((opt, idx) => {
          const normOpt = normalizeAnswer(opt.value);
          const isSelected = Boolean(normSelected && normSelected === normOpt);
          const isCanonicalAnswer = normalizedAnswers.has(normOpt);
          const showAsCorrect =
            (isChecked || isAnswerOpen) && isCanonicalAnswer && (isSelected || isAnswerOpen || !checkResult?.isCorrect);
          const showAsWrong = isChecked && !checkResult?.isCorrect && isSelected && !isCanonicalAnswer;

          const tabIndex =
            selectedIndex >= 0 ? (idx === selectedIndex ? 0 : -1) : idx === 0 ? 0 : -1;

          return (
            <RadioChoiceCard
              key={opt.id || opt.key || idx}
              ref={(el) => {
                optionRefs.current[idx] = el;
              }}
              choiceKey={opt.key || String.fromCharCode(65 + idx)}
              label={opt.label}
              selected={isSelected}
              correct={showAsCorrect}
              wrong={showAsWrong}
              disabled={isLocked}
              tabIndex={tabIndex}
              onSelect={() => selectOptionAt(idx, false)}
              onKeyDown={(e) => handleOptionKeyDown(idx, e)}
            />
          );
        })}
      </div>

      {(showCheckButton || showAnswerButton) && (onCheck || onShowAnswer) && (
        <div
          style={{
            display: "flex",
            gap: "0.55rem",
            alignItems: "center",
            flexWrap: "wrap",
            marginTop: "0.85rem",
          }}
        >
          {showCheckButton && typeof onCheck === "function" && !disabled && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onCheck(question)}
              className="ds-focusable"
              style={{
                padding: "0.52rem 1rem",
                minHeight: "40px",
                backgroundColor: "var(--ds-btn-primary)",
                border: "1px solid var(--ds-btn-primary)",
                borderRadius: "var(--ds-radius-md, 8px)",
                color: "var(--ds-text-on-accent)",
                fontSize: "0.82rem",
                fontWeight: "600",
                cursor: isSubmitting ? "wait" : "pointer",
                opacity: isSubmitting ? 0.72 : 1,
              }}
            >
              {isSubmitting ? "Đang kiểm tra..." : "Kiểm tra"}
            </button>
          )}

          {showAnswerButton && typeof onShowAnswer === "function" && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onShowAnswer(question)}
              className="ds-focusable"
              style={{
                padding: "0.52rem 0.85rem",
                minHeight: "40px",
                backgroundColor: "var(--ds-card-subtle)",
                border: "1px solid var(--ds-border)",
                borderRadius: "var(--ds-radius-md, 8px)",
                color: "var(--ds-text-secondary)",
                fontSize: "0.82rem",
                fontWeight: "500",
                cursor: isSubmitting ? "wait" : "pointer",
              }}
            >
              {isAnswerOpen ? "Ẩn đáp án" : "Đáp án"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
