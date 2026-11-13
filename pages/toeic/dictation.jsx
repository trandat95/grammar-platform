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
        activeView="quiz"
        onSelectView={(v) => {
          if (v === 'dashboard') window.location.href = '/';
          else if (v === 'study') window.location.href = '/';
          else if (v === 'vip') window.location.href = '/';
          else if (v === 'gamification') window.location.href = '/';
        }}
        isLight={isLight}
        onToggleTheme={() => setIsLight(prev => !prev)}
        currentChapterTitle="Dictation Studio ETS 2026"
      >
        <main className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-6" style={{ backgroundColor: 'var(--ds-background)' }}>
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <a
                href="/toeic"
                className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
                style={{ color: 'var(--ds-primary)' }}
              >
                <span>← Quay lại TOEIC Hub</span>
              </a>

              {/* TEST SELECTOR */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--ds-text-muted)' }}>Chọn Test:</span>
                <select
                  value={selectedTestNum}
                  onChange={(e) => setSelectedTestNum(parseInt(e.target.value, 10))}
                  className="px-3 py-1.5 rounded-lg border text-xs font-bold"
                  style={{
                    backgroundColor: 'var(--ds-surface)',
                    borderColor: 'var(--ds-border)',
                    color: 'var(--ds-text-primary)'
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
        </main>
      </AppShell2026>
    </>
  );
}
