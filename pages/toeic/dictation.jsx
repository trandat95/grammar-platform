import React, { useState } from 'react';
import Head from 'next/head';
import AppShell2026 from '../../components/ui-2026/AppShell2026';
import DictationStudio from '../../components/toeic/DictationStudio';

export default function DictationPage() {
  const [isLight, setIsLight] = useState(true);
  const [selectedTestNum, setSelectedTestNum] = useState(1);

  return (
    <>
      <Head>
        <title>Phòng Nghe Chép Chính Tả (Dictation Studio 540 Tracks) | Grammar Engine</title>
        <meta name="description" content="Luyện nghe chép chính tả 540 tracks từ ETS 2026 với cloze inputs và kiểm tra tức thì." />
      </Head>

      <AppShell2026
        activeView="toeic"
        toeicSubView="dictation"
        onSelectView={(v) => {
          if (v === 'toeic') {
            if (typeof window !== 'undefined' && window.location.pathname !== '/toeic') {
              window.location.href = '/toeic';
            }
            return;
          }
          if (typeof window !== 'undefined') {
            window.location.href = v === 'dashboard' ? '/' : `/?view=${v}`;
          }
        }}
        isLight={isLight}
        onToggleTheme={() => setIsLight(prev => !prev)}
        currentChapterTitle="Dictation Studio ETS 2026"
      >
        <div className="toeic-page-wrap">
          <div className="toeic-container">
            <div className="toeic-flex-between" style={{ marginBottom: '1.25rem' }}>
              <a
                href="/toeic"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--ds-accent)',
                  textDecoration: 'none'
                }}
              >
                <span>&larr; Quay lại TOEIC Hub</span>
              </a>

              {/* TEST SELECTOR */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ds-text-muted)' }}>Chọn Test:</span>
                <select
                  value={selectedTestNum}
                  onChange={(e) => setSelectedTestNum(parseInt(e.target.value, 10))}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--ds-border)',
                    backgroundColor: 'var(--ds-card)',
                    color: 'var(--ds-text)',
                    fontSize: '0.85rem',
                    fontWeight: 700
                  }}
                >
                  {Array.from({ length: 10 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      ETS 2026 Test {String(i + 1).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <DictationStudio
              series="ETS2026"
              testNum={selectedTestNum}
            />
          </div>
        </div>
      </AppShell2026>
    </>
  );
}
