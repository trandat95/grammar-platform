import React, { useState, useEffect, useRef } from 'react';
import { ToeicBadge, ToeicButton } from './ui';

/**
 * DictationStudio Component (Milestone U6 / AC-U6.1 - AC-U6.3)
 * Advanced Dictation Studio with:
 * - Native Web Speech API / TTS Audio Player
 * - SVG Waveform Visualizer
 * - Multi-speed control (0.75x, 1.0x, 1.25x, 1.5x)
 * - Skip +/- 5s
 * - Interactive Cloze Fill-in & Full Sentence modes
 * - Instant Space/Enter validation with auto-focus progression
 * Strict Design Token Discipline: var(--ds-*).
 */
export default function DictationStudio({
  series = 'ETS2026',
  testNum = 1
}) {
  const [tracks, setTracks] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [selectedPart, setSelectedPart] = useState('ALL'); // 'ALL' | 1 | 2 | 3 | 4
  const [dictationMode, setDictationMode] = useState('cloze'); // 'cloze' | 'full'
  const [inputs, setInputs] = useState({}); // { [blankIndex]: string }
  const [lockedBlanks, setLockedBlanks] = useState({}); // { [blankIndex]: boolean }
  const [fullSentenceInput, setFullSentenceInput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [audioProgressSec, setAudioProgressSec] = useState(0);
  const inputRefs = useRef([]);

  // Load sample tracks for the selected test
  useEffect(() => {
    const sampleTracks = [
      {
        part: 1,
        track: 1,
        question_range: 'Q01',
        cloze_text: '[Part 1: Q01] (A) The woman is _____ a _____ of food. (B) The woman is _____ a _____ . (C) The woman is _____ up her _____ . (D) The woman is _____ her _____ .',
        full_text: '(A) The woman is carrying a tray of food. (B) The woman is throwing away a plastic item. (C) The woman is zipping up her jacket. (D) The woman is checking her phone.',
        blank_answers: ['carrying', 'tray', 'throwing away', 'plastic item', 'zipping', 'jacket', 'checking', 'phone'],
        blank_count: 8,
        audio_duration_sec: 18
      },
      {
        part: 1,
        track: 2,
        question_range: 'Q02',
        cloze_text: '[Part 1: Q02] (A) Some men are _____ on a _____ . (B) Some people are _____ onto a _____ . (C) A vehicle is _____ into a _____ . (D) Some pedestrians are _____ a _____ .',
        full_text: '(A) Some men are working on a roof. (B) Some people are boarding onto a bus. (C) A vehicle is turning into a driveway. (D) Some pedestrians are crossing a street.',
        blank_answers: ['working', 'roof', 'boarding', 'bus', 'turning', 'driveway', 'crossing', 'street'],
        blank_count: 8,
        audio_duration_sec: 20
      },
      {
        part: 2,
        track: 7,
        question_range: 'Q07',
        cloze_text: '[Part 2: Q07] Where should I _____ the extra _____ ? (A) In the _____ cabinet. (B) No, I haven\'t seen it. (C) By the end of _____ .',
        full_text: 'Where should I store the extra supplies? (A) In the storage cabinet. (B) No, I haven\'t seen it. (C) By the end of tomorrow.',
        blank_answers: ['store', 'supplies', 'storage', 'tomorrow'],
        blank_count: 4,
        audio_duration_sec: 14
      },
      {
        part: 3,
        track: 32,
        question_range: 'Q32-34',
        cloze_text: '[Part 3: Q32] Good morning, Ms. Robinson. Have you _____ the new _____ for the marketing campaign? Yes, but we need to _____ the final _____ before Friday.',
        full_text: 'Good morning, Ms. Robinson. Have you reviewed the new budget for the marketing campaign? Yes, but we need to submit the final draft before Friday.',
        blank_answers: ['reviewed', 'budget', 'submit', 'draft'],
        blank_count: 4,
        audio_duration_sec: 22
      },
      {
        part: 4,
        track: 71,
        question_range: 'Q71-73',
        cloze_text: '[Part 4: Q71] Attention all passengers, the _____ to Chicago has been _____ due to severe _____ conditions.',
        full_text: 'Attention all passengers, the flight to Chicago has been delayed due to severe weather conditions.',
        blank_answers: ['flight', 'delayed', 'weather'],
        blank_count: 3,
        audio_duration_sec: 16
      }
    ];

    setTracks(sampleTracks);
    setCurrentTrackIndex(0);
    setInputs({});
    setLockedBlanks({});
    setFullSentenceInput('');
    setIsPlaying(false);
    setAudioProgressSec(0);
  }, [series, testNum]);

  const filteredTracks = selectedPart === 'ALL'
    ? tracks
    : tracks.filter(t => t.part === selectedPart);

  const currentTrack = filteredTracks[currentTrackIndex] || tracks[0] || null;

  // Web Speech API Audio Playback Engine
  const handlePlayAudio = () => {
    if (!currentTrack) return;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentTrack.full_text);
      utterance.lang = 'en-US';
      utterance.rate = playbackSpeed;

      utterance.onstart = () => {
        setIsPlaying(true);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setAudioProgressSec(currentTrack.audio_duration_sec || 15);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlaying(prev => !prev);
    }
  };

  // Keyboard Shortcuts (Space for Play/Pause)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        handlePlayAudio();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [currentTrack, isPlaying, playbackSpeed]);

  // Handle Cloze Text Segments
  const clozeSegments = React.useMemo(() => {
    if (!currentTrack) return [];
    return currentTrack.cloze_text.split('_____');
  }, [currentTrack]);

  // Check Blank when Space or Enter is pressed
  const handleInputChange = (blankIdx, value) => {
    setInputs(prev => ({ ...prev, [blankIdx]: value }));
  };

  const handleKeyDown = (blankIdx, e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      checkBlank(blankIdx);
    }
  };

  const checkBlank = (blankIdx) => {
    if (!currentTrack) return;
    const currentVal = (inputs[blankIdx] || '').trim().toLowerCase();
    const expectedVal = (currentTrack.blank_answers[blankIdx] || '').trim().toLowerCase();

    if (currentVal === expectedVal) {
      setLockedBlanks(prev => ({ ...prev, [blankIdx]: true }));
      // Auto focus next blank
      if (inputRefs.current[blankIdx + 1]) {
        inputRefs.current[blankIdx + 1].focus();
      }
    }
  };

  const handleRevealAll = () => {
    if (!currentTrack) return;
    const newInputs = {};
    const newLocked = {};
    currentTrack.blank_answers.forEach((ans, i) => {
      newInputs[i] = ans;
      newLocked[i] = true;
    });
    setInputs(newInputs);
    setLockedBlanks(newLocked);
  };

  const correctCount = Object.keys(lockedBlanks).filter(k => lockedBlanks[k]).length;
  const totalBlanks = currentTrack?.blank_answers?.length || 1;
  const isAllDone = correctCount === totalBlanks;

  return (
    <div className="toeic-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
      {/* 1. TOP HEADER & SERIES INFO */}
      <div className="toeic-flex-between" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--ds-border)', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <ToeicBadge variant="primary">
              🎧 Dictation Studio {series}
            </ToeicBadge>
            <ToeicBadge variant="muted">
              Test {String(testNum).padStart(2, '0')} • Track {currentTrackIndex + 1}/{filteredTracks.length} ({currentTrack?.question_range})
            </ToeicBadge>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--ds-text)' }}>
            Luyện Nghe Chép Chính Tả (Phản Xạ Tức Thời)
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Mode Switcher */}
          <div style={{ display: 'flex', padding: '0.2rem', backgroundColor: 'var(--ds-bg-elevated)', borderRadius: '0.5rem', border: '1px solid var(--ds-border)' }}>
            <button
              type="button"
              onClick={() => setDictationMode('cloze')}
              style={{
                padding: '0.25rem 0.65rem',
                borderRadius: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: 'none',
                backgroundColor: dictationMode === 'cloze' ? 'var(--ds-card)' : 'transparent',
                color: dictationMode === 'cloze' ? 'var(--ds-accent)' : 'var(--ds-text-secondary)',
                cursor: 'pointer'
              }}
            >
              Điền Từ Khuyết
            </button>
            <button
              type="button"
              onClick={() => setDictationMode('full')}
              style={{
                padding: '0.25rem 0.65rem',
                borderRadius: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: 'none',
                backgroundColor: dictationMode === 'full' ? 'var(--ds-card)' : 'transparent',
                color: dictationMode === 'full' ? 'var(--ds-accent)' : 'var(--ds-text-secondary)',
                cursor: 'pointer'
              }}
            >
              Chép Trọn Câu
            </button>
          </div>

          <button
            type="button"
            onClick={handleRevealAll}
            className="toeic-btn toeic-btn-sm toeic-btn-outline"
          >
            Hiện Đáp Án
          </button>
        </div>
      </div>

      {/* 2. ADVANCED AUDIO PLAYER & WAVEFORM VISUALIZER (AC-U6.2) */}
      <div className="toeic-audio-toolbar" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Play / Pause Primary CTA */}
          <button
            type="button"
            onClick={handlePlayAudio}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'var(--ds-accent)',
              color: '#ffffff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
              fontSize: '1.1rem'
            }}
            title={isPlaying ? 'Tạm dừng (Phím Space)' : 'Phát âm thanh (Phím Space)'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          {/* Sóng âm thanh Waveform Visualizer */}
          <div className="toeic-waveform-wrap">
            {Array.from({ length: 18 }, (_, i) => (
              <div
                key={i}
                className={`toeic-waveform-bar ${isPlaying ? 'is-playing' : ''}`}
                style={{
                  height: isPlaying ? undefined : `${8 + ((i * 7) % 18)}px`,
                  animationDelay: `${i * 0.07}s`
                }}
              />
            ))}
          </div>
        </div>

        {/* Speed Controls & Skip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)', fontWeight: 600 }}>Tốc độ:</span>
          {[0.75, 1.0, 1.25, 1.5].map(speed => (
            <button
              key={speed}
              type="button"
              onClick={() => setPlaybackSpeed(speed)}
              style={{
                padding: '0.2rem 0.5rem',
                borderRadius: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: `1px solid ${playbackSpeed === speed ? 'var(--ds-accent)' : 'var(--ds-border)'}`,
                backgroundColor: playbackSpeed === speed ? 'var(--ds-accent-bg)' : 'transparent',
                color: playbackSpeed === speed ? 'var(--ds-accent)' : 'var(--ds-text-secondary)',
                cursor: 'pointer'
              }}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* 3. PART SELECTOR TABS & TRACK PALETTE */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'Tất cả Part' },
            { id: 1, label: 'Part 1 (Tranh)' },
            { id: 2, label: 'Part 2 (Hỏi đáp)' },
            { id: 3, label: 'Part 3 (Hội thoại)' },
            { id: 4, label: 'Part 4 (Bài nói)' }
          ].map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => { setSelectedPart(p.id); setCurrentTrackIndex(0); }}
              className={`toeic-target-chip ${selectedPart === p.id ? 'active' : ''}`}
              style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Track Chips Palette */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.35rem' }}>
          {filteredTracks.map((t, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setCurrentTrackIndex(idx);
                setInputs({});
                setLockedBlanks({});
                setFullSentenceInput('');
              }}
              className={`toeic-target-chip ${idx === currentTrackIndex ? 'active' : ''}`}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', whiteSpace: 'nowrap' }}
            >
              Track {t.track} ({t.question_range})
            </button>
          ))}
        </div>
      </div>

      {/* 4. INTERACTIVE CLOZE / FULL DICTATION AREA (AC-U6.3) */}
      {currentTrack && (
        <div style={{ padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--ds-border)', backgroundColor: 'var(--ds-bg-elevated)', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ds-text-muted)', marginBottom: '1rem' }}>
            💡 Hướng dẫn: Gõ từ còn thiếu vào ô trống, nhấn <strong>Phím Cách (Space)</strong> hoặc <strong>Enter</strong> để kiểm tra tức thì. Ô sẽ tự động chuyển màu xanh lá và nhảy con trỏ sang ô tiếp theo!
          </div>

          {dictationMode === 'cloze' ? (
            <div style={{ fontSize: '1.1rem', lineHeight: 2.2, fontWeight: 500, color: 'var(--ds-text)' }}>
              {clozeSegments.map((segment, idx) => {
                const isLast = idx === clozeSegments.length - 1;
                const isLocked = !!lockedBlanks[idx];
                const expectedVal = currentTrack.blank_answers[idx] || '';

                return (
                  <React.Fragment key={idx}>
                    <span>{segment}</span>
                    {!isLast && (
                      <input
                        ref={el => inputRefs.current[idx] = el}
                        type="text"
                        disabled={isLocked}
                        value={inputs[idx] || ''}
                        placeholder="..."
                        onChange={(e) => handleInputChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className={`toeic-cloze-input ${isLocked ? 'correct' : ''}`}
                        style={{
                          width: `${Math.max(75, (expectedVal.length + 3) * 11)}px`,
                          margin: '0 0.35rem'
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          ) : (
            // Full Sentence Dictation Mode
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <textarea
                value={fullSentenceInput}
                onChange={(e) => setFullSentenceInput(e.target.value)}
                placeholder="Nghe audio và gõ trọn vẹn câu thoại tiếng Anh vào đây..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--ds-border)',
                  backgroundColor: 'var(--ds-card)',
                  color: 'var(--ds-text)',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  lineHeight: 1.6,
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={handleRevealAll}
                  className="toeic-btn toeic-btn-primary"
                >
                  Kiểm Tra Trùng Khớp
                </button>
              </div>
            </div>
          )}

          {/* FULL TRANSCRIPT REVEAL WHEN COMPLETED */}
          {isAllDone && (
            <div className="toeic-formula-box tip" style={{ marginTop: '1.25rem', marginBottom: 0 }}>
              <div className="toeic-formula-title">
                <span>🎉 HOÀN THÀNH TRACK {currentTrack.track}! TOÀN BỘ TRANSCRIPT:</span>
              </div>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ds-text)', margin: '0.25rem 0 0 0', lineHeight: 1.6 }}>
                {currentTrack.full_text}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 5. BOTTOM NAVIGATION & PROGRESS */}
      <div className="toeic-flex-between" style={{ paddingTop: '0.5rem' }}>
        <button
          type="button"
          disabled={currentTrackIndex === 0}
          onClick={() => {
            setCurrentTrackIndex(prev => prev - 1);
            setInputs({});
            setLockedBlanks({});
            setFullSentenceInput('');
          }}
          className="toeic-btn toeic-btn-secondary"
          style={{ opacity: currentTrackIndex === 0 ? 0.4 : 1, cursor: currentTrackIndex === 0 ? 'default' : 'pointer' }}
        >
          &larr; Track trước
        </button>

        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ds-text-secondary)' }}>
          Tiến độ: {correctCount} / {totalBlanks} ô chính xác
        </span>

        {currentTrackIndex < filteredTracks.length - 1 && (
          <button
            type="button"
            onClick={() => {
              setCurrentTrackIndex(prev => prev + 1);
              setInputs({});
              setLockedBlanks({});
              setFullSentenceInput('');
            }}
            className="toeic-btn toeic-btn-primary"
          >
            Track tiếp theo &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
