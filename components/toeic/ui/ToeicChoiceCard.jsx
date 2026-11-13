import React from 'react';

export default function ToeicChoiceCard({
  choiceKey = 'A',
  text = '',
  selected = false,
  correct = false,
  wrong = false,
  disabled = false,
  onSelect,
  shortcut = null
}) {
  let stateClass = '';
  if (selected) stateClass += ' selected';
  if (correct) stateClass += ' correct';
  if (wrong) stateClass += ' wrong';
  if (disabled) stateClass += ' disabled';

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      className={`toeic-choice-card ${stateClass}`.trim()}
      onClick={() => {
        if (!disabled && onSelect) onSelect(choiceKey);
      }}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ') && onSelect) {
          e.preventDefault();
          onSelect(choiceKey);
        }
      }}
    >
      <div className="toeic-choice-key">
        {choiceKey}
      </div>
      <div className="toeic-choice-text">
        {text}
      </div>
      {shortcut && (
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--ds-text-muted)',
            backgroundColor: 'var(--ds-bg-elevated)',
            border: '1px solid var(--ds-border)',
            borderRadius: '0.35rem',
            padding: '0.15rem 0.4rem',
            marginLeft: 'auto'
          }}
        >
          {shortcut}
        </span>
      )}
    </div>
  );
}
