import React from 'react';

export default function ToeicQuestionPalette({
  questions = [],
  currentIndex = 0,
  answers = {},
  flagged = {},
  onSelectIndex,
  title = 'Bảng câu hỏi'
}) {
  const total = questions.length;
  const answeredCount = Object.keys(answers).filter(k => answers[k]?.selected_answer || answers[k]?.selectedOption).length;
  const flaggedCount = Object.keys(flagged).filter(k => flagged[k]).length;

  return (
    <div className="toeic-palette-card">
      <div className="toeic-flex-between">
        <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{title}</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--ds-text-muted)' }}>
          {answeredCount}/{total} câu
        </span>
      </div>

      <div className="toeic-palette-grid">
        {questions.map((q, idx) => {
          const qId = q.id || `q_${idx}`;
          const isCurrent = idx === currentIndex;
          const isAnswered = !!(answers[qId]?.selected_answer || answers[qId]?.selectedOption);
          const isFlagged = !!flagged[qId];

          let btnClass = 'toeic-palette-btn';
          if (isCurrent) btnClass += ' current';
          if (isAnswered) btnClass += ' answered';
          if (isFlagged) btnClass += ' flagged';

          return (
            <button
              key={qId}
              type="button"
              className={btnClass}
              onClick={() => onSelectIndex(idx)}
              title={`Câu ${idx + 1}${isAnswered ? ' (Đã chọn)' : ''}${isFlagged ? ' (Đánh dấu)' : ''}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      <div
        style={{
          marginTop: '1.25rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--ds-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          fontSize: '0.75rem',
          color: 'var(--ds-text-muted)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--ds-accent)' }} />
          <span>Đã làm ({answeredCount})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--ds-warning)' }} />
          <span>Đánh dấu ({flaggedCount})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', border: '1px solid var(--ds-border)' }} />
          <span>Chưa làm</span>
        </div>
      </div>
    </div>
  );
}
