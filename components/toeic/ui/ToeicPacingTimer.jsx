import React, { useState, useEffect, useRef } from 'react';

export default function ToeicPacingTimer({
  initialSeconds = 1200,
  onTimeUp,
  isPaused = false
}) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const targetTimeRef = useRef(Date.now() + initialSeconds * 1000);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    targetTimeRef.current = Date.now() + initialSeconds * 1000;
  }, [initialSeconds]);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.round((targetTimeRef.current - now) / 1000));
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        if (onTimeUpRef.current) onTimeUpRef.current();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPaused]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  let colorClass = 'toeic-pacing-green';
  if (secondsLeft <= 60) colorClass = 'toeic-pacing-red';
  else if (secondsLeft <= 300) colorClass = 'toeic-pacing-yellow';

  return (
    <div className={`toeic-pacing-pill ${colorClass}`}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span>{timeStr}</span>
    </div>
  );
}
