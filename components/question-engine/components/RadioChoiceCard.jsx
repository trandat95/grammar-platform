import React from "react";

/**
 * Accessible radio choice card (`role="radio"`).
 * Minimum height 48px, crisp A/B/C/D circle badge, CSS custom properties only.
 */
const RadioChoiceCard = React.forwardRef(function RadioChoiceCard(
  {
    choiceKey = "A",
    label = "",
    selected = false,
    correct = false,
    wrong = false,
    disabled = false,
    tabIndex,
    onSelect,
    onKeyDown,
  },
  ref
) {
  let cardBg = "var(--ds-card)";
  let cardBorder = "1px solid var(--ds-card-border)";
  let badgeBg = "var(--ds-bg-elevated)";
  let badgeColor = "var(--ds-text-secondary)";
  let badgeBorder = "1px solid var(--ds-border)";
  let textColor = "var(--ds-text)";

  if (correct) {
    cardBg = "var(--ds-success-bg)";
    cardBorder = "1.5px solid var(--ds-success)";
    badgeBg = "var(--ds-success)";
    badgeColor = "var(--ds-text-on-accent)";
    badgeBorder = "1px solid var(--ds-success)";
    textColor = "var(--ds-success)";
  } else if (wrong) {
    cardBg = "var(--ds-danger-bg)";
    cardBorder = "1.5px solid var(--ds-danger)";
    badgeBg = "var(--ds-danger)";
    badgeColor = "var(--ds-text-on-accent)";
    badgeBorder = "1px solid var(--ds-danger)";
    textColor = "var(--ds-danger)";
  } else if (selected) {
    cardBg = "var(--ds-accent-bg)";
    cardBorder = "1.5px solid var(--ds-accent)";
    badgeBg = "var(--ds-accent)";
    badgeColor = "var(--ds-text-on-accent)";
    badgeBorder = "1px solid var(--ds-accent)";
    textColor = "var(--ds-text-heading)";
  }

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      if (onSelect) onSelect();
      return;
    }
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <div
      ref={ref}
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : tabIndex ?? (selected ? 0 : -1)}
      className={`ge-radio-card ds-focusable ds-touch-target ${selected ? "is-selected" : ""}`}
      onClick={() => {
        if (!disabled && onSelect) onSelect();
      }}
      onKeyDown={handleKeyDown}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        minHeight: "48px",
        width: "100%",
        padding: "0.6rem 0.9rem",
        backgroundColor: cardBg,
        border: cardBorder,
        borderRadius: "var(--ds-radius-lg, 12px)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled && !selected && !correct && !wrong ? 0.72 : 1,
        transition: "background-color var(--ds-duration-fast, 120ms) ease, border-color var(--ds-duration-fast, 120ms) ease",
        userSelect: "none",
        boxSizing: "border-box",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "30px",
          height: "30px",
          minWidth: "30px",
          borderRadius: "var(--ds-radius-full, 9999px)",
          backgroundColor: badgeBg,
          color: badgeColor,
          border: badgeBorder,
          fontSize: "0.8rem",
          fontWeight: "700",
          lineHeight: 1,
        }}
      >
        {choiceKey}
      </span>

      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: "0.925rem",
          fontWeight: selected || correct ? "600" : "500",
          color: textColor,
          lineHeight: "1.45",
          overflowWrap: "anywhere",
        }}
      >
        {label}
      </span>

      {(correct || wrong) && (
        <span
          aria-hidden="true"
          style={{
            fontSize: "0.85rem",
            fontWeight: "700",
            color: correct ? "var(--ds-success)" : "var(--ds-danger)",
            flexShrink: 0,
          }}
        >
          {correct ? "✓" : "✕"}
        </span>
      )}
    </div>
  );
});

export default RadioChoiceCard;
